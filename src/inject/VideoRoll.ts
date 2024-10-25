/*
 * @description: VideoRoll class
 * @Author: Gouxinyu
 * @Date: 2022-05-31 23:27:36
 */
import WEBSITE from "../website";
import Audiohacker from "audio-hacker";
import * as THREE from "three";
import {
    Flip,
    IMove,
    IFilter,
    Focus,
    FilterUnit,
    IRollConfig,
    FlipType,
    VideoSelector,
    VideoElement,
    OriginElementPosition,
    IRealVideoPlayer,
    VideoListItem,
    ActionType,
    AdvancedPictureInPicture,
    Abloop,
} from "../types/type.d";
import { nanoid } from "nanoid";
import { isVisible, sendRuntimeMessage } from "src/util";
import debounce from "lodash-es/debounce";
import { getName } from "./utils/getName";
import Recorder from "./utils/Recorder";
import Looper from "./utils/Looper";

export default class VideoRoll {
    static rollConfig: IRollConfig;

    static audioCtx: AudioContext | null = null;

    static audioController: Audiohacker[] = [];

    static videoElements: Set<HTMLVideoElement> = new Set();

    static documents: Document[] = [];

    static videoNumbers: number = 0;

    static videoList: VideoListItem[] = [];

    static realVideoPlayer: IRealVideoPlayer = {
        width: 0,
        height: 0,
        player: null,
    };

    static originElementPosition: OriginElementPosition | null;

    static observer: MutationObserver | null;

    static eventCallback: Function | null = null;

    static recorder: Recorder;

    static looper: Looper;

    static setRollConfig(rollConfig: IRollConfig) {
        this.rollConfig = rollConfig;
        return this;
    }

    /**
     * get url host name
     * @returns
     */
    static getHostName(): string {
        // url reg
        const url = window.location.href;
        const urlReg = /^http(s)?:\/\/(.*?)\//;
        const hostName = urlReg.exec(url)?.[2] ?? "";

        return hostName;
    }

    /**
     * 计算视频缩放比例
     * @param dom
     * @param deg
     * @returns
     */
    static getScaleNumber(
        target: HTMLVideoElement,
        deg: number
    ): [number, number] {
        const offsetWidth = target.offsetWidth ?? 0;
        const offsetHeight = target.offsetHeight ?? 0;
        const videoWidth = target.videoWidth ?? 0;
        const videoHeight = target.videoHeight ?? 0;

        const isHorizonDeg = deg === 90 || deg === 270;

        // 根据原始视频的宽高比例，和容器的宽高比例，计算缩放比例
        const isHorizonVideo = videoWidth > videoHeight;
        const isHorizonDom = offsetWidth > offsetHeight;

        // 判断旋转后的缩放比例
        // 1.若是竖屏视频，但在横屏容器中，初始就是等比缩小的
        if (isHorizonDeg && !isHorizonVideo && isHorizonDom) {
            const scale = offsetWidth / offsetHeight;
            // if video element is shadowdom, cant get video height;
            return Number.isNaN(scale) ? [1, 1] : [scale, scale];
        }

        // 2.若是竖屏视频，横屏中，旋转回0或180
        if (!isHorizonDeg && !isHorizonVideo && isHorizonDom) {
            return [1, 1];
        }

        // 3.若是横屏视频，处在横屏容器中
        if (isHorizonDeg && isHorizonVideo && isHorizonDom) {
            const value = offsetHeight / offsetWidth;
            return Number.isNaN(value) ? [1, 1] : [value, value];
        }

        if (!isHorizonDeg && isHorizonVideo && isHorizonDom) {
            return [1, 1];
        }

        // 若是竖屏且容器为竖屏
        if (!isHorizonVideo && !isHorizonDom && isHorizonDeg) {
            const value = videoWidth / videoHeight;
            return Number.isNaN(value) ? [1, 1] : [value, value];
        }

        return [1, 1];
    }

    /**
     * get all documnets includes iframes
     */
    static updateDocuments() {
        const iframes = document.querySelectorAll("iframe") ?? [];
        const iframeEls: HTMLIFrameElement[] = Array.from(iframes).filter(
            (v) => v.contentDocument
        );

        this.setRollConfig({
            ...this.rollConfig,
            iframes: Array.from(iframes).map((v) => v.src),
        });

        this.documents = [
            document,
            ...iframeEls
                .map((v) => {
                    if (v.contentDocument) {
                        // @ts-ignore
                        v.contentDocument.iframeElement = v;
                    }
                    return v.contentDocument as Document;
                })
                .filter((v) => v.querySelectorAll("video").length > 0),
        ];

        return this;
    }

