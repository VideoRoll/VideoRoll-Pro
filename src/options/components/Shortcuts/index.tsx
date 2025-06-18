import {
  defineComponent,
  ref,
  onMounted,
  provide,
  PropType,
  onUnmounted,
} from "vue";
import browser from "webextension-polyfill";
import hotkeys from "hotkeys-js";
import { X } from "@vicons/tabler";
import "./index.less";
import { getkeyCodeMap } from "src/util/getKeycodeMap";
import { useShortcuts } from "src/use/useShortcuts";

export default defineComponent({
  name: "Shortcuts",
  setup(props) {
    const currentId = ref("");
    const shortcuts = ref("");
    const isShowSettingInput = ref(false);
    const shortcutsMap = useShortcuts() as any;

    const updateShowSettingInput = (val: boolean) => {
      isShowSettingInput.value = val;
    };    const updateCurrentId = (val: string) => {
      currentId.value = val;
      shortcuts.value = shortcutsMap.value[val].shortcuts.key;
      updateShowSettingInput(true);
    };

    // 清除快捷键的功能
    const clearShortcut = async (key: string) => {
      // 重置为空
      shortcutsMap.value[key].shortcuts = {
        key: "",
        code: [],
      };
      
      // 保存到存储
      await browser.storage.sync.set({
        shortcuts: JSON.parse(JSON.stringify(shortcutsMap.value)),
      });
    };

    const loadList = async () => {
      browser.storage.sync.get("shortcuts").then((res) => {
        const map = res?.["shortcuts"] ?? {};
        Object.keys(shortcutsMap.value).forEach((key: string) => {
          if (map[key]) {
            shortcutsMap.value[key].shortcuts = map[key].shortcuts;
          }
        });
      });
    };

    onMounted(async () => {
      loadList();
      hotkeys("*", function (event, handler) {
        event.preventDefault();

        if (!isShowSettingInput.value) return;

        const keys = handler.keys.map((key) => getkeyCodeMap()[key]).join("+");
        shortcuts.value = keys;

        shortcutsMap.value[currentId.value].shortcuts = {
          key: keys,
          code: handler.keys,
        };
        browser.storage.sync.set({
          shortcuts: JSON.parse(JSON.stringify(shortcutsMap.value)),
        });
      });
    });

    onUnmounted(() => {
      hotkeys.unbind("*");
    });

    return () => (
      <div class="options-general">
        <van-overlay
          show={isShowSettingInput.value}
          onClick={() => updateShowSettingInput(false)}
        >
          <div class="shortcuts-main">
            <div class="tips">Press the keyboard to reset</div>
            <div class="shortcuts-input" onClick={(e) => e.stopPropagation()}>
              {shortcuts.value}
            </div>
          </div>
        </van-overlay>        <van-form submit="onSubmit">
          <van-cell-group inset>
            {Object.keys(shortcutsMap.value).map((key: string) => {
              const hasValue = shortcutsMap.value[key].shortcuts.key && shortcutsMap.value[key].shortcuts.key.trim() !== '';
              return (
                <div class={`shortcut-item ${hasValue ? 'has-value' : ''}`} key={key}>
                  <van-field
                    class="shortcuts-input-body"
                    v-model={shortcutsMap.value[key].shortcuts.key}
                    label={`${shortcutsMap.value[key].title} : `}
                    readonly
                    placeholder="Click to update"
                    label-align="right"
                    onClick={() => updateCurrentId(key)}
                  />
                  <button
                    class="clear-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      clearShortcut(key);
                    }}
                    title={browser.i18n.getMessage('clear_shortcut') || '清除快捷键'}
                  >
                    <X class="clear-icon" />
                  </button>
                </div>
              );
            })}
          </van-cell-group>
        </van-form>
      </div>
    );
  },
});
