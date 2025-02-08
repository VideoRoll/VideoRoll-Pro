import AudioController from "src/inject/utils/AudioController";
import { ActionType } from "src/types/type.d";
 'src/'
let audioController: any;

chrome.runtime.onMessage.addListener(async (e) => {
    if ("offscreen" !== e.target) return;

    if (e.type === ActionType.AUDIO_CAPTURE && !audioController) {
        try {
            audioController = new AudioController(e.streamId, e.rollConfig);
        } catch (err) {
            audioController = null;
            console.error("err", err);
        }
    }

    if (e.type === ActionType.UPDATE_AUDIO && audioController) {
        console.log(e.rollConfig, 'e.rollConfig');
        audioController.update(e.streamId, e.rollConfig)
    }
});
