import {
  defineComponent,
  ref,
  onMounted,
  provide,
  Transition,
  h,
  reactive,
  computed,
} from "vue";

import Hls from "hls.js";
import Plyr from "plyr";
import "plyr/dist/plyr.css";
import "./index.less";

export default defineComponent({
  name: "App",
  setup() {
    const player = ref();
    const videoRef = ref();
    const checked = ref("1");
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

        // if (data.type === "HLS") {
        //   if (!Hls.isSupported()) {
        //     video.src = data.url;
        //   } else {
        //     // For more Hls.js options, see https://github.com/dailymotion/hls.js
        //     const hls = new Hls();
        //     hls.loadSource(data.url);
        //     hls.attachMedia(video);
        //   }
        // } else {
        //   video.src = data.url;
        // }
      }, 100);
    });

    const afterRead = (file: File) => {
      if (file) {
        const fileURL = URL.createObjectURL(file.file);
        videoRef.value.src = fileURL;
        player.value.play();
      }
    };

    return () => (
      <van-config-provider theme="dark">
        {/* <Header></Header> */}
        <main>
          <div class="player-box">
            <video
              ref={videoRef}
              id="video-roll-player"
              playsinline
              controls
            ></video>
          </div>
          <div class="flex flex-row">
            <van-uploader
              after-read={afterRead}
              max-count={1}
              accept="video/*"
              reupload
            >
              <div class="upload-box">+点击上传或拖拽</div>
            </van-uploader>
            <van-radio-group
              v-model={checked.value}
              shape="dot"
              direction="horizontal"
            >
              <van-radio name="1">Local File</van-radio>
              <van-radio name="2">Stream URL</van-radio>
            </van-radio-group>
          </div>
        </main>
      </van-config-provider>
    );
  },
});
