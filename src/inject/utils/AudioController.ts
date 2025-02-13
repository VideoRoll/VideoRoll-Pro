import Audiohacker from "./audiohacker";
import { ActionType, IRollConfig } from "src/types/type.d";

export default class AudioController {
    audioHacker: Audiohacker | null = null;

    audioCtx: AudioContext | null = null;

    doneEvents: Function[] = [];

    rollConfig: IRollConfig;

    streamId: string = "";

    constructor(
        streamId: string,
        rollConfig: IRollConfig
    ) {
        this.streamId = streamId ?? "";
        this.rollConfig = rollConfig;
        this.setup();
    }

    async setup() {
        try {
            await this.checkInstance();

            if (this.audioCtx) {
                for (const event of this.doneEvents) {
                    console.log(event, "downevent");
                    event();
                }
                this.doneEvents = [];
            }
        } catch (err) {
            console.error(err);
        }
    }

    done(callback: Function) {
        if (typeof callback === "function") {
            console.log("callback");
            this.doneEvents.push(callback);
        }
    }

    async checkInstance() {
        if (!this.streamId || this.isBaseValue()) return this;

        if (!this.audioCtx) {
            await this.createAudioContext();
        }
        return this;
    }

    isBaseValue() {
        if (
            this.rollConfig.volume === 1 &&
            this.rollConfig.delay === 0 &&
            this.rollConfig.panner === false &&
            this.rollConfig.stereo === 0 &&
            this.rollConfig.pitch.on === false
        ) {
            return true;
        }

        return false;
    }

    async createAudioContext() {
        if (!this.streamId) return;

        try {
            await navigator.mediaDevices
                .getUserMedia({
                    audio: {
                        mandatory: {
                            chromeMediaSource: "tab",
                            chromeMediaSourceId: this.streamId,
                        },
                    },
                    video: false,
                })
                .then(async (tabStream) => {
                    this.audioCtx = new AudioContext();

                    if (this.audioCtx.state !== "running") {
                        await this.audioCtx.resume();
                    }

                    this.createAudiohacker(tabStream);
                })
                .catch((err) => {
                    console.error(err);
                    this.audioCtx = null;
                });
        } catch (err) {
            this.audioCtx = null;
            console.error("err", err);
        }
        return this;
    }

    createAudiohacker(stream: any) {
        const audioCtx = this.audioCtx as AudioContext;

        if (!audioCtx) return;

        if (this.audioHacker && this.isBaseValue()) {
            this.reset();
            return;
        }

        const node = audioCtx.createMediaStreamSource(stream);
        this.audioHacker = new Audiohacker(audioCtx, node);

        this.update(this.streamId, this.rollConfig);
    }

    reset() {
        if (!this.audioHacker) return this;

        this.audioHacker.setPitchOffset(0);
        this.audioHacker.setVolume(1);
        this.audioHacker.setDelay(0);
        this.audioHacker.setPanner(false);
        this.audioHacker.setStereoPanner(0);

        // this.audioHacker.disconnect();
        // this.audioCtx = null;

        // chrome.offscreen.closeDocument();
    }

    hasInstance() {
        return Boolean(this.audioHacker);
    }

    async update(streamId: string, rollConfig: IRollConfig) {
        console.log(this.streamId, '---straemId')

        if (streamId) {
            this.streamId = streamId;
        }

        this.rollConfig = rollConfig;

        await this.checkInstance();

        if (!this.audioHacker) return this;

        if (this.isBaseValue()) {
            console.log('isBase')
            this.reset();
            return;
        }

        console.log('update ---------', this.rollConfig);

        this.audioHacker.setVolume(rollConfig.volume);
        this.audioHacker.setDelay(rollConfig.delay);
        this.audioHacker.setPanner(rollConfig.panner);
        this.audioHacker.setStereoPanner(rollConfig.stereo);

        const { on, value } = rollConfig.pitch;

        try {
            if (!on) {
                // set to 0
                this.audioHacker.setPitchOffset(0);
                return;
            } else {
                this.audioHacker.setPitchOffset(value);
            }
        } catch (err) {
            console.debug(err);
        }
    }
}