    /**
     * get all video elements
     */
    static updateVideoElements(videoSelector: VideoSelector) {
        if (!this.documents.length) return;

        this.addMaskElement();
        this.addVrMaskElement();
        this.addPipMaskElement();
        // this.clearOriginElementPosition();
        this.clearRealVideoPlayer();
        const videos = this.getAllVideosBySelector(
            videoSelector,
            this.documents
        );

        this.setVideo(videos);

        const mask = document.getElementById("video-roll-root-mask");
        if (
            !this.realVideoPlayer.player ||
            this.realVideoPlayer.player?.parentElement === mask
        )
            return;

        if (this.rollConfig.advancedPictureInPicture?.on) return this;

        const originElementPosition = this.findOriginElementPosition(
            this.realVideoPlayer.player as HTMLVideoElement
        );
        this.setOriginElementPosition(originElementPosition);
        return this;
    }

    static updateVideoNumbers(videoSelector: VideoSelector) {
        if (!this.documents.length) return;

        const videos = this.getAllVideosBySelector(
            videoSelector,
            this.documents
        );

        this.setVideo(videos);
        return this;
    }

    static getSourceElementSrc(video: HTMLVideoElement) {
        if (!video.src) {
            // twitch has no src
            const src = video.querySelector("source")?.src ?? "no-src";
            return src;
        }
        return video.src;
    }

    static getAllVideosBySelector(
        videoSelector: VideoSelector,
        docs: Document[] | HTMLIFrameElement[]
    ): HTMLVideoElement[] {
        const { defaultDom } = videoSelector;
        const videos: HTMLVideoElement[] = [];
        if (defaultDom) {
            docs.forEach((doc) => {
                const defaultElements: NodeListOf<HTMLVideoElement> =
                    doc.querySelectorAll(defaultDom);
                const elements = Array.from(defaultElements).filter((element) =>
                    this.getSourceElementSrc(element)
                );

                for (const video of elements) {
                    // @ts-ignore
                    video.parentDocument = doc;

                    if (video.dataset.rollId) {
                        continue;
                    }

                    video.setAttribute("data-roll-id", `${nanoid()}`);
                    video.setAttribute("data-roll-check", "true");
                }

                videos.push(...elements);
            });
        }

        return videos;
    }

    /**
     * set videoElements
     * @param videoSelector
     * @param doc
     * @returns
     */
    static setVideo(videos: HTMLVideoElement[]) {
        this.videoElements.forEach((item) => {
            // @ts-ignore
            if (!videos.some((v) => v === item)) {
                this.videoElements.delete(item);
            }
        });

        for (let i = 0; i < videos.length; i++) {
            const video = videos[i];

            if (i === 0) {
                this.setRealVideoPlayer(video);
            } else if (this.isRealVideoPlayer(video)) {
                this.setRealVideoPlayer(video);
            }

            if (this.videoElements.has(video)) continue;

            this.videoElements.add(video);
        }

        this.setVideoNumbers();
    }

    static setVideoNumbers(): void {
        this.videoNumbers = this.videoElements.size;
    }

    static setOriginElementPosition(data: any) {
        this.originElementPosition = data;
    }

    static setRealVideoPlayer(realPlayer: HTMLVideoElement) {
        this.realVideoPlayer = {
            width: realPlayer.offsetWidth,
            height: realPlayer.offsetHeight,
            player: realPlayer,
        };
    }

    /**
     * clear all cache
     */
    static clearVideoElements() {
        this.videoElements.clear();
    }

    static clearOriginElementPosition() {
        this.originElementPosition = null;
    }

    static clearRealVideoPlayer() {
        this.realVideoPlayer = { width: 0, height: 0, player: null };
    }

    static isRealVideoPlayer(player: HTMLVideoElement): boolean {
        const isSmaller =
            player.offsetWidth < this.realVideoPlayer.width ||
            player.offsetHeight < this.realVideoPlayer.height;

        // this may be ads video player
        if (player.muted && player.loop && isSmaller) return false;

        if ("readyState" in player && player.readyState === 0) return false;

        if (isSmaller && player.readyState === 0) return false;

        if (player.loop && isSmaller) return false;

        if (isSmaller) return false;

        return true;
    }

    /**
     * set video rotate deg
     * @param rollConfig
     * @returns
     */
    static updateVideo(rollConfig: IRollConfig) {
        this.setRollConfig(rollConfig);
        const {
            deg,
            flip,
            scale,
            zoom,
            move,
            filter,
            focus,
            pictureInPicture,
            vr,
            advancedPictureInPicture,
            abLoop,
        } = rollConfig;

        const videos = this.videoElements.values();
        for (const target of videos) {
            if (target.dataset.rollCheck === "false") {
                target.classList.remove("video-roll-deg-scale");
                target.setAttribute("data-roll", "false");
                this.toggleLoop(target, false);
                continue;
            }

            const dom = target;

            let scaleNum: [number, number] = [1, 1];

            if (rollConfig.isAutoChangeSize) {
                scaleNum =
                    this.rollConfig.isInit ||
                    scale.values.some((v) => Number(v) !== 1)
                        ? scale.values
                        : this.getScaleNumber(target, deg);
            }

            this.rollConfig.scale.values = scaleNum;
            this.rollConfig.document = { title: document.title };
            this.documents.forEach((doc) => {
                if (!this.isExistStyle(doc)) return;
                this.replaceClass(
                    { deg, flip, scale: scaleNum, zoom, move, filter, focus },
                    doc
                );
            });

            dom.classList.add("video-roll-deg-scale");
            dom.setAttribute("data-roll", "true");

            this.toggleLoop(dom, rollConfig.loop);
        }

        this.updateFocus(
            this.realVideoPlayer.player as HTMLVideoElement,
            focus
        );
        this.togglePictureInPicture(pictureInPicture);
        this.updateLoop(abLoop);
        this.updateVr(this.realVideoPlayer.player as HTMLVideoElement, vr);
        this.updateAdvancedPictureInPicture(
            this.realVideoPlayer.player as HTMLVideoElement,
            advancedPictureInPicture
        );
        return this;
    }

