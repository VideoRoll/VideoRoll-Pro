// 拦截 XMLHttpRequest 请求
// 拦截 XMLHttpRequest 请求
// 保存原始的 XMLHttpRequest 的 open 和 send 方法
// const originalXHROpen = XMLHttpRequest.prototype.open;
// const originalXHRSend = XMLHttpRequest.prototype.send;
async function downloadTSFiles(tsUrls) {
    const tsBlobs = [];

    for (const tsUrl of tsUrls) {
        const response = await fetch(tsUrl);
        const blob = await response.blob();
        tsBlobs.push(blob);
    }

    // 合并 Blob 片段
    const fullVideoBlob = new Blob(tsBlobs, { type: 'video/mp2t' });

    // 下载合并后的 TS 文件
    downloadBlob(fullVideoBlob, 'video.ts');
}

// 下载文件的通用函数
function downloadBlob(blob, filename) {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// 使用 m3u8-parser 解析 m3u8 文件
async function fetchM3U8(url) {
    const response = await fetch(url);
    const m3u8Content = await response.text();

    // 使用 m3u8-parser 解析
    const parser = new m3u8Parser.Parser();
    parser.push(m3u8Content);
    parser.end();

    const manifest = parser.manifest;
    const tsUrls = manifest.segments.map(segment => new URL(segment.uri, url).href);

    console.log('Parsed TS URLs:', tsUrls);

    // 下载视频片段
    downloadTSFiles(tsUrls);
}

let open = XMLHttpRequest.prototype.open;
XMLHttpRequest.prototype.open = function (method, url) {
    this.addEventListener('load', function () {
        // console.log('Intercepted m3u8 request:', url);
        // if (url.endsWith('.m3u8')) {
        //     console.log('Intercepted m3u8 request:', url);
        //     // fetchM3U8(url);
        // }
    });
    open.apply(this, arguments);
};

const originalCreateObjectURL = URL.createObjectURL;
URL.createObjectURL = function (blob) {
    const blobUrl = originalCreateObjectURL.apply(this, arguments);
    console.log('Blob URL:', blob, blobUrl);

    // 记录 blob 和它的 URL 之间的关联
    // blobUrlMap.set(blobUrl, blob);

    return blobUrl;
};


const originalSetAttribute = HTMLMediaElement.prototype.setAttribute;
HTMLMediaElement.prototype.setAttribute = function (name, value) {
    if (name === 'src') {
        console.log('Setting video src to blob URL:', value);

        // // 检查 blobUrlMap 中是否有这个 blob URL
        // if (blobUrlMap.has(value)) {
        //     const originalUrl = blobUrlMap.get(value);
        //     console.log(`Video element is using blob URL: ${value}, originally from: ${originalUrl}`);

        //     // 这里你可以处理 video 元素和原始 URL 的关联
        //     handleVideoBlob(this, value, originalUrl);
        // }
    }
    originalSetAttribute.apply(this, arguments);
};


const originalSend = XMLHttpRequest.prototype.send;
XMLHttpRequest.prototype.send = function () {
    this.addEventListener('load', function () {
        const contentType = this.getResponseHeader('Content-Type');
        console.log('contentType', contentType);
        if (contentType && contentType.includes('video') || contentType.includes('m4s') || contentType.includes('mp4')) {
            const blob = new Blob([this.response], { type: contentType });
            const blobUrl = URL.createObjectURL(blob)
            console.log('XHR video:', blobUrl);
        }
        // if (this.responseType === 'arraybuffer') {


        //     console.log('responseType:', this.responseType, this.response, this.responseURL);
        //     // handleBlobResponse(this.response, this.responseURL);
        // }
    });


    // this.addEventListener('readystatechange', function () {
    //     if (this.readyState === 4) { // 请求完成
    //         // console.log('Response from:', this.responseURL, this.responseType);
    //         // console.log('Response Status:', this.status);
    //         // console.log('Response Text:', this.responseText);
    //         // 你可以在这里处理响应
    //     }
    // });
    originalSend.apply(this, arguments);
};
// 重写 open 方法
// XMLHttpRequest.prototype.open = function (method, url, async, user, password) {
//     // 你可以在这里对 URL 和请求方法进行拦截

//     // 可以保存信息，以便在 send 方法中使用
//     this._requestMethod = method;
//     this._requestURL = url;

//     // 调用原始的 open 方法
//     return originalXHROpen.apply(this, [method, url, async, user, password]);
// };

// // 重写 send 方法
// XMLHttpRequest.prototype.send = function (body) {
//     // 可以根据 URL 或者其他条件执行不同的拦截逻辑
//     if (this._requestURL.includes('.m3u8') || this._requestURL.includes('.ts') || this._requestURL.includes('.mp4')) {
//         console.log('Intercepting request to example.com');
//         // 你可以在这里修改 body 或执行其他操作
//     }

//     // 监听 readyState 变化
//     this.addEventListener('readystatechange', function () {
//         if (this.readyState === 4) { // 请求完成
//             console.log('Response from:', this._requestURL);
//             console.log('Response Status:', this.status);
//             console.log('Response Text:', this.responseText);
//             // 你可以在这里处理响应
//         }
//     });

//     // 调用原始的 send 方法
//     return originalXHRSend.apply(this, [body]);
// };

// 拦截 fetch 请求
const originalFetch = window.fetch;
window.fetch = function (...args) {
    const url = args[0];
    if (url.includes('.m3u8') || url.includes('.mp4')) {
        console.log('Detected video fetch: ', url);
        // chrome.runtime.sendMessage({ action: 'video_detected', videoUrl: url });
    }
    return originalFetch.apply(this, args);
};