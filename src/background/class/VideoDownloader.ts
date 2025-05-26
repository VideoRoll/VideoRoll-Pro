import { nanoid } from "nanoid";
import { ActionType, IRollConfig } from "src/types/type.d";
import browser from "webextension-polyfill";

export default class VideoDownloader {
  downloadList: any[] = [];

  constructor() {
    this.onDownloadListener();
  }

  onDownloadListener() {
    // 处理消息
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      const { rollConfig, type, tabId, videoInfo, favIcon } = message;
      if (!videoInfo) return;

      switch (type) {
        case ActionType.DOWNLOAD_SINGLE_VIDEO:
          if (videoInfo.type === "MP4") {
            this.downloadMP4(videoInfo);
          } else if (videoInfo.type === "HLS") {
            this.downloadHLS(videoInfo, rollConfig, favIcon);
          }
          break;
        default:
          break;
      }
      sendResponse("ok");
      return true;
    });
  }

  downloadMP4(videoInfo: any) {
    chrome.downloads.download(
      {
        url: videoInfo.url, // MP4视频的URL
        filename: `${videoInfo.title || "video"}.mp4`, // 保存的文件名
      },
      (downloadId) => {
        if (chrome.runtime.lastError) {
          console.error("下载失败:", chrome.runtime.lastError);
        } else {
          console.log("下载已开始，ID:", downloadId);
        }
      }
    );
  }

  downloadHLS(videoInfo: any, rollConfig: IRollConfig, favIcon: string) {
    const id = nanoid();
    chrome.storage.local
      .set({
        [id]: JSON.parse(
          JSON.stringify({ ...videoInfo, webUrl: rollConfig.url, favIcon })
        ),
      })
      .then(() => {
        const newUrl = browser.runtime.getURL(
          `download/download.html?downloadId=${id}`
        );
        browser.tabs.create({ url: newUrl });
      });
  }

  downloadDASH() {}
}
