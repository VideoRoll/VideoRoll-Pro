/*
 * @description: grid Component
 * @Author: Gouxinyu
 * @Date: 2022-09-19 22:53:23
 */

import { defineComponent, ref, provide, h, VueElement } from "vue";
import useComponents from "../../utils/useComponents";
import render from "../../utils/render";
import "./index.less";

export default defineComponent({
  name: "GridPanel",
  setup() {
    const components = useComponents();
    const popupShow = ref<boolean>(false);
    const renderContent = ref();

    const setPopupShow = (value: boolean) => {
      popupShow.value = value;
    };

    const updateRenderContent = (content: VueElement) => {
      renderContent.value = content;
    };

    const onClose = (callback: Function) => {
      if (typeof callback === "function") {
        callback();
      }
    };

    provide("setPopupShow", setPopupShow);
    provide("updateRenderContent", updateRenderContent);
    provide("onPopupClose", onClose);

    return () => (
      <div class="video-roll-setting-panel">
        <van-tabs sticky animated offset-top="40">
          {render(components)}
        </van-tabs>
        <van-popup
          v-model:show={popupShow.value}
          onClose={onClose}
          round
          closeable
          lazy-render
          style={{
            width: "250px",
            height: "250px",
            padding: "20px",
            overflow: "hidden",
          }}
        >
          {h(renderContent.value)}
        </van-popup>
      </div>
    );
  },
});