    /**
     * update audio
     */
    static async updateAudio() {
        await this.updatePitch();
        await this.updateVolume();
        this.updatePlaybackRate();
        this.toggleMuted();
        return this;
    }

    /**
     * web muted
     */
    static toggleMuted() {
        sendRuntimeMessage(this.rollConfig.tabId, {
            type: ActionType.MUTED,
            muted: this.rollConfig.muted,
        });
    }

    static resetAudio() {
        this.audioController.forEach((v) => {
            v.setPitchOffset(0);
            v.setVolume(1);
        });
        this.videoElements.forEach((video) => {
            (video as HTMLMediaElement).playbackRate = 1;
        });
    }

    static getFilterStyle(filter: IFilter) {
        let filterStyle = "";

        Object.keys(filter)
            .filter((type) => type !== "mode")
            .forEach((type: string) => {
                filterStyle += ` ${type}(${filter[type as keyof IFilter]}${
                    (FilterUnit as any)[type]
                })`;
            });

        return filterStyle;
    }

    /**
     * change class content
     * @param deg
     * @param scaleNum
     */
    static replaceClass(
        rollConfig: {
            deg: number;
            flip: Flip;
            scale: [number, number];
            zoom: number;
            move: IMove;
            filter: IFilter;
            focus: Focus;
        },
        doc = document
    ) {
        const { deg, flip, scale, zoom, move, filter, focus } = rollConfig;
        const degScale = doc.getElementById(
            "video-roll-deg-scale"
        ) as HTMLElement;

        const filterStyle =
            filter.mode === "custom"
                ? this.getFilterStyle(filter)
                : filter.mode;

        const translateStyle =
            Number(move.x) !== 0 || Number(move.y) !== 0
                ? `translate(${move.x}%, ${-move.y}%)`
                : "";
        const scaleStyle = scale.some((v) => Number(v) !== 1)
            ? `scale(${scale[0]}, ${scale[1]})`
            : "";
        const zoomStyle =
            Number(zoom) !== 1 ? `scale3d(${zoom}, ${zoom}, 1)` : "";

        degScale.innerHTML = `.video-roll-deg-scale { 
            transform: ${FlipType[flip]} rotate(${deg}deg) ${zoomStyle} ${scaleStyle} ${translateStyle} !important; 
            filter: ${filterStyle}; 
        }
        `;

        return this;
    }

    /**
     * 是否存在class
     * @returns
     */
    static isExistStyle(doc: Document) {
        const degScale = doc.getElementById("video-roll-deg-scale");
        const focusStyle = doc.getElementById("video-roll-focus-style");
        const vrStyle = doc.getElementById("video-roll-vr-style");
        const pictureInPictureStyle = doc.getElementById(
            "video-roll-pip-style"
        );

        return (
            (degScale && focusStyle && vrStyle && pictureInPictureStyle) || null
        );
    }

    /**
     * get video dom selector
     * @param hostName
     * @returns
     */
    static getVideoSelector(hostName: string) {
        let videoSelector = {
            defaultDom: "video",
        };

        if (!hostName) {
            return videoSelector;
        }

        for (const key of Object.keys(WEBSITE)) {
            if (hostName.includes(key)) {
                const target = WEBSITE[key];
                videoSelector = target.videoSelector;
                return videoSelector;
            }
        }

        return videoSelector;
    }

    /**
     * get roll config
     * @returns
     */
    static getRollConfig() {
        return this.rollConfig;
    }

