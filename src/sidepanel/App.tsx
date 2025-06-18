/*
 * @Author: gomi gxy880520@qq.com
 * @Date: 2025-05-26 20:55:22
 * @LastEditors: gomi gxy880520@qq.com
 * @LastEditTime: 2025-06-18 01:21:02
 * @FilePath: \website-nextc:\programs\VideoRoll-Pro\src\player\app.tsx
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { ActionType } from "src/types/type.d";
import { sendRuntimeMessage, sendTabMessage } from "src/util";
import { marked } from "marked";
import { defineComponent, ref, onMounted, watch, nextTick } from "vue";
import { stat } from "fs";

export default defineComponent({
  name: "App",
  setup() {
    const summary = ref<string>("");
    const loading = ref(false);
    const status = ref("unavailable");
    const error = ref<string | null>(null);
    const done = ref(false);
    const progress = ref(0); // 下载进度
    const summaryContainerRef = ref<HTMLElement | null>(null);

    // 添加下拉框的选中值
    const summaryType = ref<string>("key-points");
    const summaryLength = ref<string>("medium");

    // Summary Type 选项
    const summaryTypeOptions = [
      { value: "key-points", label: "要点摘要" },
      { value: "summary", label: "概述摘要" },
      { value: "tl;dr", label: "简要摘要" },
    ];

    // Length 选项
    const lengthOptions = [
      { value: "short", label: "简短" },
      { value: "medium", label: "中等" },
      { value: "long", label: "详细" },
    ];

    // 自动滚动到底部的函数
    const scrollToBottom = () => {
      if (summaryContainerRef.value) {
        summaryContainerRef.value.scrollTop =
          summaryContainerRef.value.scrollHeight;
      }
    };

    // 监听摘要内容变化，自动滚动
    watch(
      () => summary.value,
      () => {
        // 只有在生成过程中才自动滚动
        if (!done.value && summary.value) {
          nextTick(() => {
            scrollToBottom();
          });
        }
      }
    );

    const startSummary = async () => {
      // 获取当前标签页
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (!tab?.id) throw new Error("无法获取当前标签页");

      const videoId = tab.url?.match(/v=([^&]+)/)?.[1];

      sendRuntimeMessage(tab.id, {
        type: ActionType.GET_SUBTITLE_URL,
        videoId,
        tabId: tab.id,
        summaryOptions: {
          type: summaryType.value,
          length: summaryLength.value,
        },
      });
    };

    // 请求生成摘要
    const init = async () => {
      // loading.value = true;
      error.value = null;
      done.value = false;
      summary.value = "";

      try {
        // 获取当前标签页
        const [tab] = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        });
        if (!tab?.id) throw new Error("无法获取当前标签页");

        chrome.runtime.onMessage.addListener((a, b, send) => {
          const { subtitleUrl, type, tabId, payload } = a;

          if (
            tabId !== tab.id ||
            ![
              ActionType.GET_SUBTITLE_URL_FROM_BACKGROUND,
              ActionType.SUMMARIZING,
            ].includes(type)
          )
            return;

          switch (type) {
            case ActionType.GET_SUBTITLE_URL_FROM_BACKGROUND: {
              if (subtitleUrl) {
                console.log("Received subtitle URL:", subtitleUrl);
                sendTabMessage(tabId, {
                  type: ActionType.PARSE_SUBTITLE,
                  subtitleUrl,
                  tabId,
                });
              } else {
                console.warn("No subtitle URL received");
              }
              break;
            }
            case ActionType.SUMMARIZING:
              loading.value = false;
              done.value = false;
              summary.value = marked.parse(
                payload.text.replace(
                  /^[\u200B\u200C\u200D\u200E\u200F\uFEFF]/,
                  ""
                )
              ) as string;

              // 更新内容后自动滚动
              nextTick(() => {
                scrollToBottom();
              });
              break;
            case ActionType.SUMMARIZE_DONE:
              loading.value = false;
              done.value = true;
              break;
            case ActionType.SUMMARIZER_AVAILABLE:
              status.value = "available";
              break;
            case ActionType.SUMMARIZER_UNAVAILABLE:
              status.value = "unavailable";
              break;
            case ActionType.SUMMARIZER_DOWNLOADABLE:
              status.value = "downloadable";
              break;
            case ActionType.SUMMARIZER_DOWNLOADING:
              status.value = "downloading";
              progress.value = payload.progress || 0; // 更新下载进度
              break;
            default:
              break;
          }

          send("success");
          console.log("Received message from background script");
        });
        console.log("Sending request to check summarizer", tab.id);
        sendTabMessage(tab.id, {
          type: ActionType.CHECK_SUMMARIZER,
          tabId: tab.id,
        });
      } catch (err) {
        error.value = err instanceof Error ? err.message : "请求失败";
        loading.value = false;
      }
    };

    const downloadModel = async () => {
      // 获取当前标签页
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (!tab?.id) throw new Error("无法获取当前标签页");

      // 发送下载模型请求
      sendTabMessage(tab.id, {
        type: ActionType.DOWNLOAD_SUMMARIZER,
        tabId: tab.id,
      });
    }

    onMounted(() => {
      init();
    });

    return () => (
      <van-config-provider theme="dark" class="h-full">
        <main class="flex flex-col h-full p-4 justify-between box-border">
          <div>{}</div>
          <div class="flex-1 relative overflow-y-hidden">
            {/* 顶部渐变遮罩 */}
            <div
              class="absolute top-0 left-0 right-0 h-6 pointer-events-none z-10"
              style="background: linear-gradient(to bottom, #282828, transparent);"
            ></div>

            <div
              ref={summaryContainerRef}
              class="flex-1 h-full overflow-y-auto scroll-smooth px-4 py-6"
              style="mask: linear-gradient(to bottom, transparent 0px, black 24px, black calc(100% - 24px), transparent 100%); -webkit-mask: linear-gradient(to bottom, transparent 0px, black 24px, black calc(100% - 24px), transparent 100%);"
            >
              <h1 class="text-xl font-bold mb-4">视频摘要</h1>
              {status.value === "available" ? (
                <div>模型已准备完毕</div>
              ) : status.value === "downloadable" ? (
                <>
                  <div>模型可下载</div>
                  <button onClick={downloadModel}>下载模型</button>
                </>
              ) : status.value === "downloading" ? (
                <div>模型下载中...{progress.value}%</div>
              ) : status.value === "unavailable" ? (
                <div>模型不可用</div>
              ) : null}
              {/* {loading.value ? (
                <van-loading size="24px" vertical>
                  正在生成摘要...
                </van-loading>
              ) : (
                <>
                  <div
                    class="dark text-white prose prose-truegray text-lg leading-relaxed"
                    innerHTML={summary.value}
                  ></div>
                  {done.value && (
                    <div class="mt-4 p-2 bg-green-800 rounded text-center">
                      摘要生成完毕
                    </div>
                  )}
                </>
              )} */}
            </div>

            {/* 底部渐变遮罩 */}
            <div
              class="absolute bottom-0 left-0 right-0 h-6 pointer-events-none z-10"
              style="background: linear-gradient(to top, #282828, transparent);"
            ></div>
          </div>
          <div class="summarize-footer flex flex-col gap-3 mt-4">
            <div class="flex flex-row gap-3">
              <div class="flex-1">
                <label class="block text-sm text-gray-300 mb-1">摘要类型</label>
                <select
                  v-model={summaryType.value}
                  class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                >
                  {summaryTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div class="flex-1">
                <label class="block text-sm text-gray-300 mb-1">摘要长度</label>
                <select
                  v-model={summaryLength.value}
                  class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                >
                  {lengthOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="button"
              class="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded font-medium transition-colors"
              disabled={status.value !== "available" || loading.value}
              onClick={startSummary}
            >
              {loading.value ? "正在生成..." : "生成摘要"}
            </button>
          </div>
        </main>
      </van-config-provider>
    );
  },
});
