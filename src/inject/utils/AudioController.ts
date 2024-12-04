import Audiohacker from "audio-hacker";

export default class AudioController {
    audioHackers: Audiohacker[] = [];

    audioCtx: AudioContext | null = null;

    doneEvents: Function[] = [];

    videoElements: Set<HTMLVideoElement>;

    audioElements: Set<HTMLAudioElement>;

    constructor(
        videoElements: Set<HTMLVideoElement>,
        audioElements: Set<HTMLAudioElement>
    ) {
        this.videoElements = videoElements;
        this.audioElements = audioElements;
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

    async createAudioContext() {
        if (this.videoElements.size === 0 && this.audioElements.size === 0)
            return this;

        console.log(this.videoElements, "this.videoElements");

        try {
            this.audioCtx = new AudioContext();
            const { audioCtx } = this;

            if (audioCtx.state !== "running") {
                await audioCtx.resume();
            }

            this.createAudiohacker();
        } catch (err) {
            
        }

        return this;
    }

    createAudiohacker() {
        const audioCtx = this.audioCtx as AudioContext;

        if (!audioCtx) return;

        this.videoElements.forEach((video) => {
            const node = audioCtx.createMediaElementSource(
                video as HTMLMediaElement
            );

            this.audioHackers.push(new Audiohacker(audioCtx, node));
        });

        this.audioElements.forEach((video) => {
            const node = audioCtx.createMediaElementSource(
                video as HTMLMediaElement
            );

            this.audioHackers.push(new Audiohacker(audioCtx, node));
        });
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
        this.audioHackers.forEach((v) => {
            v.setPitchOffset(value);
        });
    }

    setVolume(value: number) {
        this.audioHackers.forEach((v) => {
            v.setVolume(value);
        });
    }

    setDelay(value: number) {
        this.audioHackers.forEach((v) => {
            v.setDelay(value);
        });
    }

    setPanner(value: boolean) {
        this.audioHackers.forEach((v) => {
            v.setPanner(value);
        });
    }

    setStereoPanner(value: number) {
        this.audioHackers.forEach((v) => {
            v.setStereoPanner(value);
        });
    }
}