    /**
     * add style
     * @returns
     */
    static addStyleClass(isClear: boolean = false) {
        const { storeThisTab, store } = this.getRollConfig();

        for (const doc of this.documents) {
            const styles = this.isExistStyle(doc);

            if (styles) {
                if (!isClear) return this;

                if (!storeThisTab && !store) {
                    styles.innerHTML = `
                    .video-roll-deg-scale {}
                `;
                    return this;
                }

                return this;
            }

            const degScale = doc.createElement("style");
            degScale.innerHTML = `
                .video-roll-deg-scale {}
            `;

            degScale.setAttribute("id", "video-roll-deg-scale");
            degScale.setAttribute("type", "text/css");

            const focusStyle = doc.createElement("style");
            focusStyle.innerHTML = ``;
            focusStyle.setAttribute("id", "video-roll-focus-style");
            focusStyle.setAttribute("type", "text/css");

            const vrStyle = doc.createElement("style");
            vrStyle.innerHTML = ``;
            vrStyle.setAttribute("id", "video-roll-vr-style");
            vrStyle.setAttribute("type", "text/css");

            const pictureInPictureStyle = doc.createElement("style");
            pictureInPictureStyle.innerHTML = ``;
            pictureInPictureStyle.setAttribute("id", "video-roll-pip-style");
            pictureInPictureStyle.setAttribute("type", "text/css");

            const overflowHidden = doc.createElement("style");
            overflowHidden.innerHTML = `.video-roll-overflow-hidden { overflow: hidden !important; }`;
            overflowHidden.setAttribute("id", "video-roll-overflow-hidden");

            const head = doc.getElementsByTagName("head")[0];

            if (head) {
                head.appendChild(degScale);
                head.appendChild(focusStyle);
                head.appendChild(vrStyle);
                head.appendChild(pictureInPictureStyle);
                head.appendChild(overflowHidden);
            }

            this.addMaskElement();
            this.addVrMaskElement();
            this.addPipMaskElement();
        }

        // if (storeThisTab) {
        //     this.updateVideo(this.rollConfig);
        // }

        return this;
    }

    /**
     * add mask element(for focus mode)
     */
    static addMaskElement() {
        if (!document.body) return;

        if (!document.getElementById("video-roll-root-mask")) {
            const mask = document.createElement("div");
            mask.setAttribute("id", "video-roll-root-mask");
            document.body.appendChild(mask);
        }
    }

    static showBackToTab = debounce(
        () => {
            const backToTab = document.getElementById("video-roll-backToTab");

            if (backToTab) {
                backToTab.style.display = "block";

                debounce(() => {
                    backToTab.style.display = "none";
                }, 500);
            }
        },
        500,
        { trailing: false, leading: true }
    );

    static backToTab = () => {
        sendRuntimeMessage(this.rollConfig.tabId, {
            type: ActionType.BACK_TO_TAB,
            rollConfig: this.rollConfig,
        });
    };

    static addPipMaskElement() {
        if (!document.body) return;

        if (!document.getElementById("video-roll-pip-mask")) {
            const mask = document.createElement("div");
            mask.setAttribute("id", "video-roll-pip-mask");
            mask.innerHTML = `<div id="video-roll-backToTab" style="display: none; position: absolute; left: 0; right: 0;
            top:0; bottom:0; margin: auto; width: 20%; height: 30px; background-color: #a494c6; opacity: 0.8;
            border-radius: 5px; color: #fff; text-align: center; line-height: 30px; z-index: 1; cursor: pointer;">
                back to tab
            </div>`;
            document.body.appendChild(mask);

            mask.removeEventListener("mousemove", this.showBackToTab);
            mask.addEventListener("mousemove", this.showBackToTab);

            const backToTab = document.getElementById("video-roll-backToTab");
            backToTab?.removeEventListener("click", this.backToTab);
            backToTab?.addEventListener("click", this.backToTab);
        }
    }

    static addVrMaskElement() {
        if (!document.body) return;

        if (!document.getElementById("video-roll-vr-mask")) {
            const mask = document.createElement("div");
            mask.setAttribute("id", "video-roll-vr-mask");
            document.body.appendChild(mask);
        }
    }

    /**
     * find the video's root wrapper element
     * @param dom
     * @param rect
     * @returns
     */
    static findOriginElementPosition(video: HTMLVideoElement): any {
        const { parentElement, previousElementSibling, nextElementSibling } =
            video;
        return {
            parentElement,
            previousElementSibling,
            nextElementSibling,
            style: {
                width: video.offsetWidth,
                height: video.offsetHeight,
            },
        };
    }

    /**
     * update focus mode
     * @param doc
     * @param video
     * @param focus
     * @returns
     */
    static updateFocus(video: HTMLVideoElement, focus: Focus) {
        const mask = document.getElementById("video-roll-root-mask");
        const focusStyle = document.getElementById(
            "video-roll-focus-style"
        ) as HTMLStyleElement;

        if (focusStyle) {
            focusStyle.innerHTML = `#video-roll-root-mask {
                display: ${focus.on ? "block" : "none"};
                position: fixed;
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;
                backdrop-filter: ${focus.blur ? "blur(10px)" : "unset"};
                z-index: 20000 !important;
                background-color: ${focus.backgroundColor};
            }
            
            .video-roll-focus {
                width: ${this.originElementPosition?.style.width}px;
                height: ${this.originElementPosition?.style.height}px;
                position: absolute;
                left: 0;
                right: 0;
                top: 0;
                bottom: 0;
                margin: auto;
                border-radius: ${focus.rounded ? "10px" : "unset"}
            }`;
        }

        if (!video) return this;

        if (!focus.on && this.originElementPosition && mask) {
            const { parentElement, nextElementSibling } =
                this.originElementPosition;
            if (video.parentElement === mask && parentElement) {
                video.classList.remove("video-roll-focus");
                if (video.classList.contains("video-roll-no-controls")) {
                    video.classList.remove("video-roll-no-controls");
                    video.controls = false;
                }

                if (nextElementSibling) {
                    parentElement.insertBefore(video, nextElementSibling);
                } else {
                    parentElement.appendChild(video);
                }
            }

            return this;
        }

        if (focus.on && this.originElementPosition && mask) {
            mask.appendChild(video);
            video.classList.add("video-roll-focus");

            if (!video.controls) {
                video.classList.add("video-roll-no-controls");
                video.controls = true;
            }
        }

        return this;
    }

