export interface SummaryOptions {
  context?: string;
  sharedContext?: string;
  length?: "short" | "medium" | "long";
  format?: "text" | "markdown" | "html";
  type?: "key-points" | "summary";
}

export interface SummarizerProgress {
  loaded: number;
  total?: number;
}

export interface SummaryResult {
  text: string;
  metadata?: {
    length: number;
    keywords?: string[];
  };
}

export interface ISummarizer {
  availability(): Promise<"available" | "downloading" | "unavailable">;
  create(options: SummaryOptions): Promise<ISummarizer>;
  summarizeStreaming(
    text: string,
    options: SummaryOptions
  ): Promise<ReadableStream<string>>;
  ready: Promise<void>;
  addEventListener(
    event: string,
    handler: (e: SummarizerProgress) => void
  ): void;
}

// 声明全局 Summarizer API
declare global {
  interface Window {
    Summarizer: {
      availability(): Promise<"available" | "downloadable" | "unavailable">;
      create(options: SummaryOptions): Promise<ISummarizer>;
    };
  }
}

import { ActionType } from "src/types/type.d";
import { sendRuntimeMessage } from "src/util";
import { logDebug } from "../../utils/logger";

/**
 * Summarizer service for generating summaries from video transcripts
 */
export default class VideoSummarizer {
  private summarizer: ISummarizer | null;
  private isInitialized: boolean;
  private initializationPromise: Promise<void> | null;

  constructor() {
    this.summarizer = null;
    this.isInitialized = false;
    this.initializationPromise = null;
  }
  public async downloadModel(): Promise<void> {
    // 如果已经初始化，直接返回
    if (this.isInitialized) {
      console.log("Summarizer 已初始化，直接返回");
      return;
    }

    // 如果正在初始化，等待现有的初始化完成
    if (this.initializationPromise) {
      console.log("Summarizer 正在初始化，等待完成...");
      return this.initializationPromise;
    }

    // 开始新的初始化
    console.log("开始初始化 Summarizer...");
    this.initializationPromise = this.performInitialization();

    try {
      await this.initializationPromise;
    } finally {
      this.initializationPromise = null;
    }
  }

  private async performInitialization(): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        if (!("Summarizer" in window)) {
          console.log("Summarizer API 不可用");
          reject(new Error("Summarizer API not loaded"));
          return;
        }
        const availability = await window.Summarizer.availability();

        console.log("--availability", availability);
        if (availability === "unavailable") {
          console.log("Summarizer API 不可用");
          reject(new Error("Summarizer API unavailable"));
          return;
        }

        const options: SummaryOptions = {
          sharedContext: "This is a YouTube video transcript summary.",
          type: "key-points",
          format: "markdown",
          length: "long",
        };

        console.log("开始创建 Summarizer 实例...");
        this.summarizer = await window.Summarizer.create(options);
        console.log("Summarizer 实例创建成功");

