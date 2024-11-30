import {
    defineComponent,
    ref,
    onMounted,
    provide,
    watch,
    onUnmounted,
    onBeforeMount,
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
        const user = ref();
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

        provide("rollConfig", rollConfig);
        provide("update", updateRollConfig.bind(null, rollConfig));
        provide("onOpenSetting", onOpenSetting);
        provide("videoList", videoList);
        provide("onHoverVideo", onHoverVideo);
        provide("updateVideoCheck", updateVideoCheck);
        provide("updateEnable", updateEnable);
        provide("capture", capture);
        provide("startRecord", startRecord);
        provide("stopRecord", stopRecord);
        provide("advancedPictureInPicture", advancedPictureInPicture);
        provide("user", user);

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

            chrome.runtime.onMessage.addListener((a, b, c) => {
                const {
                    type,
                    rollConfig: config,
                    text,
                    videoList: list,
                    imgData,
                    muted,
                    iframes,
                    windowConfig,
                    user: userInfo
                } = a;

                if (a.tabId !== tabId.value) {
                    c("not current tab");
                    return;
                }

                switch (type) {
                    case ActionType.UPDATE_STORAGE:
                        Object.keys(config).forEach((key) => {
                            if (key in rollConfig) {
                                rollConfig[key] = config[key];
                            }
                        });
                        break;
                    case ActionType.UPDATE_BADGE:
                        rollConfig.videoNumber = Number(text);
                        videoList.value = list;
                        break;
                    case ActionType.UPDATE_VIDEO_LIST:
                        videoList.value = list;
                        break;
                    case ActionType.CAPTURE:
                        const newUrl = browser.runtime.getURL(
                            "inject/capture.html?imgData=" +
                                encodeURIComponent(imgData)
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
                    case ActionType.STOP_RECORD:
                        rollConfig.isRecording = false;
                        break;
                    case ActionType.USER_INFO:
                        console.log(userInfo, '2222user----');
                        user.value = userInfo?.user;
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
        });

        const renderComponent = () => {
            if (rollConfig.enable) {
                if (rollConfig.videoNumber === 0) return <Iframe></Iframe>;

                return <GridPanel></GridPanel>;
            }

            return (
                <div class="empty-box">
                    <Close class="logo-empty"/>
                    <div>{browser.i18n.getMessage("tips_disabled")}</div>
                </div>
            );
        };

        return () => (
            <div
                class={
                    rollConfig.enable
                        ? "video-roll-wrapper"
                        : "video-roll-wrapper-empty"
                }
            >
                <van-config-provider theme="dark">
                    <Head
                        class="video-roll-wrapper-head"
                        isShow={isShow.value}
                    ></Head>
                    <main
                        class={
                            rollConfig.enable
                                ? "video-roll-main"
                                : "video-roll-main-empty"
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
