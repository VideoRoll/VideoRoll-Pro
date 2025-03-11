import * as m3u8Parser from 'm3u8-parser'
import * as aesDecrypter from 'aes-decrypter'

export interface M3U8DownloaderOptions {
  // m3u8地址
  url?: string
  // 所有分片全部下载成功后自动下载（默认true）
  autoDownload?: boolean
  // 下载时的文件名称
  filename?: string
  // 失败重试次数
  retryNum?: number
  // 排除流，字符串或正则 数组
  excludes?: (string | RegExp)[]
  // 输出MP4格式（默认true）
  outputMp4?: boolean
  // 最大请求并行数
  maxParallelNum?: number
  // 打印日志
  log?: boolean
  // 解析完成回调
  onParsed?: (segments: TSegmentType[]) => void
  // 数据更新回调
  onUpdated?: (
    item: TSegmentType,
    index: number,
    segments: TSegmentType[]
  ) => void
  // 下载完成回调
  onDownloaded?: (blob: Blob) => void

  onProgress?: (progress: number, currentIndex: number, totalSegments: number) => void
}

export type TSegmentStatusType = 'waiting' | 'pending' | 'success' | 'error'

export type TSegmentKeyType = {
  method: string
  uri: string
  iv: string
}

export type TSegmentType = {
  uri: string
  duration: number
  title: string
  timeline: number
  key?: TSegmentKeyType
  data: Uint8Array
  status: TSegmentStatusType
}

// 常量配置
const DEFAULT_CONFIG = {
  AUTO_DOWNLOAD: true,
  RETRY_NUM: 3,
  OUTPUT_MP4: false,
  FILENAME: Date.now().toString(),
  MAX_PARALLEL_NUM: 5,
  LOG: false
} as const

// 错误类型
type TErrorCode =
  | 'INVALID_URL'
  | 'FETCH_ERROR'
  | 'PARSE_ERROR'
  | 'DOWNLOAD_ERROR'
  | 'MERGE_ERROR'

class M3U8DownloaderError extends Error {
  constructor(message: string, public readonly code: TErrorCode) {
    super(message)
    this.name = 'M3U8DownloaderError'
  }
}

export class M3U8Downloader {
  private url: string
  private readonly autoDownload: boolean
  private readonly filename: string
  private readonly retryNum: number
  private readonly excludes?: (string | RegExp)[]
  private readonly outputMp4: boolean
  private readonly maxParallelNum: number
  private readonly log: boolean
  private readonly allAesKeys: Map<string, Promise<Uint32Array>> = new Map()
  private readonly onUpdated?: M3U8DownloaderOptions['onUpdated']
  private readonly onParsed?: M3U8DownloaderOptions['onParsed']
  private readonly onDownloaded?: M3U8DownloaderOptions['onDownloaded']
  private readonly onProgress?: M3U8DownloaderOptions['onProgress']
  private segments: TSegmentType[] = []
  private duration: number = 0
  public status: TSegmentStatusType = 'waiting'
  private readonly controller: AbortController
  public progress: number = 0

  constructor(options: M3U8DownloaderOptions) {
    const {
      url = '',
      autoDownload = DEFAULT_CONFIG.AUTO_DOWNLOAD,
      filename = DEFAULT_CONFIG.FILENAME,
      retryNum = DEFAULT_CONFIG.RETRY_NUM,
      excludes,
      outputMp4 = DEFAULT_CONFIG.OUTPUT_MP4,
      maxParallelNum = DEFAULT_CONFIG.MAX_PARALLEL_NUM,
      log = DEFAULT_CONFIG.LOG,
      onUpdated,
      onParsed,
      onDownloaded,
      onProgress
    } = options

    this.url = url
    this.autoDownload = autoDownload
    this.filename = filename
    this.retryNum = retryNum
    this.excludes = excludes
    this.outputMp4 = outputMp4
    this.maxParallelNum = maxParallelNum
    this.log = log
    this.onUpdated = onUpdated
    this.onParsed = onParsed
    this.onDownloaded = onDownloaded
    this.onProgress = onProgress
    this.controller = new AbortController()
  }

  // 开始下载
  async start() {
    this.status = 'pending'
    this.segments = []
    await this.parserM3u8()
    await this.startDownloadAllTs()
  }

  // 设置m3u8地址
  setUrl(url: string) {
    this.url = url
  }

