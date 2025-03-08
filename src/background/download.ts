// 导入所需的解析器
import { ActionType } from "src/types/type.d";
// import m3u8Parser from "../lib/m3u8-parser.min.js";
// import "../lib/mpd-parser.min.js";
import { sendRuntimeMessage, sendTabMessage } from "src/util";

// 替换为正常的 import 语句
// import m3u8Parser from "../lib/m3u8-parser.min.js";
// import { mpdParser } from "../lib/mpd-parser.min.js";
// 导入所需的解析器
importScripts("../lib/m3u8-parser.min.js");
importScripts("../lib/mpd-parser.min.js");

// 存储视频信息的Map
const videoStore = new Map();
// 请求信息
const requestMap = new Map();
// 添加 URL 重试计数器
const urlRetryCounter = new Map<string, number>();
const MAX_RETRY_ATTEMPTS = 5;

// 存储请求头的 Map
const requestHeadersStore = new Map<string, chrome.webRequest.HttpHeader[]>();

// 优化视频格式检测规则
const videoPatterns = {
    mp4: [
        /\.(mp4|m4v)(\?|$)/i,
        /mime_type=video[/_]mp4/i,
        /type=video[/_]mp4/i,
        /content-type=video[/_]mp4/i,
    ],
    m3u8: [/\.(m3u8)(\?|$)/i, /playlist\.m3u8/i, /manifest\.m3u8/i],
    mpd: [
        // 更精确的 MPD/m4s 匹配规则
        /\/manifest\.mpd/i,
        /\/dash\.mpd/i,
        /\/(init|chunk).*\.m4s/i,
        /segment_\d+\.m4s/i,
        /video_\d+\.m4s/i,
        /audio_\d+\.m4s/i,
        /\.(mpd|m4s)(\?|$)/i,
        /manifest\.mpd/i,
        /dash\.mpd/i,
    ],
};

// 添加需要排除的关键词
const excludePatterns = [
    /\.log/i,
    /analytics/i,
    /tracking/i,
    /statistics/i,
    /heartbeat/i,
    /report/i,
    /error/i,
];

// 检测是否为需要排除的请求
const shouldExcludeRequest = (url: string): boolean => {
    return excludePatterns.some((pattern) => pattern.test(url));
};

const siteKeys = {
    "douyin.com": {
        apis: ["douyinvod.com"],
        type: ["mime_type=video_mp4"],
    },
    "tiktok.com": {
        apis: ["tiktok.com"],
        type: ["mime_type=video_mp4"],
    },
    "bilibili.com": {
        apis: ["bilivideo.com", "akamaized.net", "bilivideo.cn"],
        type: ["mp4", "m4s"],
        header: {
            Accept: "*/*",
            "Accept-Language": "zh-CN,zh;q=0.9",
            Origin: "https://www.bilibili.com",
            Referer: "https://www.bilibili.com",
            Range: "bytes=0-",
            "User-Agent": navigator.userAgent,
        },
    },
};

// 支持的网站域名
const unsupportedDomains = ["youtube.com"];

// 检查是否为支持的域名
const isUnsupportedDomain = (url: string) => {
    return unsupportedDomains.some((domain) => url.includes(domain));
};

// 检测视频类型
const detectVideoType = (url: string) => {
    for (const [type, pattern] of Object.entries(videoPatterns)) {
        if (pattern.some((rule) => rule.test(url))) return type;
    }
    return null;
};

// 处理M3U8视频
async function handleM3U8(url, tabId) {
    try {
        const response = await fetch(url);
        const content = await response.text();
        try {
            const parser = new m3u8Parser.Parser();
            parser.push(content);
            parser.end();

            const manifest = parser.manifest;
            const videoInfo = {
                type: "m3u8",
                url: url,
                quality: manifest.playlists ? manifest.playlists.length : 1,
                segments: manifest.segments,
                timestamp: Date.now(),
            };

            addVideoToStore(tabId, videoInfo);
        } catch (error) {}
    } catch (error) {
        console.error("M3U8 parsing error:", error);
    }
}