    static updateAdvancedPictureInPicture(
        video: HTMLVideoElement,
        advancedPictureInPicture: AdvancedPictureInPicture
    ) {
        const mask = document.getElementById("video-roll-pip-mask");
        const pipStyle = document.getElementById(
            "video-roll-pip-style"
        ) as HTMLStyleElement;

        if (pipStyle) {
            pipStyle.innerHTML = `#video-roll-pip-mask {
                display: ${advancedPictureInPicture.on ? "block" : "none"};
                position: fixed;
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;
                z-index: 20000 !important;
                background-color: #000;
            }
            
            .video-roll-pip {
                width: 100% !important;
                height: 100% !important;
                position: absolute;
                left: 0;
                right: 0;
                top: 0;
                bottom: 0;
                margin: auto;
            }`;
        }

        if (!video) return this;

        if (
            !advancedPictureInPicture.on &&
            this.originElementPosition &&
            mask
        ) {
            const { parentElement, nextElementSibling } =
                this.originElementPosition;

            document.body.classList.remove("video-roll-overflow-hidden");
            if (video.parentElement === mask && parentElement) {
                video.classList.remove("video-roll-pip");
                if (video.classList.contains("video-roll-no-controls")) {
                    video.classList.remove("video-roll-no-controls");
                    video.controls = false;
                }

                if (nextElementSibling) {
                    parentElement.insertBefore(video, nextElementSibling);
                } else {
                    parentElement.appendChild(video);
                }
            }

            return this;
        }

        if (advancedPictureInPicture.on && this.originElementPosition && mask) {
            mask.appendChild(video);
            video.classList.add("video-roll-pip");
            document.body.classList.add("video-roll-overflow-hidden");
            if (!video.controls) {
                video.classList.add("video-roll-no-controls");
                video.controls = true;
            }
        }

        return this;
    }