        if (availability === "available") {
          // The Summarizer API can be used immediately
          console.log("Summarizer 已就绪，可立即使用");
        } else if (availability === "downloadable") {
          // The Summarizer API can be used after the model is downloaded
          console.log("需要下载模型，开始监听下载进度...");

          if (this.summarizer) {
            // 添加多种事件监听器以获得更多信息
            this.summarizer.addEventListener("downloadprogress", (e) => {
              const progress = e.total
                ? (e.loaded / e.total) * 100
                : e.loaded * 100;
              console.log(
                `Summarizer 模型下载进度: ${progress.toFixed(2)}% (${
                  e.loaded
                }/${e.total || "unknown"})`
              );
            });

            // 添加其他可能的事件监听器
            try {
              this.summarizer.addEventListener("ready", () => {
                console.log("Summarizer ready event fired");
              });
            } catch (e) {
              console.log("ready event listener not supported");
            }

            try {
              this.summarizer.addEventListener("error", (e) => {
                console.error("Summarizer error event:", e);
              });
            } catch (e) {
              console.log("error event listener not supported");
            }

            console.log("等待模型下载完成...");
            console.log("summarizer.ready promise:", this.summarizer.ready);

            // 添加超时机制防止无限等待
            const downloadTimeout = setTimeout(() => {
              console.error("模型下载超时 (5分钟)");
              reject(new Error("Model download timeout after 5 minutes"));
            }, 300000); // 5分钟超时

            try {
              await this.summarizer.ready;
              clearTimeout(downloadTimeout);
              console.log("模型下载完成，Summarizer 已就绪");
            } catch (readyError) {
              clearTimeout(downloadTimeout);
              console.error("等待模型就绪时出错:", readyError);
              throw new Error(`Model ready failed: ${readyError}`);
            }
          } else {
            throw new Error("Failed to create summarizer instance");
          }
        } else {
          console.warn("未处理的 availability 状态:", availability);
        }
        this.isInitialized = true;
        console.log("Summarizer 服务初始化成功");
        resolve();
      } catch (error) {
        console.log("Summarizer 服务初始化失败:", error);
        this.isInitialized = false;
        reject(
          error instanceof Error
            ? error
            : new Error("Failed to initialize summarizer")
        );
      }
    });
  }

  /**
   * Generate summary from text
   * @param {string} text - The text to summarize
   * @param {SummaryOptions} [options] - Summary options
   * @returns {Promise<string | null>} The generated summary or null if generation fails
   */
  public async generateSummary(
    text: string,
    tabId: number,
    options: Partial<SummaryOptions> = {}
  ): Promise<string | null> {
    if (!text?.trim()) {
      logDebug("文本为空，无法生成摘要");
      return null;
    }
    try {
      console.log("开始生成摘要，检查初始化状态...");
      if (!this.isInitialized || !this.summarizer) {
        console.log("Summarizer 未初始化，开始下载模型...");
        await this.downloadModel();
      }

      if (!this.summarizer) {
        throw new Error("Summarizer not initialized after download attempt");
      }

      console.log("Summarizer 已就绪，开始生成摘要...");
      const summaryOptions: SummaryOptions = {
        context:
          options.context || "This is a YouTube video transcript section.",
        length: options.length || "long",
        format: "markdown",
        type: options.type || "key-points",
      };

      console.log("调用 summarizeStreaming...");
      const resultStream = await this.summarizer.summarizeStreaming(text, {
        context:
          "这是一个带时间线的Youtube视频字幕摘要, 请用中文生成摘要，并在摘要标注时间段",
      });

      console.log("开始处理流式响应...");
      let summary = ""; // 处理流式响应
      const reader = resultStream.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          console.log("流式响应完成");
          break;
        }

        summary += value;
        console.log("收到流式数据，当前摘要长度:", summary.length);

        // 触发进度更新事件
        sendRuntimeMessage(tabId, {
          type: ActionType.SUMMARIZING,
          tabId,
          payload: {
            text: summary,
            complete: false,
          },
        });
      }

      console.log("摘要生成完成，总长度:", summary.length);
      // 触发完成事件
      sendRuntimeMessage(tabId, {
        type: ActionType.SUMMARIZE_DONE,
        tabId,
        payload: {
          text: summary,
          complete: true,
        },
      });

      console.log("摘要生成流程完成");
      return summary;
    } catch (error) {
      console.error("生成摘要失败:", error);
      logDebug("生成摘要失败:", error);

      if (
        typeof error === "object" &&
        error !== null &&
        "name" in error &&
        (error as any).name === "QuotaExceededError"
      ) {
        const e = error as any;
        console.error(
          `Input too large! You tried to summarize ${e.requested} tokens, but only ${e.quota} were available.`
        );

        // Or maybe:
        console.error(
          `Input too large! It's ${
            e.requested / e.quota
          }x as large as the maximum possible input size.`
        );
      }
      return null;
    }
  }

  public async getSubtitleByUrl(url: string) {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    const data = await response.json();
    const res = await this.parseSubtitleText(data);

    return res;
  }

  public async parseSubtitleText(captionData: any) {
    if (captionData.events) {
      // 提取所有文本片段（包含时间信息）
      let transcriptText = "";
      let currentStartTime = 0;

      for (const event of captionData.events) {
        // 只处理包含文本的事件
        if (event.segs && event.segs.some((seg: any) => seg.utf8)) {
          // 获取开始时间（毫秒转为秒）
          if (event.tStartMs !== undefined) {
            currentStartTime = Math.floor(event.tStartMs / 1000);
          }

          // 格式化时间为 [MM:SS] 格式
          const minutes = Math.floor(currentStartTime / 60);
          const seconds = currentStartTime % 60;
          const timeStamp = `[${minutes.toString().padStart(2, "0")}:${seconds
            .toString()
            .padStart(2, "0")}] `;

          // 收集这个时间点的所有文本
          let lineText = "";
          for (const seg of event.segs) {
            if (seg.utf8) {
              lineText += seg.utf8;
            }
          }

          if (lineText.trim()) {
            transcriptText += timeStamp + lineText.trim() + "\n";
          }
        }
      }

      const transcript = transcriptText.trim();

      // Apply content filtering
      const filteredTranscript = this.filterSubtitleContent(transcript);

      console.log(
        "处理后的字幕:",
        filteredTranscript.substring(0, 500) + "..."
      );
      logDebug(`成功提取并过滤字幕，共 ${filteredTranscript.length} 个字符`);
      return filteredTranscript.substring(0, 5000);
    }
  }

  public filterSubtitleContent(text: string): string {
    // Split text into lines
    const lines = text.split("\n");

    // Filter out unwanted lines and clean up the content
    const filteredLines = lines
      .filter((line) => {
        // Skip empty lines
        if (!line.trim()) return false;

        // Extract the content after timestamp
        const content = line.substring(line.indexOf("]") + 1).trim();

        // Filter conditions:
        // 1. Skip lines with only timestamp and brackets content
        // 2. Skip lines with single character content
        // 3. Skip music lyrics (starting with ♪)
        // 4. Skip empty content after timestamp
        return !(
          (
            (content.startsWith("[") && content.endsWith("]")) || // Only brackets content
            content.length === 1 || // Single character
            content.startsWith("♪") || // Music lyrics
            !content
          ) // Empty content
        );
      })
      .map((line) => {
        // Keep timestamp and clean up the content
        const timestamp = line.substring(0, line.indexOf("]") + 1);
        const content = line.substring(line.indexOf("]") + 1).trim();
        return `${timestamp}${content}`;
      });

    // Join filtered lines without newlines, but add space between entries
    // to prevent words from running together
    return filteredLines.join(" ");
  }

  /**
   * Check if the service is initialized
   */
  public isReady(): boolean {
    return this.isInitialized && this.summarizer !== null;
  }

  /**
   * Reset the service state
   */
  public reset(): void {
    this.summarizer = null;
    this.isInitialized = false;
  }
}