// 监听请求发送前，保存请求头信息
chrome.webRequest.onSendHeaders.addListener(
    (details) => {
        if (details.requestHeaders) {
            requestHeadersStore.set(details.requestId, details.requestHeaders);
        }
    },
    { urls: ["<all_urls>"] },
    ['requestHeaders', chrome.webRequest.OnBeforeSendHeadersOptions.EXTRA_HEADERS].filter(Boolean)
);

// 监听响应开始，用于更准确地判断资源类型
chrome.webRequest.onResponseStarted.addListener(
    (details) => {
        try {
            const requestHeaders = requestHeadersStore.get(details.requestId);
            const responseHeaders = details.responseHeaders;
            
            // 结合请求头和响应头判断是否为视频资源
            if (isVideoResource(details.url, requestHeaders, responseHeaders)) {
                const videoType = detectVideoTypeWithHeaders(details.url, responseHeaders);
                if (videoType) {
                    handleVideoRequest(details, videoType);
                }
            }
            
            // 清理已使用的请求头
            requestHeadersStore.delete(details.requestId);
        } catch (error) {
            console.error('Error processing response:', error);
        }
    },
    { urls: ["<all_urls>"] },
    ["responseHeaders"]
);

// 清理失败请求的数据
chrome.webRequest.onErrorOccurred.addListener(
    (details) => {
        requestHeadersStore.delete(details.requestId);
        urlRetryCounter.delete(details.url);
    },
    { urls: ["<all_urls>"] }
);

// 根据请求头和响应头判断是否为视频资源
function isVideoResource(
    url: string,
    requestHeaders?: chrome.webRequest.HttpHeader[],
    responseHeaders?: chrome.webRequest.HttpHeader[]
): boolean {
    // 检查 URL 是否匹配视频模式
    if (shouldExcludeRequest(url)) {
        return false;
    }

    // 检查响应头中的 Content-Type
    const contentType = responseHeaders?.find(h => 
        h.name.toLowerCase() === 'content-type'
    )?.value.toLowerCase();

    if (contentType) {
        if (contentType.includes('video/') || 
            contentType.includes('application/dash+xml') ||
            contentType.includes('application/vnd.apple.mpegurl')) {
            return true;
        }
    }

    // 检查请求头中的 Range 和 Accept
    const hasRange = requestHeaders?.some(h => 
        h.name.toLowerCase() === 'range'
    );
    const acceptHeader = requestHeaders?.find(h => 
        h.name.toLowerCase() === 'accept'
    )?.value.toLowerCase();

    if (hasRange && acceptHeader && 
        (acceptHeader.includes('video/') || acceptHeader.includes('*/*'))) {
        return true;
    }

    return false;
}

// 使用响应头增强视频类型检测
function detectVideoTypeWithHeaders(
    url: string,
    responseHeaders?: chrome.webRequest.HttpHeader[]
): string | null {
    const contentType = responseHeaders?.find(h => 
        h.name.toLowerCase() === 'content-type'
    )?.value.toLowerCase();

    if (contentType) {
        if (contentType.includes('video/mp4')) return 'mp4';
        if (contentType.includes('application/vnd.apple.mpegurl')) return 'm3u8';
        if (contentType.includes('application/dash+xml')) return 'mpd';
    }

    // 如果无法从响应头判断，则使用 URL 判断
    return detectVideoType(url);
}

// 处理视频请求
function handleVideoRequest(
    details: chrome.webRequest.WebResponseStartedDetails,
    videoType: string
) {
    const { url, tabId } = details;
    
    // 获取完整的请求头信息
    const requestHeaders = requestHeadersStore.get(details.requestId);
    
    switch (videoType) {
        case 'mp4':
            addVideoToStore(tabId, {
                type: 'mp4',
                url: url,
                timestamp: Date.now(),
                headers: requestHeaders // 保存请求头信息，用于后续下载
            });
            break;
        case 'm3u8':
            handleM3U8(url, tabId, requestHeaders);
            break;
        case 'mpd':
            handleMPD(url, tabId, requestHeaders);
            break;
    }
}

