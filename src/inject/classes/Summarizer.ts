export interface SummaryOptions {
  context?: string;
  sharedContext?: string;
  length?: 'short' | 'medium' | 'long';
  format?: 'text' | 'markdown' | 'html';
  type?: 'key-points' | 'summary';
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
  availability(): Promise<'available' | 'downloading' | 'unavailable'>;
  create(options: SummaryOptions): Promise<ISummarizer>;
  summarizeStreaming(text: string, options: SummaryOptions): Promise<SummaryResult>;
  ready: Promise<void>;
  addEventListener(event: string, handler: (e: SummarizerProgress) => void): void;
}

import { logDebug } from "../../utils/logger";

/**
 * Summarizer service for generating summaries from video transcripts
 */
export default class Summarizer {
  private summarizer: ISummarizer | null;
  private isInitialized: boolean;

  constructor() {
    this.summarizer = null;
    this.isInitialized = false;
  }

  /**
   * Initialize the summarizer service
   * @throws {Error} If initialization fails
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      if (!("Summarizer" in self)) {
        logDebug("Summarizer API 不可用");
        throw new Error("Summarizer API not loaded");
      }

      const availability = await Summarizer.availability();
      if (availability === "unavailable") {
        logDebug("Summarizer API 不可用");
        throw new Error("Summarizer API unavailable");
      }

      const options: SummaryOptions = {
        sharedContext: "This is a YouTube video transcript summary.",
        type: "key-points",
        format: "markdown",
        length: "medium",
      };

      this.summarizer = await Summarizer.create(options);

      if (availability === "downloading" && this.summarizer) {
        this.summarizer.addEventListener(
          "downloadprogress",
          (e: SummarizerProgress) => {
            const progress = e.total
              ? (e.loaded / e.total) * 100
              : e.loaded * 100;
            logDebug(`Summarizer 模型下载进度: ${progress.toFixed(2)}%`);
          }
        );
        await this.summarizer.ready;
      }

      this.isInitialized = true;
      logDebug("Summarizer 服务初始化成功");
    } catch (error) {
      logDebug("Summarizer 服务初始化失败:", error);
      this.isInitialized = false;
      throw error instanceof Error
        ? error
        : new Error("Failed to initialize summarizer");
    }
  }

  /**
   * Generate summary from text
   * @param {string} text - The text to summarize
   * @param {SummaryOptions} [options] - Summary options
   * @returns {Promise<string | null>} The generated summary or null if generation fails
   */
  public async generateSummary(
    text: string,
    options: Partial<SummaryOptions> = {}
  ): Promise<string | null> {
    if (!text?.trim()) {
      logDebug("文本为空，无法生成摘要");
      return null;
    }

    try {
      if (!this.isInitialized || !this.summarizer) {
        await this.initialize();
      }

      if (!this.summarizer) {
        throw new Error("Summarizer not initialized");
      }

      const summaryOptions: SummaryOptions = {
        context:
          options.context || "This is a YouTube video transcript section.",
        length: options.length || "medium",
        format: "markdown",
        type: options.type || "key-points",
      };

      const result = await this.summarizer.summarizeStreaming(
        text,
        summaryOptions
      );
      return result.text;
    } catch (error) {
      logDebug("生成摘要失败:", error);
      return null;
    }
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
