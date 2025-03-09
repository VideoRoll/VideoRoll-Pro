import { ActionType } from "src/types/type.d";

export default class VideoDownloader {
    downloadList: any[] = []
    
    constructor() {
        this.onDownloadListener();
    }

    onDownloadListener() {
        // 处理消息
        chrome.runtime.onMessage.addListener(
            (message, sender, sendResponse) => {
                const { rollConfig, type, tabId, videoInfo } = message;

                console.log('downloadStart')
                switch (type) {
                    case ActionType.DOWNLOAD_SINGLE_VIDEO:
                        if (videoInfo.type === 'MP4') {
                            this.downloadMP4(videoInfo);
                        }
                        
                        break;
                    default:
                        break;
                }
                sendResponse('ok');
                return true;
            }
        );
    }

    downloadMP4(videoInfo: any) {
        chrome.downloads.download({
            url: videoInfo.url,  // MP4视频的URL
            filename: `${videoInfo.title || 'video'}.mp4`,     // 保存的文件名
          }, (downloadId) => {
            if (chrome.runtime.lastError) {
              console.error("下载失败:", chrome.runtime.lastError);
            } else {
              console.log("下载已开始，ID:", downloadId);
            }
          });
    }

    downloadHLS() {

    }

    downloadDASH() {

    }
}