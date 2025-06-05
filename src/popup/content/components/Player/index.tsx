/*
 * @description: download Component
 * @Author: Gouxinyu
 * @Date: 2022-09-19 22:53:23
 */
import { defineComponent, inject, ref, shallowReactive } from "vue";
import { TimerOutline } from "@vicons/ionicons5";
import "./index.less";
import browser from "webextension-polyfill";
import { createURL } from "src/util";

export default defineComponent({
  name: "Player",
  setup() {
    const openPlayer = () => {
      createURL(browser.runtime.getURL("player/player.html"));
    };

    return () => (
      <div
        v-tooltip={browser.i18n.getMessage("tab_player")}
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
