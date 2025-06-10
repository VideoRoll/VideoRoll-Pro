interface CachedSubtitleData {
  url: string;
  timestamp: number;
  initiator?: string;
}

interface VideoSummaryResponse {
  success: boolean;
  summary?: string;
  error?: string;
}

interface SubtitleUrlResponse {
  success: boolean;
  subtitleUrl?: string;
  error?: string;
}

interface SummarizeRequest {
  transcript: string;
  videoTitle: string;
  videoId: string;
  targetLanguage?: string;
}

/**
 * Background script for YouTube AI Summarizer
 * Handles communication between content script and Chrome's AI
 */
export class VideoSummarizer {
  private subtitleCache: Map<string, CachedSubtitleData>;

  constructor() {
    this.subtitleCache = new Map();
    this.initialize();
  }

  private initialize(): void {
    // Initialize on install
    this.setupWebRequestListener();
    this.setupSidePanel();

    // Listen for messages from content script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      return this.handleMessage(message, sender, sendResponse);
    });

    // 监听命令
    chrome.commands.onCommand.addListener((command) => {
      this.handleCommand(command);
    });
  }

  private setupSidePanel(): void {
    if (chrome.sidePanel) {
      try {
        chrome.sidePanel.setOptions(
          {
            enabled: true,
            path: "src/sidepanel.html",
          },
          () => {
            if (chrome.runtime.lastError) {
              console.error("Side Panel 设置失败:", chrome.runtime.lastError);
            } else {
              console.log("Side Panel 已启用");
            }
          }
        );
      } catch (error) {
        console.error("Side Panel 设置失败:", error);
      }
    } else {
      console.warn("该浏览器不支持 Side Panel API");
    }
  }

  private handleCommand(command: string): void {
    console.log("收到命令:", command);
    if (command === "open-side-panel" && chrome.sidePanel) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length > 0 && tabs[0].id) {
          const tabId = tabs[0].id;
          chrome.sidePanel.open({ tabId }, () => {
            if (chrome.runtime.lastError) {
              console.error("打开侧边栏失败:", chrome.runtime.lastError);
            } else {
              console.log("侧边栏已打开");
            }
          });
        } else {
          console.error("无法获取当前标签页");
        }
      });
    }
  }

  private isValidSubtitleUrl(url: string): boolean {
    if (!url) {
      console.log("URL is empty, invalid");
      return false;
    }

    if (!url.includes("/timedtext")) {
      console.log("URL does not contain /timedtext path, invalid:", url);
      return false;
    }

    if (!url.includes("fmt=json3")) {
      console.log("URL does not contain fmt=json3 parameter, invalid:", url);
      return false;
    }

    return true;
  }

  private setupWebRequestListener(): void {
    chrome.webRequest.onBeforeRequest.addListener(
      (details) => this.handleWebRequest(details),
      {
        urls: [
          "*://*.youtube.com/api/timedtext*",
          "*://*.youtube.com/timedtext*",
          "*://www.youtube.com/api/timedtext*",
        ],
        types: ["xmlhttprequest"],
      }
    );
  }

  private handleWebRequest(details: chrome.webRequest.WebRequestDetails): {
    cancel: boolean;
  } {
    if (details.method === "GET" && this.isValidSubtitleUrl(details.url)) {
      console.log("Intercepted timedtext request:", details.url);
      const videoIdMatch =
        details.url.match(/v=([^&]+)/) ||
        details.initiator?.match(/youtube\.com\/watch\?v=([^&]+)/);
      const videoId = videoIdMatch ? videoIdMatch[1] : "unknown";

      console.log("Extracted video ID:", videoId);

      this.subtitleCache.set(videoId, {
        url: details.url,
        timestamp: Date.now(),
        initiator: details.initiator,
      });

      this.notifyContentScriptOfSubtitleUrl(videoId, details.url);
    }
    return { cancel: false };
  }

  private notifyContentScriptOfSubtitleUrl(videoId: string, url: string): void {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0 && tabs[0].id) {
        chrome.tabs
          .sendMessage(tabs[0].id, {
            action: "subtitleUrlIntercepted",
            videoId: videoId,
            subtitleUrl: url,
          })
          .catch((err) => {
            console.log(
              "Could not notify content script (may not be ready):",
              err
            );
          });
      }
    });
  }

  private handleMessage(
    message: any,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response: any) => void
  ): boolean {
    switch (message.action) {
      case "checkForYouTube":
        return this.handleCheckForYouTube(sendResponse);
      case "summarizeVideo":
        return this.handleSummarizeVideo(
          message as SummarizeRequest,
          sendResponse
        );
      case "getInterceptedSubtitleUrl":
        return this.handleGetInterceptedSubtitleUrl(message, sendResponse);
      case "retryGetSubtitles":
        return this.handleRetryGetSubtitles(message, sendResponse);
      default:
        return false;
    }
  }

  private handleCheckForYouTube(
    sendResponse: (response: { isYouTube: boolean }) => void
  ): boolean {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      const isYouTube = tab.url?.includes("youtube.com/watch") || false;
      sendResponse({ isYouTube });
    });
    return true;
  }

  private handleSummarizeVideo(
    message: SummarizeRequest,
    sendResponse: (response: VideoSummaryResponse) => void
  ): boolean {
    const { transcript, videoTitle, videoId, targetLanguage } = message;
    this.processWithChromeAI(transcript, videoTitle, videoId, targetLanguage)
      .then((summary) => {
        console.log("AI processing complete, summary:", summary);
        sendResponse({ success: true, summary });
      })
      .catch((error) => {
        console.error("Error processing with AI:", error);
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }

  private handleGetInterceptedSubtitleUrl(
    message: { videoId: string },
    sendResponse: (response: SubtitleUrlResponse) => void
  ): boolean {
    const { videoId } = message;
    const cachedData = this.subtitleCache.get(videoId);

    if (cachedData && this.isValidSubtitleUrl(cachedData.url)) {
      console.log(`Providing cached subtitle URL for video ${videoId}`);
      sendResponse({
        success: true,
        subtitleUrl: cachedData.url,
      });
    } else {
      console.log(`No valid subtitle URL for video ${videoId}`);
      sendResponse({
        success: false,
        error: "No valid subtitle URL intercepted for this video",
      });
    }
    return true;
  }

  private handleRetryGetSubtitles(
    message: { videoId: string; tabId: number },
    sendResponse: (response: SubtitleUrlResponse) => void
  ): boolean {
    const { videoId, tabId } = message;
    console.log("尝试重新获取字幕:", videoId);

    const cachedData = this.subtitleCache.get(videoId);
    if (
      cachedData &&
      Date.now() - cachedData.timestamp < 300000 &&
      this.isValidSubtitleUrl(cachedData.url)
    ) {
      sendResponse({ success: true, subtitleUrl: cachedData.url });
      return true;
    }

    chrome.tabs.sendMessage(
      tabId,
      {
        action: "forceGetSubtitles",
        videoId: videoId,
      },
      (response: SubtitleUrlResponse | undefined) => {
        if (chrome.runtime.lastError) {
          console.error("重试获取字幕失败:", chrome.runtime.lastError);
          sendResponse({
            success: false,
            error: chrome.runtime.lastError.message,
          });
        } else if (response?.success && response.subtitleUrl) {
          this.subtitleCache.set(videoId, {
            url: response.subtitleUrl,
            timestamp: Date.now(),
          });
          sendResponse({ success: true, subtitleUrl: response.subtitleUrl });
        } else {
          sendResponse({ success: false, error: "无法获取字幕URL" });
        }
      }
    );
    return true;
  }

  /**
   * Process transcript with Chrome's AI by delegating to content script
   * @param transcript - Video transcript
   * @param videoTitle - Video title
   * @param videoId - YouTube video ID
   * @param targetLanguage - Target language for the summary
   * @returns Promise<string> Summary text
   */
  private async processWithChromeAI(
    transcript: string,
    videoTitle: string,
    videoId: string,
    targetLanguage: string = "auto"
  ): Promise<string> {
    try {
      console.log("Forwarding transcript to content script for processing:", {
        length: transcript.length,
        videoId,
        targetLanguage,
      });

      const tabs = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (!tabs[0]?.id) {
        throw new Error("No active tab found");
      }

      const response = await chrome.tabs.sendMessage(tabs[0].id, {
        action: "generateSummary",
        transcript,
        videoTitle,
        videoId,
        targetLanguage,
      });

      if (response.success && response.summary) {
        console.log("Summary generated successfully");
        return response.summary;
      } else {
        throw new Error(response.error || "Summary generation failed");
      }
    } catch (error) {
      console.error("AI processing error:", error);
      throw new Error("处理视频内容时出错，请重试:" + (error as Error).message);
    }
  }
}
