/*
 * @description: download Component
 * @Author: Gouxinyu
 * @Date: 2022-09-19 22:53:23
 */
import { defineComponent, inject, ref, shallowReactive } from "vue";
import { TimerOutline } from "@vicons/ionicons5";
import "./index.less";
import browser from "webextension-polyfill";
import { IRollConfig } from "src/types/type";

export default defineComponent({
  name: "Player",
  setup() {
    const openPlayer = () => {
      const newUrl = browser.runtime.getURL("player/player.html");
      browser.tabs.create({ url: newUrl });
    };

    return () => (
      <div
        v-tooltip={browser.i18n.getMessage("video_loop")}
        class={`video-roll-focus video-roll-item video-roll-off`}
        onClick={openPlayer}
      >
        <div class="video-roll-icon-box">
          <span class="video-roll-label">
            <TimerOutline class="video-roll-icon"></TimerOutline>
          </span>
        </div>
      </div>
    );
  },
});
