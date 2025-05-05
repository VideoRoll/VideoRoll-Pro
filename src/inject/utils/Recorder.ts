import { saveAs } from "file-saver";
import { sendRuntimeMessage } from "src/util";

export default class Record {
    mediaRecorder: any = null;
    _recordedChunks = [];
    _startRecordTime = 0;
    constructor() {
        // this.addElement(video);
    }

    get status() {
        return this.mediaRecorder?.state ?? undefined;
    }

    get time() {
        return this._startRecordTime;
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

    startRecord(video: HTMLVideoElement, callback: Function) {
        if (!video) {
            callback({
                recordInfo: "未识别到视频",
                recordTime: this._startRecordTime,
            });
        }

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
            // if user chooses only video
            // drawVideoOnCanvas();

            try {
                //截取到媒体流
                const stream = video?.captureStream?.(60); // 25 FPS

                this.mediaRecorder = new MediaRecorder(stream, {
                    mimeType: "video/mp4",
                });

                this._startRecordTime = video.currentTime;

                // 当有数据可用时，处理数据
                this.mediaRecorder.ondataavailable = (event: any) => {
                    if (event.data.size > 0) {
                        this._recordedChunks.push(event.data);
                    }
                };

                this.mediaRecorder.onerror = (event: any) => {
                    this._recordedChunks = [];
                    this._startRecordTime = 0;
                    callback({
                        recordInfo: event,
                        recordTime: this._startRecordTime,
                    });
                };

                this.download(callback);

                this.mediaRecorder.start();

                callback({
                    recordInfo: undefined,
                    recordTime: this._startRecordTime,
                    recordStatus: this.status,
                });
            } catch (error) {
                this._recordedChunks = [];
                this._startRecordTime = 0;
                callback({
                    recordInfo: error,
                    recordTime: this._startRecordTime,
                });
            }

            return;
        }

        callback({
            recordInfo: "当前视频状态无法录制",
            recordTime: this._startRecordTime,
        });
    }

    stopRecord(video) {
        this.mediaRecorder.stop();
    }

    download(callback: Function) {
        // 当录制停止时，生成视频文件
        this.mediaRecorder.onstop = () => {
            const blob = new Blob(this._recordedChunks, { type: "video/mp4" });

            // 使用 file-saver 保存 Blob 文件
            saveAs(
                blob,
                `${document.title ? document.title : "recorded-video"}.mp4`
            );
            this._recordedChunks = [];
            this._startRecordTime = 0;

            callback({
                recordInfo: "视频录制完成",
                recordTime: this._startRecordTime,
            });
        };
    }
}
