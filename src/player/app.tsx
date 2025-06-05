import {
  defineComponent,
  ref,
  onMounted,
  provide,
  Transition,
  h,
  reactive,
  computed,
  watch,
} from "vue";

import Hls from "hls.js";
import Plyr from "plyr";
import "plyr/dist/plyr.css";
import "./index.less";
import debounce from "lodash-es/debounce";
import { showLoadingToast, closeToast } from "vant/es/toast/index.mjs";
import browser from "webextension-polyfill";

export default defineComponent({
  name: "App",
  setup() {
    const player = ref();
    const videoRef = ref();
    const checked = ref("1");
    const url = ref("");
    const fileUrl = ref("");
    const fileName = ref("");
    const hls = ref();

    onMounted(async () => {
      setTimeout(() => {
        const video = videoRef.value;

        if (!video) return;
        // For more options see: https://github.com/sampotts/plyr/#options
        // captions.update is required for captions to work with hls.js
        player.value = new Plyr(video, {
          controls: [
            "play-large",
            "play",
            "progress",
            "current-time",
            "mute",
            "volume",
            "captions",
            "settings",
            "pip",
            "airplay",
            "fullscreen",
          ],
          clickToPlay: true,
          settings: ["captions", "quality", "speed"],
          playsinline: true,
        });

        const params = new URLSearchParams(window.location.search);
        const urlParam = params.get("url");
        if (urlParam) {
          url.value = urlParam;
          checked.value = "2";
        }
      }, 100);
    });

    const afterRead = (file: File) => {
      if (file) {
        showLoadingToast({
          duration: 1000,
          forbidClick: true,
          message: "loading...",
        });
        fileName.value = file.file.name;
        const fileURL = URL.createObjectURL(file.file);
        fileUrl.value = fileURL;
        videoRef.value.src = fileURL;
      }
    };

    const onUpdate = (value: string) => {
      if (value) {
        showLoadingToast({
          duration: 1000,
          forbidClick: true,
          message: "loading...",
        });

        if (!Hls.isSupported()) {
          videoRef.value.src = value;
        } else {
          // For more Hls.js options, see https://github.com/dailymotion/hls.js

          hls.value = new Hls();
          hls.value.loadSource(value);
          hls.value.attachMedia(videoRef.value);
        }
      }
    };

    watch(
      () => checked.value,
      () => {
        if (checked.value === "1" && fileUrl.value) {
          hls.value?.destroy?.();
          videoRef.value.src = fileUrl.value;
          return;
        }

        if (url.value) {
          onUpdate(url.value);
        }
      }
    );

    return () => (
      <van-config-provider theme="dark">
        <main class="flex flex-row">
          <div class="player-box flex-1 p-10 ">
            <video
              ref={videoRef}
              id="video-roll-player"
              playsinline
              controls
            ></video>
          </div>
          <div class="w-1/4 p-10">
            <van-radio-group
              v-model={checked.value}
              shape="dot"
              direction="horizontal"
              class="mb-4"
            >
              <van-radio name="1">{browser.i18n.getMessage("player_local_file")}</van-radio>
              <van-radio name="2">{browser.i18n.getMessage("player_stream_url")}</van-radio>
            </van-radio-group>
            <div class="w-full">
              {checked.value === "2" ? (
                <van-field
                  class="w-full"
                  v-model={url.value}
                  placeholder={browser.i18n.getMessage("player_enter_stream_url")}
                  clearable
                  onUpdate:modelValue={debounce(onUpdate, 400)}
                  v-slots={{
                    label: () => (
                      // <van-popover
                      //   v-model:show="showPopover"
                      //   v-slots={{
                      //     reference: () => (
                      //       <van-button type="primary">浅色风格</van-button>
                      //     ),
                      //   }}
                      // ></van-popover>
                      <></>
                    ),
                  }}
                />
              ) : (
                <van-uploader
                  class="w-full upload-box"
                  after-read={afterRead}
                  max-count={1}
                  accept="video/*"
                  reupload
                >
                  <div class="w-full h-200px flex flex-col justify-center items-center border-dashed border-2 border-[#a494c6] text-white rounded-4">
                    {fileName.value && (
                      <span class="mb-4">{fileName.value}</span>
                    )}
                    <span>{browser.i18n.getMessage("player_upload_or_drag")}</span>
                  </div>
                </van-uploader>
              )}
            </div>
          </div>
        </main>
      </van-config-provider>
    );
  },
});