// 修改 handleMPD 函数，添加请求头支持
async function handleMPD(
    url: string,
    tabId: number,
    originalHeaders?: chrome.webRequest.HttpHeader[]
) {
    if (shouldExcludeRequest(url)) return;

    try {
        // 转换请求头格式
        const headers = originalHeaders?.reduce((acc, header) => {
            acc[header.name] = header.value;
            return acc;
        }, {} as Record<string, string>) || {};

        const response = await fetchWithRetry(url, {
            headers: {
                ...headers,
                // 确保必要的头信息存在
                'Range': headers['Range'] || 'bytes=0-',
                'Origin': headers['Origin'] || new URL(url).origin,
                'Referer': headers['Referer'] || 'https://www.bilibili.com/'
            }
        });

        const content = await response.text();
        const manifest = mpdParser.parse(content, { url });

        const videoInfo = {
            type: "mpd",
            url: url,
            quality: manifest.representations?.length || 1,
            segments: manifest.segments,
            timestamp: Date.now(),
        };

        addVideoToStore(tabId, videoInfo);
    } catch (error: any) {
        console.error("MPD parsing error:", error.message);

        // 只有在未超过重试次数时才添加到存储
        const retryCount = urlRetryCounter.get(url) || 0;
        if (retryCount < MAX_RETRY_ATTEMPTS) {
            addVideoToStore(tabId, {
                type: "mpd",
                url: url,
                quality: null,
                segments: null,
                timestamp: Date.now(),
                error: error.message,
            });
        }
    }
}

// 添加视频到存储
function addVideoToStore(tabId, videoInfo) {
    if (!videoStore.has(tabId)) {
        videoStore.set(tabId, new Map());
    }
    const tabVideos = videoStore.get(tabId);
    tabVideos.set(videoInfo.url, videoInfo);
    console.log(tabVideos, "tabVideos");
    // 通知popup更新
    notifyPopup(tabId);
}

// 通知popup更新
function notifyPopup(tabId) {
    sendTabMessage(tabId, {
        type: ActionType.GET_DOWNLOAD_LIST,
        downloadList: Array.from(videoStore.get(tabId).values()),
    });

    // chrome.runtime.sendMessage({
    //     type: "VIDEO_UPDATED",
    //     tabId: tabId,
    //     videos: Array.from(videoStore.get(tabId).values()),
    // });
}

// URL 协议验证的正则表达式
const protocolPattern = /^https?:\/\//i;
const multipleProtocolPattern = /https?:\/\/.*https?:\/\//i;
// 验证 URL 协议
function hasValidProtocol(url) {
    // 检查是否以 http:// 或 https:// 开头
    if (!protocolPattern.test(url)) {
        return false;
    }

    // 检查是否包含多个 http:// 或 https://
    if (multipleProtocolPattern.test(url)) {
        return false;
    }

    return true;
}

// 处理重试逻辑的 fetch 包装函数
async function fetchWithRetry(
    url: string,
    options: RequestInit = {}
): Promise<Response> {
    const retryCount = urlRetryCounter.get(url) || 0;

    if (retryCount >= MAX_RETRY_ATTEMPTS) {
        throw new Error(
            `Maximum retry attempts (${MAX_RETRY_ATTEMPTS}) reached for URL: ${url}`
        );
    }

    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        // 成功后重置计数器
        urlRetryCounter.delete(url);
        return response;
    } catch (error) {
        urlRetryCounter.set(url, retryCount + 1);
        console.warn(`Fetch attempt ${retryCount + 1} failed for URL: ${url}`);
        throw error;
    }
}extractVideoTitle


function onBeforeRequestListener() {
    // 监听网络请求
    chrome.webRequest.onBeforeRequest.addListener(
        (details) => {
            const { url, tabId, initiator, id } = details;

            if (isUnsupportedDomain(url) || shouldExcludeRequest(url)) return;

            // 1. 首先验证 URL 协议
            if (!hasValidProtocol(url)) {
                // console.debug("Invalid URL protocol:", url);
                return false;
            }

            // 2. 尝试解析 URL
            try {
                new URL(url);
            } catch {
                // console.debug("Invalid URL format:", url);
                return false;
            }


            
            const videoType = detectVideoType(url);
            if (!videoType) return;

            

            // // 检查是否已达到最大重试次数
            // const retryCount = urlRetryCounter.get(url) || 0;
            // if (retryCount >= MAX_RETRY_ATTEMPTS) {
            //     console.debug(`Skipping URL due to max retries: ${url}`);
            //     return;
            // }

            const siteKey = Object.keys(siteKeys).find((key) =>
                initiator?.includes(key)
            );

            let info;
            if (siteKey) {
                info = siteKeys[siteKey];
                if (!info.apis.some((api: string) => url.includes(api))) return;

                if (!info.type.some((type: string) => url.includes(type)))
                    return;
            }

            console.log(videoType, "-videoType");

            const tabVideos = videoStore.get(tabId);
            if (tabVideos && tabVideos.has(url)) return;

            console.debug("valid URL:", url);
            switch (videoType) {
                case "mp4":
                    addVideoToStore(tabId, {
                        type: "mp4",
                        url: url,
                        timestamp: Date.now(),
                    });
                    break;
                case "m3u8":
                    handleM3U8(url, tabId);
                    break;
                case "mpd":
                    handleMPD(url, tabId, info);
                    break;
                default:
                    break;
            }
        },
        { urls: ["<all_urls>"] },
        ["requestBody"]
    );
}