  // 解析m3u8文件
  async parserM3u8() {
    if (!this.url?.trim()?.endsWith('.m3u8')) {
      throw new M3U8DownloaderError('无效的m3u8地址！', 'INVALID_URL')
    }
    if (this.log) console.log('开始请求并解析m3u8内容...')
    try {
      const response = await fetch(this.url)
      if (!response.ok) {
        throw new M3U8DownloaderError(
          `请求未能获取m3u8内容: ${response.status}`,
          'FETCH_ERROR'
        )
      }
      const content = await response.text()
      const parser = new m3u8Parser.Parser()
      parser.push(content)
      parser.end()
      this.segments = this.filterSegments(parser.manifest.segments)
      this.onParsed?.(this.segments)
      if (this.log) console.log('M3U8解析完成！', this.segments)
    } catch (error) {
      this.status = 'error'
      throw new M3U8DownloaderError(
        `请求并解析m3u8失败: ${(error as M3U8DownloaderError).message}`,
        'PARSE_ERROR'
      )
    }
  }

  // 过滤排除的segment
  filterSegments(segments: TSegmentType[]) {
    if (!segments.length) return segments
    return segments.flatMap((item) => {
      const url = new URL(item.uri, this.url).href
      if (this.excludes?.length) {
        for (let i = 0; i < this.excludes.length; i++) {
          const item = this.excludes[i]
          if (typeof item === 'string' && url.includes(item)) {
            return []
          } else if (item instanceof RegExp && item.test(url)) {
            return []
          }
        }
      }
      return {
        ...item,
        uri: url,
        status: 'waiting' as TSegmentStatusType
      }
    })
  }

  // 计算视频总时长
  calculateDuration() {
    let duration = 0
    if (this.segments?.length) {
      duration = this.segments.reduce((prev, cur) => prev + cur.duration, 0)
    }
    this.duration = duration
    return this.duration
  }

  // 获取aesKey
  async getAESKey(uri: string) {
    const url = new URL(uri, this.url).href
    let promise = this.allAesKeys.get(url)
    if (!promise) {
      promise = (async () => {
        const response = await fetch(url)
        const buffer = await response.arrayBuffer()
        const view = new DataView(buffer)
        return new Uint32Array([
          view.getUint32(0),
          view.getUint32(4),
          view.getUint32(8),
          view.getUint32(12)
        ])
      })()
      this.allAesKeys.set(url, promise)
    }
    return promise
  }

  // 解密Ts
  async decryptTs(
    data: Uint8Array,
    segmentKey: TSegmentKeyType
  ): Promise<Uint8Array> {
    const iv = segmentKey.iv || new Uint32Array([0, 0, 0, 0])
    const key = await this.getAESKey(segmentKey.uri)
    return new aesDecrypter.decrypt(data, key, iv)
  }

  // 下载指定下标的ts文件段
  async downloadTsByIndex(index: number) {
    const segment = this.segments[index]
    return this.downloadTs(segment, index)
  }

  /**
   * 下载ts文件
   * @param segment segment
   * @returns
   */
  async downloadTs(segment: TSegmentType, index: number) {
    const progress = `${index + 1}/${this.segments.length}`
    if (this.log) console.log(`${progress}：开始下载片段 ${segment.uri}`)
    const data = await this.downloadTsAndErrorRetry(
      segment,
      index,
      this.retryNum
    )
    const currentIndex = index + 1
    this.progress = (currentIndex / this.segments.length) * 100;
    this.onProgress(this.progress, index + 1, this.segments.length);
    if (this.log) {
        
        console.log(`%c${progress}：片段下载完成 ${segment.uri}`, 'color:green')
    }
    return data
  }

  /**
   * 下载ts文件，如果失败则重试
   * @param segment segment
   * @param index 当前下标
   * @param retryCount 重试次数
   */
  async downloadTsAndErrorRetry(
    segment: TSegmentType,
    index: number,
    retryCount: number
  ): Promise<Uint8Array> {
    segment.status = 'pending'
    try {
      const response = await fetch(segment.uri, {
        signal: this.controller.signal,
        headers: {
          Accept: 'video/MP2T,video/mp2t,application/octet-stream'
        }
      })

      if (!response.ok) {
        throw new M3U8DownloaderError(
          `片段下载失败: ${response.status}`,
          'DOWNLOAD_ERROR'
        )
      }

      let data = new Uint8Array(await response.arrayBuffer())
      if (segment.key) {
        data = await this.decryptTs(data, segment.key)
      }
      segment.status = 'success'
      segment.data = data
      if (typeof this.onUpdated === 'function') {
        this.onUpdated(segment, index, this.segments)
      }
      return data
    } catch (e) {
      if (retryCount > 0) {
        return await this.downloadTsAndErrorRetry(
          segment,
          index,
          retryCount - 1
        )
      } else {
        if (this.log) {
          const progress = `${index + 1}/${this.segments.length}`
          const currentIndex = index + 1;
          this.progress = (currentIndex / this.segments.length) * 100;
          this.onProgress(this.progress, index + 1, this.segments.length);
          console.log(
            `%c${progress}：片段下载失败 ${segment.uri}。`,
            'color:red'
          )
        }
        segment.status = 'error'
        if (typeof this.onUpdated === 'function') {
          this.onUpdated(segment, index, this.segments)
        }
        throw e
      }
    }
  }

