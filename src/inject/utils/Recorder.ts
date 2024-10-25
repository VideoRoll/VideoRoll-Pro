import { saveAs } from "file-saver";

export default class Record {
    mediaRecorder: any = null;
    _recordedChunks = [];
    constructor() {
        // this.addElement(video);
    }

    get status() {
        return this.mediaRecorder?.state;
    }

    addElement(video: HTMLVideoElement) {
        if (!document.body) return;

        if (!document.getElementById("video-roll-record-panel")) {
            const mask = document.createElement("div");
            mask.setAttribute("id", "video-roll-pip-mask");
            mask.innerHTML = `<div id="video-roll-record-panel" style="display: none; position: absolute; left: 0; right: 0;
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

    startRecord(video: HTMLVideoElement) {
        const dom = document.querySelector(".video-roll-record-canvas");

        if (dom) {
            dom.remove();
        }

        const canvas = document.createElement("canvas");
        canvas.setAttribute("id", "video-roll-record-canvas");
        const rect = (video as HTMLVideoElement).getBoundingClientRect();
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");

        // 动态更新canvas，绘制video内容
        function drawVideoOnCanvas() {
            ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
            requestAnimationFrame(drawVideoOnCanvas);
        }

        if (!video.paused && video.readyState === 4) {
            // drawVideoOnCanvas();

            //截取到媒体流
            const stream = video?.captureStream(); // 25 FPS
            console.log(stream, 'stream');
            this.mediaRecorder = new MediaRecorder(stream);
            // 当有数据可用时，处理数据
            this.mediaRecorder.ondataavailable = (event: any) => {
                this._recordedChunks.push(event.data);
            };

            this.download();

            this.mediaRecorder.start();

            console.log("start recording", this.mediaRecorder);
        }
    }

    stopRecord() {
        this.mediaRecorder.stop();
        console.log("stop recording", this.mediaRecorder);
    }

    download() {
        // 当录制停止时，生成视频文件
        this.mediaRecorder.onstop = () => {
            const blob = new Blob(this._recordedChunks, { type: "video/webm" });

            // 使用 file-saver 保存 Blob 文件
            saveAs(blob, "recorded-video.webm");
            console.log("download recording", this.mediaRecorder);
            this._recordedChunks = [];
        };
    }
}
