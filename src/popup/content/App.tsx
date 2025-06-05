import {
  defineComponent,
  ref,
  onMounted,
  provide,
  watch
} from "vue";
import browser from "webextension-polyfill";
import Head from "./components/Head";
import Footer from "./components/Footer";
import GridPanel from "./components/GridPanel";
import { useConfig } from "../../use";
import { initRollConfig, updateRollConfig, reloadPage } from "./utils";
import { clone, getSessionStorage, sendTabMessage } from "../../util";
import { ActionType } from "../../types/type.d";
import { Close } from "@vicons/ionicons5";

import "./index.less";
import Iframe from "./components/Iframe";

export default defineComponent({
  name: "App",
  setup() {
    const isShow = ref(false);
    const tabId = ref(0);
    const videoList = ref([]);
    const realVideo = ref();
    const user = ref();
    const favIcon = ref("");

    /**
     * open settings panel
     */
    const onOpenSetting = (e: Event) => {
      isShow.value = !isShow.value;
    };

    // current website config
    const rollConfig = useConfig();

    const onHoverVideo = (id: string, isIn: boolean) => {
      sendTabMessage(rollConfig.tabId, {
        id,
        type: ActionType.ON_HOVER_VIDEO,
        isIn,
      });
    };

    const updateVideoCheck = (ids: string[]) => {
      sendTabMessage(rollConfig.tabId, {
        ids,
        type: ActionType.UPDATE_VIDEO_CHECK,
      });
    };

    const updateEnable = () => {
      sendTabMessage(rollConfig.tabId, {
        rollConfig: clone(rollConfig),
        type: ActionType.UPDATE_ENABLE,
      });
    };

    const capture = () => {
      sendTabMessage(rollConfig.tabId, {
        rollConfig: clone(rollConfig),
        type: ActionType.CAPTURE,
      });
    };

    const startRecord = () => {
      sendTabMessage(rollConfig.tabId, {
        rollConfig: clone(rollConfig),
        type: ActionType.START_RECORD,
      });
    };

    const stopRecord = () => {
      sendTabMessage(rollConfig.tabId, {
        rollConfig: clone(rollConfig),
        type: ActionType.STOP_RECORD,
      });
    };

    const advancedPictureInPicture = () => {
      sendTabMessage(rollConfig.tabId, {
        rollConfig: clone(rollConfig),
        type: ActionType.ADVANCED_PICTURE_IN_PICTURE,
      });
    };

    const downloadSingleVideo = (videoInfo: any) => {
      sendTabMessage(rollConfig.tabId, {
        rollConfig: clone(rollConfig),
        type: ActionType.DOWNLOAD_SINGLE_VIDEO,
        videoInfo,
        favIcon: favIcon.value,
      });
    };

    const pause = () => {
      sendTabMessage(rollConfig.tabId, {
        rollConfig: clone(rollConfig),
        type: ActionType.PAUSE,
        videoId: realVideo.value.id,
      });
    };

    const play = () => {
      sendTabMessage(rollConfig.tabId, {
        rollConfig: clone(rollConfig),
        type: ActionType.PLAY,
        videoId: realVideo.value.id,
      });
    };

    provide("rollConfig", rollConfig);
    provide("update", updateRollConfig.bind(null, rollConfig));
    provide("onOpenSetting", onOpenSetting);
    provide("videoList", videoList);
    provide("favIcon", favIcon);
    provide("onHoverVideo", onHoverVideo);
    provide("updateVideoCheck", updateVideoCheck);
    provide("updateEnable", updateEnable);
    provide("capture", capture);
    provide("startRecord", startRecord);
    provide("stopRecord", stopRecord);
    provide("advancedPictureInPicture", advancedPictureInPicture);
    provide("user", user);
    provide("downloadSingleVideo", downloadSingleVideo);
    provide("realVideo", realVideo);
    provide("play", play);
    provide("pause", pause);

    watch(
      () => tabId.value,
      (value: number) => {
        if (!value) return;
        const config = getSessionStorage(value);

        Object.keys(config).forEach((key) => {
          if (key in rollConfig && key !== "tabId") {
            rollConfig[key] = config[key];
          }
        });
      }
    );
    /**
     * 当打开时就获取当前网站的视频信息
     * 添加样式
     */
    onMounted(async () => {
      const queryOptions = { active: true, currentWindow: true };
      const [tab] = await browser.tabs.query(queryOptions);

      tabId.value = tab.id as number;
      initRollConfig(rollConfig, tab);
      if (tab.favIconUrl) {
        favIcon.value = tab.favIconUrl;
      }

      chrome.runtime.onMessage.addListener((info, b, c) => {
        const {
          type,
          rollConfig: config,
          text,
          imgData,
          muted,
          iframes,
          windowConfig,
          user: userInfo,
          downloadList,
          videoList: realVideoList,
        } = info;

        if (info.tabId !== tabId.value) {
          c("not current tab");
          return;
        }

        switch (type) {
          case ActionType.UPDATE_STORAGE:
            Object.keys(config).forEach((key) => {
              rollConfig[key] = config[key];
            });
            break;
          case ActionType.UPDATE_BADGE:
            rollConfig.videoNumber = Number(text);
            realVideo.value = realVideoList.find((v) => v.isReal);
            break;
          case ActionType.CAPTURE:
            const newUrl = browser.runtime.getURL(
              "inject/capture.html?imgData=" + encodeURIComponent(imgData)
            );
            browser.tabs.create({ url: newUrl });
            break;
          case ActionType.MUTED:
            browser.tabs.get(tabId.value).then((tab) => {
              browser.tabs.update(tabId.value, { muted });
            });
            break;
          case ActionType.UPDATE_IFRAMES:
            rollConfig.iframes = iframes;
            break;
          case ActionType.ADVANCED_PICTURE_IN_PICTURE:
            browser.windows.create({
              tabId: rollConfig.tabId,
              type: "popup",
              width: windowConfig.width,
              height: windowConfig.height,
              left: windowConfig.leftPosition,
              top: windowConfig.topPosition,
              focused: true,
            });
            break;
          case ActionType.RECORD_INFO:
            rollConfig.recordStatus = config.recordStatus;
            rollConfig.recordInfo = config.recordInfo;
            rollConfig.recordTime = config.recordTime;
            break;
          case ActionType.USER_INFO:
            user.value = userInfo?.user;
            break;
          case ActionType.GET_DOWNLOAD_LIST:
            videoList.value = downloadList;
            break;
          case ActionType.PLAY:
            realVideo.value = realVideoList.find((v) => v.isReal);
            break;
          case ActionType.PAUSE:
            realVideo.value = realVideoList.find((v) => v.isReal);
            break;
          default:
            break;
        }

        c("update");
      });

      sendTabMessage(rollConfig.tabId, {
        rollConfig: clone(rollConfig),
        type: ActionType.ON_MOUNTED,
      });

      sendTabMessage(rollConfig.tabId, {
        rollConfig: clone(rollConfig),
        type: ActionType.AUDIO_CAPTURE,
      });
    });

    const renderComponent = () => {
      if (rollConfig.enable) {
        if (rollConfig.videoNumber === 0) return <Iframe></Iframe>;

        return <GridPanel></GridPanel>;
      }

      return (
        <div class="empty-box">
          <Close class="logo-empty" />
          <div>{browser.i18n.getMessage("tips_disabled")}</div>
        </div>
      );
    };

    return () => (
      <div
        class={
          rollConfig.enable ? "video-roll-wrapper" : "video-roll-wrapper-empty"
        }
      >
        <van-config-provider theme="dark">
          <Head class="video-roll-wrapper-head" isShow={isShow.value}></Head>
          <main
            class={
              rollConfig.enable ? "video-roll-main" : "video-roll-main-empty"
            }
          >
            <div
              class={
                rollConfig.enable
                  ? "video-roll-content"
                  : "video-roll-content-empty"
              }
            >
              {renderComponent()}
            </div>
          </main>
          <Footer></Footer>
        </van-config-provider>
      </div>
    );
  },
});