  /**
   * 队列执行函数
   * @param asyncFunction 异步函数
   * @param params  参数数组
   * @param maxConcurrent  最大并发数
   * @returns 结果数组
   */
  async executeAsyncFunctionInQueue<T, K>(
    asyncFunction: (item: K, index: number) => Promise<T>,
    items: K[],
    maxConcurrent: number = 10
  ): Promise<Array<T | Error>> {
    const queue = [...items]
    const results: Array<T | Error> = new Array(items.length)
    const executing = new Set<Promise<void>>()

    const executeNext = async (): Promise<void> => {
      if (queue.length === 0) return

      const currentIndex = items.length - queue.length
      const item = queue.shift()!

      const promise = (async () => {
        try {
          const result = await asyncFunction.call(this, item, currentIndex)
          results[currentIndex] = result
        } catch (error) {
          results[currentIndex] =
            error instanceof Error ? error : new Error(String(error))
        }
      })()

      executing.add(promise)
      await promise
      executing.delete(promise)

      if (queue.length > 0) {
        await executeNext()
      }
    }

    const workers = Array.from(
      { length: Math.min(maxConcurrent, queue.length) },
      () => executeNext()
    )

    await Promise.all(workers)
    return results
  }

  // 开始下载全部ts文件
  async startDownloadAllTs() {
    if (this.log) console.log('开始下载全部ts文件')
    await this.executeAsyncFunctionInQueue(
      this.downloadTs,
      this.segments,
      this.maxParallelNum
    )
    const isError = this.segments.some((segment) => !segment.data)
    if (this.log)
      console.log(`全部ts文件下载完成，${isError ? '有错误' : '无错误'}`)
    if (!isError && this.autoDownload) {
      this.download()
    } else {
      this.status = 'error'
      return {
        isError,
        segments: this.segments
      }
    }
  }

  // 合并所有ts文件
  async mergeSegments(): Promise<Blob> {
    if (this.log) console.log('开始合并片段...', this.segments)

    const validSegments = this.segments
      .filter((segment) => segment.status === 'success' && segment.data)
      .map((segment) => segment.data)

    if (validSegments.length === 0) {
      throw new M3U8DownloaderError('没有有效的片段合并', 'MERGE_ERROR')
    }

    if (this.outputMp4) {
      const mp4Segments = await this.transcodeToMp4ByMux(validSegments)
      return new Blob(mp4Segments, { type: 'video/mp4' })
    }

    return new Blob(validSegments, { type: 'video/mp2t' })
  }

  // 使用mux.js转码为mp4
  async transcodeToMp4ByMux(segments?: Uint8Array[]): Promise<Uint8Array[]> {
    if (this.log) console.log('开始转码MP4')
    if (!window.muxjs) await import('../lib/mux-mp4.min.js')
    if (!segments) {
      segments = this.segments
        .filter((segment) => segment.status === 'success' && segment.data)
        .map((segment) => segment.data)
    }
    const buffer = new Uint8Array(await new Blob(segments).arrayBuffer())
    return new Promise((resolve) => {
      const duration = this.calculateDuration()
      const transmuxer = new window.muxjs.Transmuxer({
        keepOriginalTimestamps: true,
        duration
      })
      transmuxer.on(
        'data',
        (segment: { initSegment: Uint8Array; data: Uint8Array }) => {
          resolve([segment.initSegment, segment.data])
        }
      )
      transmuxer.push(buffer)
      transmuxer.flush()
    })
  }

  // 下载最终文件
  async download() {
    const blob = await this.mergeSegments()
    if (typeof this.onDownloaded === 'function') this.onDownloaded(blob)
    if (this.log) console.log('数据准备完成，开始下载')
    this.saveAs(blob)
    this.status = 'success'
  }

  // 保存文件
  saveAs(blob: Blob) {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${this.filename}.${this.outputMp4 ? 'mp4' : 'ts'}`
    document.body.appendChild(a)
    a.click()
    URL.revokeObjectURL(a.href)
    document.body.removeChild(a)
  }

  // 取消下载
  abort(): void {
    this.controller.abort()
  }
}