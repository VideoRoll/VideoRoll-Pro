/*
 * @description: inject
 * @Author: Gouxinyu
 * @Date: 2022-01-11 23:49:59
 */
import { ActionType, VideoListItem } from "../types/type.d";
import {
    updateConfig,
    updateOnMounted,
    updateStorage,
    updateBadge,
    initKeyboardEvent,
    onHoverVideoElement,
    updateVideoCheck,
    updateEnable,
    capture,
    advancedPictureInPicture,
    startRecord,
    stopRecord,
    createAudioCapture,
    updateDownloadList,
} from "./update";
import { sendRuntimeMessage } from "../util";
import browser from "webextension-polyfill";

function injectScript() {
    // if (window.location.href.startsWith("https://localhost:3000/signin")) {
    //     const injectJs = document.getElementById("video-roll-script");

    //     if (injectJs) return;

    //     const src = browser.runtime.getURL("inject/auth.js");
    //     const script = document.createElement("script");
    //     script.setAttribute("id", "video-roll-script");
    //     script.setAttribute("type", "text/javascript");
    //     script.setAttribute("src", src);

    //     (document.head || document.documentElement).appendChild(script);
    // }

    const injectJs = document.getElementById("video-roll-script");

    if (injectJs) return;

    const src = browser.runtime.getURL("inject/download.js");
    const script = document.createElement("script");
    script.setAttribute("id", "video-roll-script");
    script.setAttribute("type", "text/javascript");
    script.setAttribute("src", src);

    (document.head || document.documentElement).appendChild(script);
}

(function () {
    let videoNumber: number = 0;
    console.log('注入了')
    // injectScript();
    /**
     * get message from popup or backgound
     */
    chrome.runtime.onMessage.addListener(async (data, b, send) => {
        const {
            rollConfig,
            tabId,
            type,
            id,
            isIn,
            ids,
            streamId,
            downloadList,
        } = data;

        try {
            switch (type) {
                case ActionType.GET_BADGE: {
                    updateBadge({
                        tabId,
                        rollConfig,
                        callback: ({
                            text,
                            videoList,
                        }: {
                            text: string;
                            videoList: VideoListItem[];
                        }) => {
                            videoNumber = Number(text);
                            sendRuntimeMessage(tabId, {
                                text,
                                type: ActionType.UPDATE_BADGE,
                                videoList,
                            });
                        },
                    });
                    break;
                }
                // when popup onMounted, set init flip value to background,
                // through backgroundjs sending message to popup to store flip value
                case ActionType.ON_MOUNTED: {
                    updateOnMounted(tabId, { ...rollConfig, videoNumber });
                    break;
                }
                case ActionType.UPDATE_STORAGE:
                    updateStorage({ ...rollConfig, videoNumber }, send);
                    return;
                case ActionType.UPDATE_CONFIG: {
                    updateConfig(tabId, { ...rollConfig, videoNumber });
                    break;
                }
                case ActionType.INIT_SHORT_CUT_KEY:
                    initKeyboardEvent(tabId);
                    break;
                case ActionType.ON_HOVER_VIDEO: {
                    onHoverVideoElement(id, isIn);
                    break;
                }
                case ActionType.UPDATE_VIDEO_CHECK: {
                    updateVideoCheck(ids);
                    break;
                }
                case ActionType.UPDATE_ENABLE: {
                    updateEnable(tabId, { ...rollConfig, videoNumber });
                    break;
                }
                case ActionType.CAPTURE: {
                    capture(tabId, { ...rollConfig });
                    break;
                }
                case ActionType.ADVANCED_PICTURE_IN_PICTURE: {
                    advancedPictureInPicture(tabId, { ...rollConfig });
                    break;
                }
                case ActionType.START_RECORD:
                    startRecord(tabId, { ...rollConfig });
                    break;
                case ActionType.STOP_RECORD:
                    stopRecord(tabId, { ...rollConfig });
                    break;
                case ActionType.AUDIO_CAPTURE:
                    createAudioCapture(tabId, { ...rollConfig }, streamId);
                    break;
                case ActionType.GET_DOWNLOAD_LIST:
                    updateDownloadList(downloadList);
                    break;
                default:
                    return;
            }

            send("rotate success");
        } catch (err) {
            console.debug(err);
        }
    });
})();
