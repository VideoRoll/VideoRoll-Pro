import type { Message, SummaryPayload } from '../types/messages';

class ContentScript {
  private videoId: string | null = null;
  private transcript: string | null = null;
  private title: string | null = null;

  constructor() {
    this.initMessageListener();
  }

  private initMessageListener(): void {
    // 监听来自 sidepanel 的消息
    chrome.runtime.onMessage.addListener((message: Message, sender, sendResponse) => {
      if (message.type === 'REQUEST_TRANSCRIPT') {
        this.handleTranscriptRequest().then(sendResponse);
        return true; // 保持消息通道开放以支持异步响应
      }
    });
  }

  private async handleTranscriptRequest(): Promise<SummaryPayload> {
    try {
      // 获取视频信息
      this.videoId = this.getVideoId();
      this.title = document.title;
      
      if (!this.videoId) {
        throw new Error('无法获取视频ID');
      }

      // 获取字幕
      this.transcript = await this.getTranscript();
      
      if (!this.transcript) {
        throw new Error('无法获取视频字幕');
      }

      return {
        videoId: this.videoId,
        transcript: this.transcript,
        title: this.title
      };
    } catch (error) {
      console.error('获取字幕失败:', error);
      throw error;
    }
  }

  private getVideoId(): string | null {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('v');
  }

  private async getTranscript(): Promise<string> {
    // 这里实现获取字幕的逻辑
    // 可以使用 YouTube 的 API 或解析页面元素
    // 具体实现取决于你的需求
    return ''; // 实现获取字幕的逻辑
  }
}

// 初始化 content script
new ContentScript();
