/*
 * @description: download Component
 * @Author: Gouxinyu
 * @Date: 2022-09-19 22:53:23
 */
import { defineComponent, inject, onMounted, ref, watch } from "vue";
import { RadioButtonOnOutline } from "@vicons/ionicons5";
import browser from "webextension-polyfill";
import { ActionType, IRollConfig } from "src/types/type.d";
import { clone, sendTabMessage } from "src/util";

export default defineComponent({
  name: "Summarizer",
  setup() {
    const rollConfig = inject("rollConfig") as IRollConfig;
    const openSidePanel = () => {
      chrome.sidePanel.open({ tabId: rollConfig.tabId });
      window.close();
    };
    return () => (
      <div
        v-tooltip={"AI Summarizer"}
        class={`video-roll-focus video-roll-item video-roll-off`}
        onClick={openSidePanel}
      >
        <div class="video-roll-icon-box">
          <span class="video-roll-label video-roll-flex">
            <RadioButtonOnOutline class="video-roll-icon"></RadioButtonOnOutline>
          </span>
        </div>
      </div>
    );
  },
});