    static updateVr(video: HTMLVideoElement, vr: any) {
        const mask = document.getElementById("video-roll-vr-mask");
        const vrStyle = document.getElementById(
            "video-roll-vr-style"
        ) as HTMLStyleElement;

        if (vrStyle) {
            vrStyle.innerHTML = `#video-roll-vr-mask {
                display: ${vr.on ? "block" : "none"};
                position: fixed;
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;
                z-index: 20000 !important;
                background-color: #000;
            }
            
            .video-roll-focus {
                width: ${this.originElementPosition?.style.width}px;
                height: ${this.originElementPosition?.style.height}px;
                position: absolute;
                left: 0;
                right: 0;
                top: 0;
                bottom: 0;
                margin: auto;
            }`;
        }

        if (!video) return this;

        if (!vr.on && mask) {
            const dom = document.getElementById("video-roll-vr");
            dom?.remove();

            return this;
        }

        if (vr.on && mask) {
            const dom = document.getElementById("video-roll-vr");

            if (dom) {
                return this;
            }

            const canvas = document.createElement("canvas");
            mask.appendChild(canvas);
            canvas.width = video.offsetWidth * devicePixelRatio;
            canvas.height = video.offsetHeight * devicePixelRatio;
            canvas.setAttribute("id", "video-roll-vr");

            // Initialize Three.js scene
            let scene, camera, renderer, sphere, videoTexture;
            let lon = 0,
                lat = 0;
            let phi = 0,
                theta = 0;
            let isUserInteracting = false;
            let onPointerDownPointerX = 0,
                onPointerDownPointerY = 0;
            let onPointerDownLon = 0,
                onPointerDownLat = 0;

            function init() {
                // Create Three.js renderer
                renderer = new THREE.WebGLRenderer({
                    canvas,
                    antialias: true,
                    alpha: true,
                });
                renderer.setSize(window.innerWidth, window.innerHeight);
                renderer.setPixelRatio(window.devicePixelRatio);

                // Create scene and camera
                scene = new THREE.Scene();
                camera = new THREE.PerspectiveCamera(
                    75,
                    window.innerWidth / window.innerHeight,
                    0.1,
                    1000
                );
                camera.target = new THREE.Vector3(0, 0, 0);

                // Create video texture
                videoTexture = new THREE.VideoTexture(video);
                videoTexture.minFilter = THREE.LinearFilter;
                videoTexture.magFilter = THREE.LinearFilter;
                videoTexture.format = THREE.RGBFormat;
                videoTexture.anisotropy =
                    renderer.capabilities.getMaxAnisotropy();

                // Create a sphere geometry and map video as texture
                const geometry = new THREE.SphereGeometry(500, 240, 120);
                geometry.scale(-1, 1, 1); // Invert sphere geometry to view from inside
                const material = new THREE.MeshBasicMaterial({
                    map: videoTexture,
                });
                sphere = new THREE.Mesh(geometry, material);
                scene.add(sphere);

                camera.position.set(0, 0, 0);
                // Add event listeners for mouse and touch controls
                document.addEventListener("mousedown", onPointerDown, false);
                document.addEventListener("mousemove", onPointerMove, false);
                document.addEventListener("mouseup", onPointerUp, false);

                document.addEventListener("touchstart", onPointerDown, false);
                document.addEventListener("touchmove", onPointerMove, false);
                document.addEventListener("touchend", onPointerUp, false);

                // Resize canvas when window resizes
                window.addEventListener("resize", onWindowResize, false);
            }

            function onWindowResize() {
                camera.aspect = window.innerWidth / window.innerHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(window.innerWidth, window.innerHeight);
            }

            function onPointerDown(event) {
                isUserInteracting = true;

                const clientX = event.clientX || event.touches[0].clientX;
                const clientY = event.clientY || event.touches[0].clientY;

                onPointerDownPointerX = clientX;
                onPointerDownPointerY = clientY;

                onPointerDownLon = lon;
                onPointerDownLat = lat;
            }

            function onPointerMove(event) {
                if (isUserInteracting) {
                    const clientX = event.clientX || event.touches[0].clientX;
                    const clientY = event.clientY || event.touches[0].clientY;

                    lon =
                        (onPointerDownPointerX - clientX) * 0.1 +
                        onPointerDownLon;
                    lat =
                        (clientY - onPointerDownPointerY) * 0.1 +
                        onPointerDownLat;
                }
            }

            function onPointerUp() {
                isUserInteracting = false;
            }

            function animate() {
                requestAnimationFrame(animate);

                lat = Math.max(-85, Math.min(85, lat));
                phi = THREE.MathUtils.degToRad(90 - lat);
                theta = THREE.MathUtils.degToRad(lon);

                camera.target.x = 500 * Math.sin(phi) * Math.cos(theta);
                camera.target.y = 500 * Math.cos(phi);
                camera.target.z = 500 * Math.sin(phi) * Math.sin(theta);
                camera.lookAt(camera.target);

                // Render the scene
                renderer.render(scene, camera);
            }

            // Initialize and start animation
            init();
            animate();
        }
    }

    static createAudiohacker() {
        const audioCtx = this.audioCtx as AudioContext;
        if (!audioCtx) return;

        this.videoElements.forEach((video) => {
            const node = audioCtx.createMediaElementSource(
                video as HTMLMediaElement
            );
            this.audioController.push(new Audiohacker(audioCtx, node));
        });
    }

    /**
     * update pitch
     * @returns
     */
    static async updatePitch() {
        const { on, value } = this.rollConfig.pitch;

        try {
            if (!on && this.audioController.length) {
                // set to 0
                this.audioController.forEach((v) => {
                    v.setPitchOffset(value);
                });
                return this;
            }

            if (!on && !this.audioCtx) {
                return this;
            }

            if (!this.audioCtx) {
                this.audioCtx = new AudioContext();
                const { audioCtx } = this;

                if (audioCtx.state !== "running") {
                    await audioCtx.resume();
                }

                this.createAudiohacker();
            }

            if (this.audioController.length && on) {
                this.audioController.forEach((v) => {
                    v.setPitchOffset(value);
                });
            }
        } catch (err) {
            console.debug(err);
        }

        return this;
    }

    /**
     * update volume
     * @returns
     */
    static async updateVolume() {
        const volume = this.rollConfig.volume;

        try {
            if (volume !== 1 && !this.audioCtx) {
                this.audioCtx = new AudioContext();
                const { audioCtx } = this;

                if (audioCtx.state !== "running") {
                    await audioCtx.resume();
                }
                this.createAudiohacker();
                return;
            }

            if (this.audioController.length) {
                this.audioController.forEach((v) => {
                    v.setVolume(volume);
                });
                return;
            }
        } catch (err) {
            console.debug(err);
        }
    }

    static updatePlaybackRate() {
        const playbackRate = this.rollConfig.playbackRate;

        try {
            this.videoElements.forEach((video) => {
                (video as HTMLMediaElement).playbackRate = playbackRate;
            });
        } catch (err) {
            console.debug(err);
        }
    }

