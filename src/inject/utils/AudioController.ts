import { sendRuntimeMessage } from "src/util";
import Audiohacker from "./audiohacker";
import { ActionType, IRollConfig } from "src/types/type.d";

export default class AudioController {
    audioHackers: Audiohacker[] = [];

    audioCtx: AudioContext | null = null;

    doneEvents: Function[] = [];

    streamId: string = "";

    videoElements: Set<HTMLVideoElement>;

    audioElements: Set<HTMLAudioElement>;

    rollConfig: IRollConfig;

    constructor(
        videoElements: Set<HTMLVideoElement>,
        audioElements: Set<HTMLAudioElement>,
        streamId: string
    ) {
        this.videoElements = videoElements;
        this.audioElements = audioElements;
        this.streamId = streamId;
        this.setup();
    }

    async setup() {
        try {
            await this.createAudioContext();

            if (this.audioCtx) {
                for (const event of this.doneEvents) {
                    console.log(event, "downevent");
                    event();
                }
                this.doneEvents = [];
            }
        } catch (err) {
            window.addEventListener(
                "mousedown",
                async () => {
                    await this.createAudioContext();

                    if (this.audioCtx) {
                        for (const event of this.doneEvents) {
                            console.log(event, "downevent");
                            event();
                        }

                        this.doneEvents = [];
                    }
                },
                { once: true }
            );
        }
    }

    done(callback: Function) {
        if (typeof callback === "function") {
            console.log("callback");
            this.doneEvents.push(callback);
        }
    }

    async checkInstance() {
        if (!this.audioCtx) {
            await this.createAudioContext();
        }
        return this;
    }

    async createAudioContext() {
        if (this.videoElements?.size === 0 && this.audioElements?.size === 0)
            return this;

        console.log(this.videoElements, "this.videoElements");

        if (!this.streamId) return;

        try {
            navigator.mediaDevices
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
                    const { audioCtx } = this;

                    if (audioCtx.state !== "running") {
                        await audioCtx.resume();
                    }

                    this.createAudiohacker(tabStream);
                })
                .catch((err) => {
                    console.error(err);
                });
        } catch (err) {
            this.audioCtx = null;
            console.error("err", err);
        }
        return this;
    }

    createAudiohacker(stream: MediaStream) {
        const audioCtx = this.audioCtx as AudioContext;

        if (!audioCtx) return;

        const node = audioCtx.createMediaStreamSource(stream);

        this.audioHackers.push(new Audiohacker(audioCtx, node));
        // this.videoElements.forEach((video) => {
        //     const node = audioCtx.createMediaElementSource(
        //         video as HTMLMediaElement
        //     );

        //     this.audioHackers.push(new Audiohacker(audioCtx, node));
        // });

        // this.audioElements.forEach((video) => {
        //     const node = audioCtx.createMediaElementSource(
        //         video as HTMLMediaElement
        //     );

        //     this.audioHackers.push(new Audiohacker(audioCtx, node));
        // });
    }

    reset() {
        this.audioHackers.forEach((v) => {
            v.setPitchOffset(0);
            v.setVolume(1);
            v.setDelay(0);
            v.setPanner(false);
            v.setStereoPanner(0);
        });
    }

    hasInstance() {
        return Boolean(this.audioHackers.length);
    }

    setPitchOffset(value: number) {
        this.checkInstance().then(() => {
            this.audioHackers.forEach((v) => {
                v.setPitchOffset(value);
            });
        });
    }

    setVolume(value: number) {
        this.checkInstance().then(() => {
            this.audioHackers.forEach((v) => {
                v.setVolume(value);
            });
        });
    }

    setDelay(value: number) {
        this.checkInstance().then(() => {
            this.audioHackers.forEach((v) => {
                v.setDelay(value);
            });
        });
    }

    setPanner(value: boolean) {
        this.checkInstance();
        this.audioHackers.forEach((v) => {
            v.setPanner(value);
        });
    }

    setStereoPanner(value: number) {
        this.checkInstance().then(() => {
            this.audioHackers.forEach((v) => {
                v.setStereoPanner(value);
            });
        });
    }
}
