/*
 * @description: videoList Component
 * @Author: Gouxinyu
 * @Date: 2022-09-19 22:53:23
 */

import { defineComponent, inject, ref, markRaw, watch } from "vue";
import browser from "webextension-polyfill";
import "./index.less";
import { IRollConfig } from "src/types/type";
import { Download, PlayerPlay, Qrcode, Link, Maximize } from "@vicons/tabler";
import { IconPinInvoke } from "@tabler/icons-vue";
import Hls from "hls.js";
import Plyr from "plyr";
import "plyr/dist/plyr.css";
import QRCode from "easyqrcodejs";
import { createURL } from "src/util";

export default defineComponent({
  name: "VideoList",
  setup() {
    const rollConfig = inject("rollConfig") as IRollConfig;
    const onHoverVideo = inject("onHoverVideo") as Function;
    const videoList = inject("videoList") as any;
    const downloadSingleVideo = inject("downloadSingleVideo") as Function;
    const favIcon = inject("favIcon");

    const playingUrl = ref("");
    const qrUrl = ref("");
    const player = ref(null);

    const showVideo = (data: any) => {
      playingUrl.value = data.id;
      setTimeout(() => {
        const video = document.querySelector(
          "#video-player"
        ) as HTMLVideoElement;

        if (!video) return;
        // For more options see: https://github.com/sampotts/plyr/#options
        // captions.update is required for captions to work with hls.js
        player.value = new Plyr(video, {
          controls: ["play", "progress", "current-time", "mute"],
          playsinline: true,
        });

        if (data.type === "HLS") {
          if (!Hls.isSupported()) {
            video.src = data.url;
          } else {
            // For more Hls.js options, see https://github.com/dailymotion/hls.js
            const hls = new Hls();
            hls.loadSource(data.url);
            hls.attachMedia(video);
          }
        } else {
          video.src = data.url;
        }
      }, 100);
    };

    const onPlay = (data: any) => {
      if (
        data.id === playingUrl.value &&
        qrUrl.value === "" &&
        player.value?.destroy
      ) {
        player.value.destroy(() => {
          playingUrl.value = "";
          document.querySelector("#video-player")?.remove();
          player.value = null;
        });
        return;
      }
      qrUrl.value = "";
      if (player.value?.destroy) {
        player.value.destroy(() => {
          document.querySelector("#video-player")?.remove();
          player.value = null;
          showVideo(data);
        });
      } else {
        showVideo(data);
      }
    };

    const generateQR = (data: any) => {
      if (data.id === qrUrl.value && playingUrl.value === "" && !player.value) {
        qrUrl.value = "";
        return;
      }
      qrUrl.value = data.id;
      playingUrl.value = "";
      document.querySelector("#video-player")?.remove();
      setTimeout(() => {
        const dom = document.getElementById("video-qr-code");
        (dom as HTMLElement).innerHTML = "";
        const qrcode = new QRCode(document.getElementById("video-qr-code"), {
          text: data.url,
          width: 180,
          height: 180,
          correctLevel: QRCode.CorrectLevel.M, // L, M, Q, H
        });
      }, 100);
    };

    const showQR = (data: any) => {
      if (player.value?.destroy) {
        player.value.destroy(() => {
          generateQR(data);
          player.value = null;
        });
      } else {
        generateQR(data);
      }
    };

    const openPlayer = (data: any) => {
      createURL(chrome.runtime.getURL(`player/player.html?url=${data.url}&type=${data.type}`));
    };

    return () => (
      <div>
        <van-notice-bar
          left-icon={favIcon.value || "tv-o"}
          color="#1989fa"
          background="transparent"
          text={rollConfig.document?.title}
        />
        {videoList.value?.length ? (
          videoList.value.map((v: any) => (
            <div
              class="video-item"
              onMouseleave={() => onHoverVideo(v.id, false)}
              onMouseenter={() => onHoverVideo(v.id, true)}
            >
              <div class="video-info">
                <div class="video-info-box">
                  <div class="video-info-name">
                    {v.title || rollConfig.document?.title || v.url}
                  </div>
                </div>

                <div class="video-tags">
                  <div>
                    <van-tag type="primary">{v.type}</van-tag>
                    {/* <span class="video-type">{v.type}</span> */}

                    {v.size ? (
                      <van-tag plain color="#1989fa">
                        {v.size}
                      </van-tag>
                    ) : null}
                    {typeof v.duration === "string" ? (
                      <van-tag plain type="success">
                        {v.duration}
                      </van-tag>
                    ) : null}
                    {v.width && v.height ? (
                      <van-tag plain type="success">
                        {`${v.width}x${v.height}`}
                      </van-tag>
                    ) : null}
                    {v.mediaType ? (
                      <van-tag plain type="warning">
                        {v.mediaType}
                      </van-tag>
                    ) : null}
                    {/* {v.kbps ? (
                                            <van-tag plain type="success">
                                                {`${v.kbps}kbps`}
                                            </van-tag>
                                        ) : null} */}
                  </div>
                </div>
                <div class="video-action">
                  <span
                    class="list-icon"
                    onClick={() => downloadSingleVideo(v)}
                  >
                    <Download />
                  </span>
                  <span class="list-icon" onClick={() => openPlayer(v)}>
                    <Maximize />
                  </span>

                  <span class="list-icon" onClick={() => onPlay(v)}>
                    <PlayerPlay />
                  </span>
                  <span class="list-icon" onClick={() => showQR(v)}>
                    <Qrcode />
                  </span>
                  <span class="list-icon" onClick={() => showQR(v)}>
                    <Link />
                  </span>
                </div>
              </div>
              <div class="extra-info">
                {playingUrl.value === v.id ? (
                  <video
                    id="video-player"
                    playsinline
                    controls
                    autoplay
                  ></video>
                ) : null}
                {qrUrl.value === v.id ? <div id="video-qr-code"></div> : null}
              </div>
            </div>
          ))
        ) : (
          <div>
            <van-empty
              image="error"
              description={browser.i18n.getMessage("tips_empty")}
            />
          </div>
        )}
      </div>
    );
  },
});