export function initDownload() {
    // 监听网络请求
    chrome.webRequest.onBeforeRequest.addListener(
        (details) => {
            const { url, tabId, initiator } = details;

            if (isUnsupportedDomain(url) || shouldExcludeRequest(url)) return;

            // 1. 首先验证 URL 协议
            if (!hasValidProtocol(url)) {
                // console.debug("Invalid URL protocol:", url);
                return false;
            }

            // 2. 尝试解析 URL
            try {
                new URL(url);
            } catch {
                // console.debug("Invalid URL format:", url);
                return false;
            }
            // console.log(url.slice(0, 100), 'url');
            const videoType = detectVideoType(url);
            if (!videoType) return;

            // 检查是否已达到最大重试次数
            const retryCount = urlRetryCounter.get(url) || 0;
            if (retryCount >= MAX_RETRY_ATTEMPTS) {
                console.debug(`Skipping URL due to max retries: ${url}`);
                return;
            }

            const siteKey = Object.keys(siteKeys).find((key) =>
                initiator?.includes(key)
            );

            let info;
            if (siteKey) {
                info = siteKeys[siteKey];
                if (!info.apis.some((api: string) => url.includes(api))) return;

                if (!info.type.some((type: string) => url.includes(type)))
                    return;
            }

            console.log(videoType, "-videoType");

            const tabVideos = videoStore.get(tabId);
            if (tabVideos && tabVideos.has(url)) return;

            console.debug("valid URL:", url);
            switch (videoType) {
                case "mp4":
                    addVideoToStore(tabId, {
                        type: "mp4",
                        url: url,
                        timestamp: Date.now(),
                    });
                    break;
                case "m3u8":
                    handleM3U8(url, tabId);
                    break;
                case "mpd":
                    handleMPD(url, tabId, info);
                    break;
                default:
                    break;
            }
        },
        { urls: ["<all_urls>"] },
        ["requestBody"]
    );

    // 处理标签页关闭
    chrome.tabs.onRemoved.addListener((tabId) => {
        videoStore.delete(tabId);
    });

    // 处理消息
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        switch (message.type) {
            case "GET_VIDEOS":
                const videos = videoStore.get(message.tabId);
                sendResponse(videos ? Array.from(videos.values()) : []);
                break;

            case "DOWNLOAD_VIDEO":
                handleVideoDownload(message.videoInfo);
                break;
        }
        return true;
    });
}

// // 处理视频下载
// async function handleVideoDownload(videoInfo) {
//   switch (videoInfo.type) {
//     case 'mp4':
//       chrome.downloads.download({
//         url: videoInfo.url,
//         filename: `video_${Date.now()}.mp4`
//       });
//       break;

//     case 'm3u8':
//       // 使用content script注入下载器
//       chrome.tabs.query({active: true, currentWindow: true}, ([tab]) => {
//         chrome.tabs.sendMessage(tab.id, {
//           type: 'DOWNLOAD_M3U8',
//           videoInfo: videoInfo
//         });
//       });
//       break;

//     case 'mpd':
//       // 使用content script注入下载器
//       chrome.tabs.query({active: true, currentWindow: true}, ([tab]) => {
//         chrome.tabs.sendMessage(tab.id, {
//           type: 'DOWNLOAD_MPD',
//           videoInfo: videoInfo
//         });
//       });
//       break;
//   }
// }

