import { defineComponent, h } from "vue";

import "./index.less";

export default defineComponent({
  name: "Panel",
  setup(props: Record<string, any>, { slots }: { slots: any }) {
    return () => <div class="options-panel">{slots.content?.()}</div>;
  },
});
