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
            await this.checkInstance()

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
                    await this.checkInstance()

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
        console.log(this.streamId, "sssstreamId");
        try {
            navigator.mediaDevices
                .getUserMedia({
                    audio: {
                        mandatory: {
                            chromeMediaSource: "tab",
                            chromeMediaSourceId: this.streamId,
                        },
                    },
                    video: false
                })
                .then(async (tabStream) => {
                    console.log(this.streamId, "this.streamId");
                    this.audioCtx = new AudioContext();

                    // if (this.audioCtx.state !== "running") {
                    //     await this.audioCtx.resume();
                    // }
                    console.log('tabStream', tabStream)
                    const node = this.audioCtx.createMediaStreamSource(tabStream);
                    const gainNode = this.audioCtx.createGain();
                    // gainNode.gain.value = 3.5; // 设置音量
                    node.connect(gainNode).connect(this.audioCtx.destination);
                    // console.log('成功')
                    // // const stream = video?.captureStream?.(60)
                    // this.createAudiohacker(tabStream);
                })
                .catch((err) => {
                    console.error(err);
                });

            // this.audioCtx = new AudioContext();
            // const { audioCtx } = this;

            // if (audioCtx.state !== "running") {
            //     await audioCtx.resume();
            // }

            // this.createAudiohacker();
        } catch (err) {
            this.audioCtx = null;
            console.error("err", err);
        }
        return this;
    }

    createAudiohacker(stream: any) {
        const audioCtx = this.audioCtx as AudioContext;

        if (!audioCtx) return;

        const node = audioCtx.createMediaStreamSource(stream);
        const gainNode = audioCtx.createGain();
        gainNode.gain.value = 1.5; // 设置音量
        node.connect(gainNode).connect(audioCtx.destination);
        // this.audioHackers.push(new Audiohacker(audioCtx, node));
        // this.videoElements.forEach((video) => {
        //     const stream = video?.captureStream?.(60);
        //     const node = audioCtx.createMediaStreamSource(
        //         stream
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
