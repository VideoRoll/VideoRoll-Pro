import { defineComponent, inject } from "vue";
import { GlassesOutline } from "@vicons/ionicons5";
import type { IRollConfig } from "../../../../types/type.d";
import browser from "webextension-polyfill";
import { vPermission } from 'src/lib/directive'
import "./index.less";

export default defineComponent({
  name: "Vr",
  directives: {
    permission: vPermission
  },
  setup() {
    const update = inject("update") as Function;
    const rollConfig = inject("rollConfig") as IRollConfig;
    const user = inject("user");

    const setVr = () => {
      rollConfig.vr.on = !rollConfig.vr.on;
      update("vr", rollConfig.vr);
    };
    return () => (
      <div
        v-tooltip={browser.i18n.getMessage("video_focus")}
        class={`video-roll-focus video-roll-item ${
          rollConfig.vr.on ? "video-roll-on" : "video-roll-off"
        }`}
        v-permission={['pro']}
        onClick={setVr}
      >
        <div class="video-roll-icon-box">
          <span class="video-roll-label">
            {<GlassesOutline class="video-roll-icon"></GlassesOutline>}
          </span>
        </div>
      </div>
    );
  },
});