    /**
     * HTMLVideoElement.requestPictureInPicture()
     */
    static togglePictureInPicture(pictureInPicture: boolean) {
        if (!pictureInPicture && document.pictureInPictureElement) {
            document.exitPictureInPicture();
            return;
        }

        try {
            if (
                pictureInPicture &&
                document.pictureInPictureEnabled &&
                this.realVideoPlayer.player
            ) {
                this.realVideoPlayer.player.requestPictureInPicture();
            }
        } catch (err) {
            console.debug(err);
        }
    }

    static toggleLoop(video: HTMLVideoElement, loop: boolean) {
        video.loop = loop;
    }

    static buildVideoList() {
        return this.videoList.map((v) => ({
            name: v.name,
            id: v.id,
            visible: v.visible,
            checked: v.checked,
            posterUrl: v.posterUrl,
            duration: v.duration,
            isReal: v.isReal,
            src: v.src,
            percentage: v.percentage ?? 0,
            currentTime: v.currentTime ?? 0,
        }));
    }

    static getVideoVisibleObserver(
        video: HTMLVideoElement,
        item: any,
        callback: Function
    ) {
        const intersectionObserver = new IntersectionObserver((entries) => {
            if (entries[0].intersectionRatio <= 0) {
                video.setAttribute("data-roll-visible", "false");
                item.visible = isVisible(video);

                callback({
                    text: String(this.videoNumbers),
                    videoList: this.buildVideoList(),
                });
                return;
            }

            video.setAttribute("data-roll-visible", "true");
            item.visible = isVisible(video);
            callback({
                text: String(this.videoNumbers),
                videoList: this.buildVideoList(),
            });
        });

        intersectionObserver.observe(video);

        return intersectionObserver;
    }

    static capture(video = this.realVideoPlayer.player): Promise<any> {
        const rect = (video as HTMLVideoElement).getBoundingClientRect();
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        canvas.width = video?.videoWidth ?? rect.width;
        canvas.height = video?.videoHeight ?? rect.height;

        context?.drawImage(
            video as HTMLVideoElement,
            0,
            0,
            canvas.width,
            canvas.height
        );
        const dataUrl = canvas.toDataURL("image/png");
        canvas.remove();
        return Promise.resolve(dataUrl);
    }

    static updateProgress(
        video: HTMLVideoElement,
        callback: Function,
        event?: Event
    ): void {
        // 获取当前播放时间
        const currentTime = video.currentTime;
        // 获取视频的总时长
        const duration = video.duration;
        // 计算进度百分比
        const progress = (currentTime / duration) * 100;
        const item = this.videoList.find((v) => v.id === video.dataset.rollId);

        if (item) {
            item.percentage = progress;
            item.currentTime = currentTime;
        }

        callback({
            text: String(this.videoNumbers),
            videoList: this.buildVideoList(),
        });
    }

    static watchVideoProgress(video: HTMLVideoElement, callback: Function) {
        video.removeEventListener("timeupdate", this.eventCallback as any);
        this.eventCallback = this.updateProgress.bind(this, video, callback);
        video.addEventListener("timeupdate", this.eventCallback as any);
    }

    static getVideoInfo(video: HTMLVideoElement, index: number) {
        let src = this.getSourceElementSrc(video);

        if (src.startsWith("blob:")) {
            src = src.replace("blob:", "");
        }

        const time = Math.ceil((video.duration * 10) / 60) / 10;
        const duration = isNaN(time) ? 0 : time;
        if (this.rollConfig.crossorigin) {
            video.setAttribute("crossorigin", "anonymous");
        }

        let poster = video.poster;
        let name = `video ${index + 1}`;
        const isReal = this.realVideoPlayer.player === video;

        if (src === "no-src") {
            return {
                posterUrl: poster,
                duration,
                name,
                src,
                isReal,
            };
        }

        try {
            const url = new URL(src);
            name = getName(url);
            if (poster) {
                return {
                    posterUrl: poster,
                    duration,
                    name,
                    src,
                    isReal,
                };
            }

            const videoRollPoster = video.getAttribute("data-roll-poster");
            const videoRollPosterIndex =
                video.getAttribute("data-roll-poster-index") ?? 0;
            const index = Number(videoRollPosterIndex);
            if (index < 5) {
                return this.capture(video).then((url: string) => {
                    video.setAttribute("data-roll-poster", url);
                    const currentIndex = index + 1;
                    video.setAttribute(
                        "data-roll-poster-index",
                        String(currentIndex)
                    );
                    return {
                        posterUrl: url,
                        duration,
                        name,
                        src,
                        isReal,
                    };
                });
            }

            return {
                posterUrl: videoRollPoster,
                duration,
                name,
                src,
                isReal,
            };
        } catch (err) {
            console.debug(err);
            return Promise.resolve({
                posterUrl: poster,
                duration,
                src,
                name,
                isReal,
            });
        }
    }

    static getProgress(video: HTMLVideoElement) {
        // 获取当前播放时间
        const currentTime = video.currentTime;
        // 获取视频的总时长
        const duration = video.duration;
        // 计算进度百分比
        const progress = (currentTime / duration) * 100;
        return progress;
    }

