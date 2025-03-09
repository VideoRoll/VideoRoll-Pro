import { ActionType } from "src/types/type.d";
import { sendTabMessage } from "src/util";

// 替换为正常的 import 语句
import { Parser } from "m3u8-parser";
import { parse } from "mpd-parser";
import VideoDownloader from "./VideoDownloader";

export default class VideoDetector {
    videoList: Map<number, any> = new Map<number, any>();
    requestMap: Map<string, any> = new Map<string, any>();
    hlsContentMap: Map<string, any> = new Map<string, any>();
    downloader: any = null;
    unSupportedDomains: any = {
        "youtube.com": {
            browser: "chrome",
        },
    };
    // 优化视频格式检测规则
    videoPatterns: any = {
        MP4: [
            /\.(mp4|m4v)(\?|$)/i,
            /mime_type=video[/_]mp4/i,
            /type=video[/_]mp4/i,
            /content-type=video[/_]mp4/i,
        ],
        HLS: [
            /\.(m3u8)(\?|$)/i,
            /playlist\.m3u8/i,
            /manifest\.m3u8/i,
            /manifest/i,
            /hls_\d+/i,
        ],
        DASH: [
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

    constructor() {
        this.onDownloadListener();
        this.onRemovedListener();
        this.onUpdateListener();
        this.onBeforeRequestListener();
        this.onSendHeadersListener();
        this.onResponseStartListener();
    }

    onDownloadListener() {
        this.downloader = new VideoDownloader();
    }

    onRemovedListener() {
        // 处理标签页关闭
        chrome.tabs.onRemoved.addListener((tabId) => {
            console.log("removed");
            this.videoList.delete(tabId);

            for (const [key, value] of this.requestMap.entries()) {
                if (value.tabId === tabId) {
                    this.requestMap.delete(key);
                }
            }
        });
    }

    onUpdateListener() {
        chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
            if (changeInfo.status === "loading" || changeInfo.url) {
                console.log('update page');
                this.videoList.delete(tabId);
                console.log('update page')
                for (const [key, value] of this.requestMap.entries()) {
                    if(value.tabId === tabId) {
                        this.requestMap.delete(key);
                    }
                }
            }
        });
    }

