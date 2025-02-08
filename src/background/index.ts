/*
 * @description: event Listener
 * @Author: Gouxinyu
 * @Date: 2022-04-23 23:37:22
 */
import { createURL, sendRuntimeMessage } from "src/util";
import { ActionType } from "../types/type.d";
import { sendTabMessage, setBadge, getBrowser } from "../util";
import { useShortcuts } from "src/use/useShortcuts";
import { useGeneralConfig } from "src/options/use/useGeneralConfig";
import browser from "webextension-polyfill";
import { getUser, injectAuth } from "./auth";

let currentTabId: number | undefined;

async function hasOffscreenDocument() {
    if ("getContexts" in chrome.runtime) {
        const offscreenUrl = chrome.runtime.getURL("offscreen/offscreen.html");
        const contexts = await chrome.runtime.getContexts({
            contextTypes: ["OFFSCREEN_DOCUMENT"],
            documentUrls: [offscreenUrl],
        });
        return Boolean(contexts.length);
    } else {
        const matchedClients = await clients.matchAll();
        return await matchedClients.some((client) => {
            client.url.includes(chrome.runtime.id);
        });
    }
}

function setupStorage() {
    // 检查并设置默认值
    chrome.storage.sync.get(["shortcuts", "generalConfig"], (result) => {
        if (!result.shortcuts) {
            // 果没有找到存储的值，就使用默认值
            const shortcutsMap = useShortcuts();
            chrome.storage.sync.set({
                shortcuts: JSON.parse(JSON.stringify(shortcutsMap.value)),
            });
        }

        if (!result.generalConfig) {
            // 如果没有找到存储的值，就使用默认值
            const generalConfig = useGeneralConfig();
            chrome.storage.sync.set({
                generalConfig: JSON.parse(JSON.stringify(generalConfig.value)),
            });
        }
    });
}

chrome.runtime.onInstalled.addListener((params: any) => {
    const reason = params.reason;
    switch (reason) {
        case "install":
            createURL("https://videoroll.gomi.site");
            break;
        case "update":
            createURL("https://videoroll.gomi.site");
            break;
        case "uninstall":
            createURL("https://videoroll.gomi.site");
            break;
        default:
            break;
    }
});

async function getStreamId() {
    const streamId = await chrome.tabCapture.getMediaStreamId({
        // consumerTabId: currentTabId,
        targetTabId: currentTabId,
    });

    return streamId;
}

(getBrowser("action") as typeof chrome.action).setBadgeBackgroundColor({
    color: "#a494c6",
});

/**
 * when url has been changed, send a masseage to content.js
 * and update badge;
 */
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    currentTabId = tabId;
    setupStorage();
    sendTabMessage(
        tabId,
        { type: ActionType.GET_BADGE, tabId },
        (response: any) => {
            sendTabMessage(tabId, { type: ActionType.INIT_SHORT_CUT_KEY });
        }
    );
});

// when tab is changed and it means a tab is actived
chrome.tabs.onActivated.addListener((activeInfo) => {
    const { tabId } = activeInfo;
    currentTabId = tabId;
    console.log("activeTabId", activeInfo);
    setupStorage();
    sendTabMessage(
        tabId,
        { type: ActionType.GET_BADGE, tabId },
        (response: any) => {
            sendTabMessage(tabId, { type: ActionType.INIT_SHORT_CUT_KEY });
        }
    );
});

/**
 * update
 */
chrome.runtime.onMessage.addListener(async (a, b, send) => {
    if (typeof currentTabId !== "number") return;

    const { rollConfig, type, text, tabId } = a;

    switch (type) {
        case ActionType.UPDATE_STORAGE:
            sendTabMessage(currentTabId, {
                rollConfig,
                type: ActionType.UPDATE_STORAGE,
                tabId,
            });
            break;
        case ActionType.UPDATE_BADGE:
            setBadge(tabId, text);
            break;
        case ActionType.BACK_TO_TAB:
            browser.tabs
                .move([rollConfig.tabId], {
                    windowId:
                        rollConfig.advancedPictureInPicture.originWindowId,
                    index: rollConfig.advancedPictureInPicture.tabIndex,
                })
                .then(() => {
                    browser.tabs
                        .update(rollConfig.tabId, { active: true })
                        .then(() => {
                            currentTabId = rollConfig.tabId;
                            setTimeout(() => {
                                rollConfig.advancedPictureInPicture.on = false;
                                sendTabMessage(currentTabId as number, {
                                    rollConfig,
                                    type: ActionType.UPDATE_CONFIG,
                                    tabId,
                                });
                            });
                        });
                });

            break;
        case ActionType.AUDIO_CAPTURE: {
            const hasOffscreen = await hasOffscreenDocument();

            if (!hasOffscreen) {
                await chrome.offscreen.createDocument({
                    url: "offscreen/offscreen.html",
                    reasons: ["USER_MEDIA"],
                    justification: "reason for needing the document",
                });
            }

            let streamId
            try {
                streamId = await getStreamId();
            } catch(err) {
                console.warn(err);
            }

            console.log(streamId, '---streamId')
            sendRuntimeMessage(rollConfig.tabId, {
                type: ActionType.AUDIO_CAPTURE,
                target: 'offscreen',
                streamId,
                rollConfig: rollConfig,
            });
            break;
        }
        case ActionType.UPDATE_AUDIO: {
            const hasOffscreen = await hasOffscreenDocument();

            if (!hasOffscreen) break;
            let streamId;
            try {
                streamId = await getStreamId();
            } catch(err) {
                console.warn(err);
            }

            sendRuntimeMessage(rollConfig.tabId, {
                type: ActionType.UPDATE_AUDIO,
                target: 'offscreen',
                streamId,
                rollConfig: rollConfig,
            });
        }
        default:
            break;
    }

    // 监听窗口焦点变化
    // browser.windows.onFocusChanged.addListener(function(windowId) {
    //     if (popupWindowId && windowId !== popupWindowId) {
    //         chrome.windows.update(popupWindowId, { focused: true });
    //     }
    // });

    send("update");
});

injectAuth();