    static async useVideoChanged(callback: Function) {
        const videoSelector = this.getVideoSelector(this.getHostName());
        this.updateDocuments().updateVideoElements(videoSelector);
        if (!this.recorder) this.recorder = new Recorder();
        if (!this.looper) this.looper = new Looper();

        const videos = [...this.videoElements];
        const infos = await Promise.all(
            videos.map((v, index) => this.getVideoInfo(v, index))
        );

        this.videoList = videos.map((v, index) => {
            const item: any = {
                id: v.dataset.rollId,
                visible: v.dataset.rollVisible === "true" ? true : false,
                checked: v.dataset.rollCheck === "true" ? true : false,
                currentTime: v.currentTime,
                percentage: this.getProgress(v),
                ...infos[index],
            };

            setTimeout(() => {
                this.watchVideoProgress(v, callback);
            });

            // item.visibleObserver = this.getVideoVisibleObserver(v, item, callback)

            return item;
        });

        callback({
            text: String(this.videoNumbers),
            videoList: this.buildVideoList(),
        });
    }

    static isVideoChange(mutationItem: any) {
        if (mutationItem.target.nodeName === "VIDEO") return true;

        if (
            Array.from(mutationItem.addedNodes).some(
                (v: any) => v.nodeName === "VIDEO"
            ) ||
            Array.from(mutationItem.removedNodes).some(
                (v: any) => v.nodeName === "VIDEO"
            )
        )
            return true;

        return false;
    }

    /**
     * update video number
     * @param callback
     */
    static observeVideo(callback: Function) {
        if (this.rollConfig?.enable === false) return this;

        this.useVideoChanged(callback);

        try {
            const elementToObserve = document.querySelector("body") as Node;
            if (!elementToObserve) return this;

            if (!this.observer) {
                this.observer = new MutationObserver(
                    debounce((mutationList: any) => {
                        for (const item of mutationList) {
                            if (this.isVideoChange(item)) {
                                this.useVideoChanged(callback);
                            }
                        }
                    }, 300)
                );

                this.observer.observe(elementToObserve, {
                    childList: true,
                    subtree: true,
                    attributeFilter: [
                        "src",
                        "autoplay",
                        "mediatype",
                        "data-xgplayerid",
                        "playsinline",
                        "crossorigin",
                    ],
                    attributes: true,
                });
            }
        } catch (err) {
            console.debug(err);
        }

        return this;
    }

    static updateVideoCheck(ids: any[]) {
        const elements = Array.from(this.videoElements);
        this.videoList.forEach((v) => {
            const video = elements.find((x) => x.dataset.rollId === v.id);
            if (video) {
                video.dataset.rollCheck = ids.includes(video.dataset.rollId)
                    ? "true"
                    : "false";
            }
        });

        this.videoList = this.videoList.map((v: any, index) => {
            v.checked = ids.includes(v.id);
            return v;
        });

        this.updateVideo(this.rollConfig);
        return this;
    }

    static removeStyle(target: HTMLElement) {
        target.classList.remove("video-roll-highlight");
        target.classList.remove("video-roll-deg-scale");
        target.classList.remove("video-roll-focus");

        document.getElementById("video-roll-deg-scale")?.remove();
        document.getElementById("video-roll-focus-style")?.remove();
    }

    static stop() {
        this.videoElements.forEach((v) => {
            this.removeStyle(v);
        });
        this.resetAudio();

        if (this.rollConfig.focus.on) {
            this.updateFocus(
                this.realVideoPlayer.player as HTMLVideoElement,
                { on: false } as Focus
            );
            const mask = document.getElementById(
                "video-roll-root-mask"
            ) as HTMLElement;
            mask?.remove();
        }

        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }

        if (this.rollConfig.pictureInPicture) {
            this.togglePictureInPicture(false);
        }

        this.clearRealVideoPlayer();
        this.clearOriginElementPosition();
        this.clearVideoElements();
        this.documents = [];
        this.videoNumbers = 0;
        this.videoList = [];
    }

    static restart() {}

    static startRecord() {
        if (!this.recorder) {
            this.recorder = new Recorder();
        }

        this.recorder.startRecord(
            this.realVideoPlayer.player as HTMLVideoElement
        );
    }

    static stopRecord() {
        if (this.recorder) {
            this.recorder.stopRecord();
        }
    }

    static updateLoop(abLoop: Abloop) {
        if (abLoop.on === true) {
            this.startLoop(abLoop);
        } else {
            this.stopLoop();
        }
    }

    static startLoop(abLoop: Abloop) {
        if (!this.looper) {
            this.looper = new Looper();
        }

        this.looper.startLoop(
            this.realVideoPlayer.player as HTMLVideoElement,
            abLoop
        );
    }

    static stopLoop() {
        if (this.looper) {
            this.looper.stopLoop(
                this.realVideoPlayer.player as HTMLVideoElement
            );
        }
    }
}