    onBeforeRequestListener() {
        // 监听网络请求
        chrome.webRequest.onBeforeRequest.addListener(
            (details) => {
                const { url, tabId, initiator, requestId, timeStamp, type } =
                    details;
                if (tabId === -1) return;

                if (!["media", "xmlhttprequest"].includes(type)) return;
                // if (isUnsupportedDomain(url) || shouldExcludeRequest(url))
                //     return;

                // 1. 首先验证 URL 协议
                if (!this.hasValidProtocol(url)) {
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

                const videoType = this.detectVideoType(url);
                if (!videoType) return;

                const request = this.requestMap.get(requestId);

                if (request) return;

                for (const [key, value] of this.requestMap.entries()) {
                    if (value.url === url) return;
                }

                this.requestMap.set(requestId, {
                    ...(request ?? {}),
                    id: requestId,
                    url,
                    tabId,
                    timeStamp,
                    type,
                    videoType,
                });

                return;
                // // 检查是否已达到最大重试次数
                // const retryCount = urlRetryCounter.get(url) || 0;
                // if (retryCount >= MAX_RETRY_ATTEMPTS) {
                //     console.debug(`Skipping URL due to max retries: ${url}`);
                //     return;
                // }
            },
            { urls: ["<all_urls>"] },
            ["requestBody"]
        );
    }

    onSendHeadersListener() {
        // 监听请求发送前，保存请求头信息
        chrome.webRequest.onSendHeaders.addListener(
            (details) => {
                const {
                    requestHeaders,
                    url,
                    tabId,
                    initiator,
                    requestId,
                    timeStamp,
                    type,
                } = details;

                // 检查请求头中的
                const isPlaylist = requestHeaders?.some(
                    (h) =>
                        h.name.toLowerCase() ===
                            "x-extension-playlist-request" &&
                        h.value?.toLowerCase() === "video-roll"
                );

                if (tabId === -1 && !isPlaylist) return;

                if (!["media", "xmlhttprequest"].includes(type)) return;

                if (requestHeaders) {
                    const request = this.requestMap.get(requestId);
                    let currentTabId = tabId;
                    if (isPlaylist) {
                        currentTabId =
                            requestHeaders.find(
                                (v) => v.name === "X-Extension-Tab-Id"
                            )?.value ?? tabId;
                    }

                    if (request) {
                        if (request.url === url && request.requestHeaders)
                            return;

                        this.requestMap.set(requestId, {
                            ...(request ?? {}),
                            id: requestId,
                            requestHeaders,
                            timeStamp,
                            type,
                            url,
                            tabId: currentTabId,
                        });
                    } else if (isPlaylist) {
                        this.requestMap.set(requestId, {
                            ...(request ?? {}),
                            id: requestId,
                            requestHeaders,
                            timeStamp,
                            type,
                            url,
                            tabId: currentTabId,
                        });
                    }
                }
            },
            { urls: ["<all_urls>"] },
            [
                "requestHeaders",
                chrome.webRequest.OnBeforeSendHeadersOptions.EXTRA_HEADERS,
            ].filter(Boolean)
        );
    }

    onResponseStartListener() {
        // 监听响应开始，用于更准确地判断资源类型
        chrome.webRequest.onResponseStarted.addListener(
            (details) => {
                try {
                    const {
                        responseHeaders,
                        url,
                        tabId,
                        initiator,
                        requestId,
                        timeStamp,
                        type,
                    } = details;

                    const request = this.requestMap.get(requestId);

                    if (!request) return;

                    const isPlaylist = request.requestHeaders?.some(
                        (h) =>
                            h.name.toLowerCase() ===
                                "x-extension-playlist-request" &&
                            h.value?.toLowerCase() === "video-roll"
                    );

                    if (tabId === -1 && !isPlaylist) return;

                    if (!["media", "xmlhttprequest"].includes(type)) return;

                    // if (request.url === url && !request.requestHeaders)

                    // 结合请求头和响应头判断是否为视频资源
                    if (
                        this.isVideoResource(
                            request.videoType,
                            request.requestHeaders,
                            responseHeaders
                        )
                    ) {
                        const videoType = this.detectVideoTypeWithHeaders(
                            request.videoType,
                            details.url,
                            responseHeaders
                        );
                        if (videoType) {
                            this.requestMap.set(requestId, {
                                ...(request ?? {}),
                                responseHeaders,
                                id: requestId,
                                timeStamp,
                                type,
                                url,
                            });
                            const target = this.requestMap.get(requestId);
                            this.handleVideoRequest(target, videoType);
                        }
                    } else {
                        this.requestMap.delete(requestId);
                    }
                } catch (error) {
                    console.error("Error processing response:", error);
                }
            },
            { urls: ["<all_urls>"] },
            ["responseHeaders"]
        );
    }

    // 检查 URL 协议是否有效
    hasValidProtocol(url: string) {
        // URL 协议验证的正则表达式
        const protocolPattern = /^https?:\/\//i;
        const multipleProtocolPattern = /https?:\/\/.*https?:\/\//i;

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

    // 检测视频类型
    detectVideoType(url: string) {
        for (const [type, pattern] of Object.entries(this.videoPatterns)) {
            if (pattern.some((rule) => rule.test(url))) return type;
        }
        return null;
    }

    isVideoResource(url: string, requestHeaders: any, responseHeaders: any) {
        // 检查响应头中的 Content-Type
        const contentType = responseHeaders
            ?.find((h) => h.name.toLowerCase() === "content-type")
            ?.value.toLowerCase();

        // 视频相关的MIME类型列表
        const videoMimeTypes = [
            // 视频格式
            "video/", // 所有视频类型
            "application/mp4", // MP4
            "application/octet-stream", // 二进制流，可能是视频
            // 流媒体格式
            "application/m4s",
            "application/octet-stream-m3u8",
            "application/vnd.yt-ump",            
            "application/dash+xml", // DASH
            "application/vnd.apple.mpegurl", // HLS
            "application/x-mpegurl", // HLS 替代
            "application/mpegurl", // HLS 替代
            "audio/mpegurl", // HLS 音频
            "audio/x-mpegurl", // HLS 音频替代
            "video/mp2t", // MPEG-TS
            // 音频格式（有些视频可能被标记为音频）
            "audio/mp4", // MP4 音频
            "audio/mpeg", // MP3
            "audio/aac", // AAC
            // 片段格式
            "video/iso.segment", // DASH 片段
            "audio/iso.segment", // DASH 音频片段
        ];

        // 通过Content-Type检测
        if (contentType) {
            if (
                videoMimeTypes.some((mimeType) =>
                    contentType.includes(mimeType)
                )
            ) {
                return true;
            }
        }

        // 检查响应头中的 Content-Disposition
        const contentDisposition = responseHeaders
            ?.find((h) => h.name.toLowerCase() === "content-disposition")
            ?.value.toLowerCase();

        if (contentDisposition) {
            // 检查是否包含视频文件名
            if (contentDisposition.includes("filename=")) {
                const videoExtensions = [
                    ".mp4",
                    ".m4v",
                    ".webm",
                    ".mkv",
                    ".flv",
                    ".mov",
                    ".m3u8",
                    ".mpd",
                    ".m4s",
                    ".ts",
                ];
                if (
                    videoExtensions.some((ext) =>
                        contentDisposition.includes(ext)
                    )
                ) {
                    return true;
                }
            }
        }

        // 检查请求头中的 Range 和 Accept
        const hasRange = requestHeaders?.some(
            (h) => h.name.toLowerCase() === "range"
        );
        const acceptHeader = requestHeaders
            ?.find((h) => h.name.toLowerCase() === "accept")
            ?.value.toLowerCase();

        // 增强 Range 请求检测
        if (hasRange) {
            // 如果有 Range 头，并且 Accept 头包含视频类型或通配符
            if (
                acceptHeader &&
                (acceptHeader.includes("video/") ||
                    acceptHeader.includes("audio/") ||
                    acceptHeader.includes("*/*"))
            ) {
                // 如果 URL 也匹配视频格式，则更有可能是视频资源
                // if (urlVideoType) {
                //     return true;
                // }

                // 检查响应大小，大文件更可能是视频
                const contentLength = responseHeaders?.find(
                    (h) => h.name.toLowerCase() === "content-length"
                )?.value;

                if (contentLength) {
                    // 大于1MB
                    return true;
                }
            }
        }

        // 检查请求头中的 Referer，某些视频请求可能来自视频播放页面
        // const referer = requestHeaders?.find(h =>
        //     h.name.toLowerCase() === 'referer'
        // )?.value.toLowerCase();

        // if (referer &&
        //     (referer.includes('/video/') ||
        //      referer.includes('/play/') ||
        //      referer.includes('/watch') ||
        //      referer.includes('/movie/') ||
        //      referer.includes('/episode/'))) {
        //     // 如果 URL 也匹配视频格式，则更有可能是视频资源
        //     if (urlVideoType) {
        //         return true;
        //     }
        // }

        // 检查URL路径是否包含视频相关关键词
        // const videoPathKeywords = ['/video/', '/media/', '/stream/', '/play/', '/watch/', '/movie/', '/episode/', '/hls/', '/dash/'];
        // if (videoPathKeywords.some(keyword => url.includes(keyword))) {
        //     return true;
        // }

        // 检查响应头中的其他特征
        const acceptRanges = responseHeaders
            ?.find((h) => h.name.toLowerCase() === "accept-ranges")
            ?.value.toLowerCase();

        if (acceptRanges === "bytes") {
            // 支持范围请求且URL匹配视频格式，可能是视频
            return true;
        }

        return false;
    }

    // 使用响应头增强视频类型检测
    detectVideoTypeWithHeaders(
        videoType: string,
        url: string,
        responseHeaders?: chrome.webRequest.HttpHeader[]
    ): string | null {
        const contentType = responseHeaders
            ?.find((h) => h.name.toLowerCase() === "content-type")
            ?.value.toLowerCase();

        if (contentType) {
            // MP4 格式检测
            if (
                contentType.includes("video/mp4") ||
                contentType.includes("application/mp4") ||
                contentType.includes("video/mpeg4") ||
                contentType.includes("video/quicktime") ||
                contentType.includes("video/x-msvideo") ||
                contentType.includes("video/x-matroska")
            ) {
                return "MP4";
            }

            // 音频格式检测 (有些视频可能被标记为音频)
            if (
                (contentType.includes("audio/mp4") ||
                    contentType.includes("audio/mpeg")) &&
                (url.includes(".mp4") || url.includes(".m4a"))
            ) {
                return "MP4";
            }

            // HLS 格式检测
            if (
                contentType.includes("application/vnd.apple.mpegurl") ||
                contentType.includes("application/x-mpegurl") ||
                contentType.includes("application/mpegurl") ||
                contentType.includes("audio/mpegurl") ||
                contentType.includes("audio/x-mpegurl") ||
                contentType.includes("application/vnd.apple.mpegurl.audio")
            ) {
                return "HLS";
            }

            // DASH 格式检测
            if (contentType.includes("application/dash+xml")) {
                return "DASH";
            }

            // M4S 片段检测
            if (
                contentType.includes("video/iso.segment") ||
                contentType.includes("audio/iso.segment") ||
                (contentType.includes("application/octet-stream") &&
                    url.includes(".m4s"))
            ) {
                return "DASH"; // M4S 通常是 DASH 的一部分
            }

            // WebM 格式检测
            if (contentType.includes("video/webm")) {
                return "MP4"; // 处理为通用视频
            }

            // 通用二进制流检测 - 可能是视频
            if (contentType.includes("application/octet-stream")) {
                // 检查URL是否包含视频扩展名
                const videoExtensions = [
                    ".mp4",
                    ".m4v",
                    ".webm",
                    ".mkv",
                    ".flv",
                    ".mov",
                    ".ts",
                ];
                if (
                    videoExtensions.some((ext) =>
                        url.toLowerCase().includes(ext)
                    )
                ) {
                    return "MP4";
                }
            }
        }

        // 检查 Content-Disposition 头
        const contentDisposition = responseHeaders
            ?.find((h) => h.name.toLowerCase() === "content-disposition")
            ?.value.toLowerCase();

        if (contentDisposition) {
            // 更全面的文件扩展名检测
            if (
                contentDisposition.includes(".mp4") ||
                contentDisposition.includes(".m4v") ||
                contentDisposition.includes(".mov") ||
                contentDisposition.includes(".webm") ||
                contentDisposition.includes(".mkv") ||
                contentDisposition.includes(".flv")
            ) {
                return "MP4";
            }
            if (contentDisposition.includes(".m3u8")) return "HLS";
            if (contentDisposition.includes(".mpd")) return "DASH";
            if (contentDisposition.includes(".m4s")) return "DASH";
            if (contentDisposition.includes(".ts")) return "HLS"; // TS 片段通常是 HLS 的一部分
        }

        // 检查URL路径特征
        if (url.includes("/hls/") || url.includes("/m3u8/")) {
            return "HLS";
        }
        if (url.includes("/dash/") || url.includes("/mpd/")) {
            return "DASH";
        }

        // 如果无法从响应头判断，则使用 URL 判断
        return videoType;
    }

    // 处理视频请求
    handleVideoRequest(request: any, videoType: string) {
        const { url, tabId, id, requestHeaders, responseHeaders } = request;

        // 提取内容长度信息
        const contentLengthHeader = responseHeaders?.find(
            (header) => header.name.toLowerCase() === "content-length"
        );

        let size = contentLengthHeader
            ? parseInt(contentLengthHeader.value, 10)
            : 0;

        const contentRangeHeader = responseHeaders?.find(
            (header) => header.name.toLowerCase() === "content-range"
        );

        const contentRange = contentRangeHeader?.value.split("/")[1];

        if (contentRange && contentRange !== "*") {
            size = parseInt(contentRange);
        }

        // 提取内容类型信息
        const contentTypeHeader = responseHeaders?.find(
            (header) => header.name.toLowerCase() === "content-type"
        );
        const contentType = contentTypeHeader ? contentTypeHeader.value : "";

        // 从URL中提取文件名作为标题
        const urlObj = new URL(url);
        const pathSegments = urlObj.pathname.split("/");
        let fileName = pathSegments[pathSegments.length - 1];
        // 移除查询参数
        fileName = fileName.split("?")[0];

        // 格式化文件大小
        let fileSize = "";
        if (size > 0) {
            if (size < 1024) {
                fileSize = size + " B";
            } else if (size < 1024 * 1024) {
                fileSize = (size / 1024).toFixed(2) + " KB";
            } else if (size < 1024 * 1024 * 1024) {
                fileSize = (size / (1024 * 1024)).toFixed(2) + " MB";
            } else {
                fileSize = (size / (1024 * 1024 * 1024)).toFixed(2) + " GB";
            }
        }

        // 基本视频信息
        const baseVideoInfo = {
            id,
            url: url,
            title: fileName,
            type: videoType,
            size: fileSize,
            sizeNumebr: size,
            tabId,
            // contentLength: size,
            contentType: contentType,
            timestamp: Date.now(),
            requestHeaders: requestHeaders, // 保存请求头信息，用于后续下载
            responseHeaders: responseHeaders, // 保存响应头信息，用于后续分析
        };

        switch (videoType) {
            case "MP4":
                this.addVideoToList(tabId, {
                    ...baseVideoInfo,
                    duration: null, // 视频时长需要在content.js中获取
                });
                break;
            case "HLS":
                this.handleHLS(baseVideoInfo);
                break;
            case "DASH":
                // this.handleDASH(baseVideoInfo);
                break;
            default:
                break;
        }
    }

    // 处理M3U8视频
    async handleHLS(baseVideoInfo: any = null) {
        try {
            const { id, tabId, url, requestHeaders, contentType } =
                baseVideoInfo;

            if (this.videoList.has(tabId) && this.videoList.get(tabId).has(id))
                return;

            // 转换请求头格式
            const headers =
                requestHeaders?.reduce((acc, header) => {
                    acc[header.name] = header.value;
                    return acc;
                }, {} as Record<string, string>) || {};

            const isPlaylist = headers["X-Extension-Playlist-Request"];

            if (isPlaylist) {
                const content = this.hlsContentMap.get(id);
                this.handleHLSContent(content, baseVideoInfo);
                this.hlsContentMap.delete(id);
                return;
            }

            await this.updateHeaderRules(headers, tabId);
            const response = await fetch(url);
            const content = await response.text();
            this.handleHLSContent(content, baseVideoInfo);
        } catch (error) {
            console.error("M3U8 fetch error:", error);
        }
    }

    async handleHLSContent(content: any, baseVideoInfo: any) {
        const { id, tabId, url, contentType } = baseVideoInfo;

        const parser = new Parser();
        parser.push(content);
        parser.end();

        const manifest = parser.manifest;

        if (!manifest.segments?.length && contentType === "video/mp2t") {
            this.requestMap.delete(id);
            return;
        }
        // 提取视频时长信息
        let duration = 0;
        if (manifest.segments && manifest.segments.length > 0) {
            duration = manifest.segments.reduce(
                (total, segment) => total + (segment.duration || 0),
                0
            );
        }

        // 提取视频质量信息
        let qualities: any[] = [];
        if (manifest.playlists && manifest.playlists.length > 0) {
            qualities = manifest.playlists.map((playlist) => ({
                bandwidth: playlist.attributes?.BANDWIDTH,
                resolution: playlist.attributes?.RESOLUTION,
                uri: new URL(playlist.uri, url).href,
            }));
        }

        if (qualities.length) {
            for (const item of qualities) {
                const response = await fetch(item.uri, {
                    headers: {
                        "X-Extension-Playlist-Request": "video-roll",
                        "X-Extension-Video-Width": item.resolution.width,
                        "X-Extension-Video-Height": item.resolution.height,
                        "X-Extension-Video-Kbps": Math.floor(
                            item.bandwidth / 1000
                        ),
                        "X-Extension-Tab-Id": tabId,
                    },
                });
                const content = await response.text();

                let request;
                for (const [key, value] of this.requestMap.entries()) {
                    if (value.url === item.uri) {
                        request = value;
                        break;
                    }
                }

                this.hlsContentMap.set(request.id, content);
                this.handleVideoRequest(request, "m3u8");

                // this.handleHLSContent(content, );
            }

            return;
        }

        const width = baseVideoInfo.requestHeaders.find(
            (v) => v.name === "X-Extension-Video-Width"
        )?.value;
        const height = baseVideoInfo.requestHeaders.find(
            (v) => v.name === "X-Extension-Video-Height"
        )?.value;
        const kbps = baseVideoInfo.requestHeaders.find(
            (v) => v.name === "X-Extension-Video-Kbps"
        )?.value;

        // 转换请求头格式
        const headers =
            baseVideoInfo.requestHeaders?.reduce((acc, header) => {
                acc[header.name] = header.value;
                return acc;
            }, {} as Record<string, string>) || {};
        // 使用baseVideoInfo中的信息（如果有）
        const videoInfo = {
            ...(baseVideoInfo || {}),
            type: "HLS",
            url: url,
            quality: qualities.length || 1,
            qualities,
            segments: manifest.segments,
            width,
            height,
            kbps,
            duration: this.formatDuration(duration),
            timestamp: Date.now(),
            headers,
            title: baseVideoInfo?.title || this.extractVideoTitle(url),
        };

        // 如果解析成功，发送消息更新视频时长
        // if (duration > 0) {
        //     chrome.runtime
        //         .sendMessage({
        //             action: "updateHLSDuration",
        //             url: url,
        //             duration: formatDuration(duration),
        //         })
        //         .catch((err) =>
        //             console.log("无法发送M3U8时长更新消息:", err)
        //         );
        // }

        this.addVideoToList(Number(tabId), videoInfo);
    }

    async handleDASH(baseVideoInfo: any = null) {
        try {
            const { id, tabId, url, requestHeaders } = baseVideoInfo;

            if (this.videoList.has(tabId) && this.videoList.get(tabId).has(id))
                return;

            // 转换请求头格式
            const headers =
                requestHeaders?.reduce((acc, header) => {
                    acc[header.name] = header.value;
                    return acc;
                }, {} as Record<string, string>) || {};

            await this.updateHeaderRules(headers, tabId);
            const response = await fetch(url);

            if (!response.ok) return;

            const content = await response.text();

            const manifest = parse(content, { url });

            // 提取视频时长信息
            let duration = 0;
            if (manifest.duration) {
                duration = manifest.duration;
            }

            // 提取视频质量信息
            let qualities = [];
            if (manifest.playlists && manifest.playlists.length > 0) {
                qualities = manifest.playlists.map((playlist) => ({
                    bandwidth: playlist.attributes?.bandwidth,
                    resolution: playlist.attributes?.resolution,
                    uri: playlist.uri,
                }));
            }

            // 使用baseVideoInfo中的信息（如果有）
            const videoInfo = {
                ...(baseVideoInfo || {}),
                type: "DASH",
                url: url,
                quality: qualities.length || 1,
                qualities: qualities,
                duration: this.formatDuration(duration),
                timestamp: Date.now(),
                headers: headers,
                title: baseVideoInfo?.title || this.extractVideoTitle(url),
            };

            this.addVideoToList(tabId, videoInfo);
        } catch (error) {
            console.error("MPD fetch error:", error);
        }
    }

    addVideoToList(tabId: number, videoInfo: any) {
        if (!this.videoList.has(tabId)) {
            this.videoList.set(tabId, new Map());
        }

        const tabVideos = this.videoList.get(tabId);
        tabVideos.set(videoInfo.id, videoInfo);
        // this.requestMap.delete(videoInfo.id);
        console.log(tabVideos, "tabVideos");
        // 通知popup更新
        this.notifyPopup(tabId);
    }

    // 从URL中提取视频标题
    extractVideoTitle(url: string): string {
        try {
            const urlObj = new URL(url);
            // 尝试从路径中提取文件名
            const pathParts = urlObj.pathname.split("/");
            const lastPart = pathParts[pathParts.length - 1];

            // 如果有文件名部分，尝试提取名称（去除扩展名和查询参数）
            if (lastPart && lastPart.length > 0) {
                // 移除扩展名
                const nameWithoutExt = lastPart.replace(
                    /\.(mp4|m3u8|mpd|m4s)$/i,
                    ""
                );
                // 移除常见的ID和哈希部分
                const cleanName = nameWithoutExt.replace(/[_-]\w{6,}$/i, "");
                // 替换下划线和连字符为空格
                return (
                    cleanName.replace(/[_-]/g, " ").trim() ||
                    `video_${Date.now()}`
                );
            }

            // 如果无法从路径提取，尝试从域名提取
            return `video_from_${urlObj.hostname.replace(
                /^www\./,
                ""
            )}_${Date.now()}`;
        } catch (e) {
            // 如果解析失败，返回默认名称
            return `video_${Date.now()}`;
        }
    }

    // 格式化时长为可读字符串
    formatDuration(seconds: number) {
        if (!seconds || isNaN(seconds)) return null;

        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);

        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
                .toString()
                .padStart(2, "0")}`;
        } else {
            return `${minutes}:${secs.toString().padStart(2, "0")}`;
        }
    }

    // 通知popup更新
    notifyPopup(tabId: any) {
        sendTabMessage(tabId, {
            type: ActionType.GET_DOWNLOAD_LIST,
            downloadList: Array.from(this.videoList.get(tabId).values()),
        });

        // chrome.runtime.sendMessage({
        //     type: "VIDEO_UPDATED",
        //     tabId: tabId,
        //     videos: Array.from(videoStore.get(tabId).values()),
        // });
    }

    async updateHeaderRules(data: any, tabId: any) {
        await chrome.declarativeNetRequest.updateSessionRules({
            removeRuleIds: [1],
        });
        const rules = { removeRuleIds: [1], addRules: [] };
        if (Object.keys(data).length) {
            rules.addRules = [
                {
                    id: 1,
                    priority: 1,
                    action: {
                        type: "modifyHeaders",
                        requestHeaders: Object.keys(data).map((key) => ({
                            header: key,
                            operation: "set",
                            value: data[key],
                        })),
                    },
                    condition: {
                        resourceTypes: ["xmlhttprequest", "media"],
                    },
                },
            ];
            rules.addRules[0].condition.tabIds = [tabId];
        }
        return chrome.declarativeNetRequest.updateSessionRules(rules);
    }
}
