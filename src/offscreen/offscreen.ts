import AudioController from "src/inject/utils/AudioController";
import { ActionType } from "src/types/type.d";
("src/");

const tabs = new Map();

chrome.runtime.onMessage.addListener(async (e) => {
    if ("offscreen" !== e.target) return;

    if (e.type === ActionType.AUDIO_CAPTURE && !tabs.has(e.rollConfig.tabId)) {
        try {
            tabs.set(
                e.rollConfig.tabId,
                new AudioController(e.streamId, e.rollConfig)
            );
        } catch (err) {
            tabs.delete(e.rollConfig.tabId);
            console.error("err", err);
        }
    }

    if (e.type === ActionType.UPDATE_AUDIO && tabs.has(e.rollConfig.tabId)) {
        const audioController = tabs.get(e.rollConfig.tabId);
        console.log(e.rollConfig, "e.rollConfig");
        audioController.update(e.streamId, e.rollConfig);
    }

    if (e.type === ActionType.DELETE_AUDIO && tabs.has(e.tabId)) {
        tabs.delete(e.tabId);
    }
});
