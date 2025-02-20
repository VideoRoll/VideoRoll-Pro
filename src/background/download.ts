// 导入所需的解析器
import { ActionType } from "src/types/type.d";
// import m3u8Parser from "../lib/m3u8-parser.min.js";
// import "../lib/mpd-parser.min.js";
import { sendRuntimeMessage } from "src/util";
// 导入所需的解析器
importScripts("../lib/m3u8-parser.min.js");
importScripts("../lib/mpd-parser.min.js");

// 存储视频信息的Map
const videoStore = new Map();

// 视频格式检测
const videoPatterns = {
    mp4: [
        /\.(mp4|m4v)(\?|$)/i,
        /mime_type=video[/_]mp4/i,
        /type=video[/_]mp4/i,
        /content-type=video[/_]mp4/i,
    ],
    m3u8: [/\.(m3u8)(\?|$)/i, /playlist\.m3u8/i, /manifest\.m3u8/i],
    mpd: [/\.(mpd|m4s)(\?|$)/i, /manifest\.mpd/i, /dash\.mpd/i],

    // mp4: /\.(mp4|m4v)(\?|$)/i,
    // m3u8: /\.(m3u8)(\?|$)|\/playlist/i,
    // mpd: /\.(m4s)(\?|$)|\/manifest/i,
};

const siteKeys = {
    "douyin.com": {
        apis: ["douyinvod.com"],
        type: "mime_type=video_mp4",
    },
    "tiktok.com": {
        apis: ["tiktok.com"],
        type: "mime_type=video_mp4",
    },
    "bilibili.com": {
        apis: ["bilivideo.com", "akamaized.net", "bilivideo.cn"],
        type: "mp4",
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

// 处理MPD视频
async function handleMPD(url, tabId) {
    console.log(url, "-url");
    try {
        const response = await fetch(url, {
            mode: "no-cors", // 或者 'no-cors'
            headers: {
                Accept: "*/*",
                "Accept-Language": "zh-CN,zh;q=0.9",
                Origin: "https://www.bilibili.com",
                Referer: "https://www.bilibili.com",
                Range: "bytes=0-", // 视频流请求通常需要 Range header
                "User-Agent": navigator.userAgent,
            },
        });
        const content = await response.text();
        const manifest = mpdParser.parse(content, { url });

        const videoInfo = {
            type: "mpd",
            url: url,
            quality: manifest.representations.length,
            segments: manifest.segments,
            timestamp: Date.now(),
        };

        addVideoToStore(tabId, videoInfo);
    } catch (error: any) {
        console.error("MPD parsing error:", error.message);
        addVideoToStore(tabId, {
            type: "mpd",
            url: url,
            quality: null,
            segments: null,
            timestamp: Date.now(),
        });
    }
}

// 添加视频到存储
function addVideoToStore(tabId, videoInfo) {
    if (!videoStore.has(tabId)) {
        videoStore.set(tabId, new Map());
    }
    const tabVideos = videoStore.get(tabId);
    tabVideos.set(videoInfo.url, videoInfo);
    console.log(tabVideos, 'tabVideos')
    // 通知popup更新
    notifyPopup(tabId);
}

// 通知popup更新
function notifyPopup(tabId) {
    setTimeout(() => {
        sendRuntimeMessage(tabId, {
            type: ActionType.GET_DOWNLOAD_LIST,
            downloadList: Array.from(videoStore.get(tabId).values()),
        });
    })
    
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

export function initDownload() {
    // 监听网络请求
    chrome.webRequest.onBeforeRequest.addListener(
        (details) => {
            const { url, tabId, initiator } = details;

            if (isUnsupportedDomain(url)) return;

            // 1. 首先验证 URL 协议
            if (!hasValidProtocol(url)) {
                console.debug("Invalid URL protocol:", url);
                return false;
            }

            // 2. 尝试解析 URL
            try {
                new URL(url);
            } catch {
                console.debug("Invalid URL format:", url);
                return false;
            }
            // console.log(url.slice(0, 100), 'url');
            const videoType = detectVideoType(url);
            if (!videoType) return;
            
            const siteKey = Object.keys(siteKeys).find((key) =>
                initiator?.includes(key)
            );
            if (siteKey) {
                const info = siteKeys[siteKey];
                if (!info.apis.some((api: string) => url.includes(api))) return;

                if (!url.includes(info.type)) return;
            }

            console.log(videoType, "-videoType");

            const tabVideos = videoStore.get(tabId);
            if (tabVideos && tabVideos.has(url)) return;

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
                    handleMPD(url, tabId);
                    break;
                default:
                    break;
            }
        },
        { urls: ["<all_urls>"] }
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
async function handleVideoDownload(videoInfo) {
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