// 添加下载状态管理
const downloadStates = new Map();

// 更新下载进度
function updateDownloadProgress(downloadId, progress) {
    chrome.runtime.sendMessage({
        type: "DOWNLOAD_PROGRESS",
        downloadId: downloadId,
        progress: progress,
    });
}

// 处理视频下载
async function handleVideoDownload(videoInfo: any) {
    const downloadId = Date.now().toString();

    // 通知开始下载
    chrome.runtime.sendMessage({
        type: "DOWNLOAD_START",
        downloadId: downloadId,
        videoInfo: videoInfo,
    });

    switch (videoInfo.type) {
        case "mp4":
            try {
                const response = await fetch(videoInfo.url);
                const reader = response.body.getReader();
                const contentLength = +response.headers.get("Content-Length");

                let receivedLength = 0;
                const chunks = [];

                while (true) {
                    const { done, value } = await reader.read();

                    if (done) break;

                    chunks.push(value);
                    receivedLength += value.length;

                    // 计算进度
                    const progress = {
                        percent: (receivedLength / contentLength) * 100,
                        downloaded: receivedLength,
                        total: contentLength,
                        speed: calculateSpeed(downloadId, receivedLength),
                    };

                    updateDownloadProgress(downloadId, progress);
                }

                // 合并数据并下载
                const blob = new Blob(chunks);
                const url = URL.createObjectURL(blob);

                chrome.downloads.download({
                    url: url,
                    filename: `video_${Date.now()}.mp4`,
                });

                // 通知下载完成
                chrome.runtime.sendMessage({
                    type: "DOWNLOAD_COMPLETE",
                    downloadId: downloadId,
                });
            } catch (error) {
                console.error("Download failed:", error);
                chrome.runtime.sendMessage({
                    type: "DOWNLOAD_ERROR",
                    downloadId: downloadId,
                    error: error.message,
                });
            }
            break;

        case "m3u8":
            downloadM3U8WithProgress(videoInfo, downloadId);
            break;

        case "mpd":
            downloadMPDWithProgress(videoInfo, downloadId);
            break;
    }
}

// 计算下载速度
const speedCalculator = new Map();
function calculateSpeed(downloadId, receivedLength) {
    const now = Date.now();
    const state = speedCalculator.get(downloadId) || {
        lastCheck: now,
        lastBytes: 0,
    };

    const timeDiff = now - state.lastCheck;
    const bytesDiff = receivedLength - state.lastBytes;

    if (timeDiff >= 1000) {
        // 每秒更新一次
        const speed = bytesDiff / (timeDiff / 1000); // bytes per second
        state.lastCheck = now;
        state.lastBytes = receivedLength;
        speedCalculator.set(downloadId, state);
        return speed;
    }

    return bytesDiff / (timeDiff / 1000);
}

// 处理M3U8下载进度
async function downloadM3U8WithProgress(videoInfo, downloadId) {
    try {
        const segments = videoInfo.segments;
        const totalSegments = segments.length;
        let downloadedSegments = 0;
        const chunks = [];

        for (const segment of segments) {
            const response = await fetch(segment.uri);
            const blob = await response.blob();
            chunks.push(blob);
            downloadedSegments++;

            // 更新进度
            const progress = {
                percent: (downloadedSegments / totalSegments) * 100,
                downloaded: downloadedSegments,
                total: totalSegments,
                speed: calculateSpeed(downloadId, downloadedSegments),
            };

            updateDownloadProgress(downloadId, progress);
        }

        // 合并并下载
        const finalBlob = new Blob(chunks, { type: "video/mp4" });
        const url = URL.createObjectURL(finalBlob);

        chrome.downloads.download({
            url: url,
            filename: `video_${Date.now()}.mp4`,
        });

        chrome.runtime.sendMessage({
            type: "DOWNLOAD_COMPLETE",
            downloadId: downloadId,
        });
    } catch (error) {
        console.error("M3U8 download failed:", error);
        chrome.runtime.sendMessage({
            type: "DOWNLOAD_ERROR",
            downloadId: downloadId,
            error: error.message,
        });
    }
}

// 处理MPD下载进度
async function downloadMPDWithProgress(videoInfo, downloadId) {
    // 类似 M3U8 的实现...
}
