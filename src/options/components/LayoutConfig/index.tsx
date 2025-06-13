import { defineComponent, ref, onMounted, nextTick } from "vue";
import { useLayoutConfig } from "../../utils/useLayoutConfig";
import {
  Settings,
  Plus,
  Trash,
  Eye,
  EyeOff,
  GripVertical,
  Refresh,
  FileCheck,
  Download,
} from "@vicons/tabler";
import browser from "webextension-polyfill";
import "./index.less";

export default defineComponent({
  name: "LayoutConfig",
  setup() {
    const {
      layoutConfig,
      isConfigMode,
      hasUnsavedChanges,
      loadConfig,
      saveConfig,
      resetToDefault,
      toggleComponentVisibility,
      moveComponent,
      setRowMaxColumns,
      setComponentColSpan,
      addRow,
      removeRow,
      toggleTabVisibility,
      checkForChanges,
    } = useLayoutConfig();

    const activeTab = ref("video");
    const draggedComponent = ref<{
      componentId: string;
      fromTabId: string;
      fromRowId: string;
    } | null>(null);
    const saveMessage = ref("");
    const showSaveMessage = ref(false);    onMounted(async () => {
      console.log('LayoutConfig component mounted, loading configuration...');
      await loadConfig();
      console.log('LayoutConfig component configuration loaded');

      // 添加键盘快捷键支持 (Ctrl+S 保存)
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.ctrlKey && e.key === "s") {
          e.preventDefault();
          if (hasUnsavedChanges.value) {
            handleSave();
          }
        }
      };

      // 页面离开前确认
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        if (hasUnsavedChanges.value) {
          e.preventDefault();
          e.returnValue =
            browser.i18n.getMessage("layout_unsaved_warning") ||
            "您有未保存的更改，确定要离开吗？";
          return e.returnValue;
        }
      };

      document.addEventListener("keydown", handleKeyDown);
      window.addEventListener("beforeunload", handleBeforeUnload);

      // 清理事件监听器
      return () => {
        document.removeEventListener("keydown", handleKeyDown);
        window.removeEventListener("beforeunload", handleBeforeUnload);
      };
    });

    const handleSave = async () => {
      const success = await saveConfig();
      if (success) {
        saveMessage.value =
          browser.i18n.getMessage("layout_config_saved") || "配置已保存";
        showSaveMessage.value = true;
        setTimeout(() => {
          showSaveMessage.value = false;
        }, 2000);
      }
    };

    const handleReset = async () => {
      if (
        confirm(
          browser.i18n.getMessage("layout_config_reset_confirm") ||
            "确定要重置为默认布局吗？"
        )
      ) {
        resetToDefault();
        await saveConfig();
        saveMessage.value =
          browser.i18n.getMessage("layout_config_reset") || "已重置为默认布局";
        showSaveMessage.value = true;
        setTimeout(() => {
          showSaveMessage.value = false;
        }, 2000);
      }
    };

    const handleDragStart = (
      componentId: string,
      tabId: string,
      rowId: string,
      event: DragEvent
    ) => {
      draggedComponent.value = {
        componentId,
        fromTabId: tabId,
        fromRowId: rowId,
      };
      if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = "move";
      }
    };

    const handleDragOver = (event: DragEvent) => {
      event.preventDefault();
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = "move";
      }
    };

    const handleDrop = (
      toTabId: string,
      toRowId: string,
      index: number,
      event: DragEvent
    ) => {
      event.preventDefault();
      if (!draggedComponent.value) return;

      const { componentId, fromTabId, fromRowId } = draggedComponent.value;
      moveComponent(fromTabId, fromRowId, toTabId, toRowId, componentId, index);
      draggedComponent.value = null;
    };

    const getColSpanLabel = (colSpan: number) => {
      switch (colSpan) {
        case 6:
          return "1/4";
        case 8:
          return "1/3";
        case 12:
          return "1/2";
        case 24:
          return browser.i18n.getMessage("layout_full_width") || "全宽";
        default:
          return colSpan.toString();
      }
    };

    const exportConfig = () => {
      const dataStr = JSON.stringify(layoutConfig, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "video-roll-layout-config.json";
      link.click();
      URL.revokeObjectURL(url);
    };

    const importConfig = (event: Event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedConfig = JSON.parse(e.target?.result as string);
          Object.assign(layoutConfig, importedConfig);
          handleSave();
        } catch (error) {
          alert(
            browser.i18n.getMessage("layout_config_import_error") ||
              "导入配置文件失败"
          );
        }
      };
      reader.readAsText(file);
    };

    return () => (
      <div class="layout-config">
        {/* 配置头部 */}
        <div class="config-header">
          {" "}
          <div>
            <h2 style="margin: 0; font-size: 18px; color: var(--van-gray-8); display: flex; align-items: center; gap: 8px;">
              {browser.i18n.getMessage("layout_config_title") || "界面布局配置"}
              {hasUnsavedChanges.value && (
                <span
                  style={{
                    background: "#ff6b35",
                    color: "white",
                    padding: "2px 6px",
                    borderRadius: "10px",
                    fontSize: "10px",
                    fontWeight: "normal",
                  }}
                >
                  {browser.i18n.getMessage("layout_unsaved_changes") ||
                    "未保存"}
                </span>
              )}
            </h2>
            <p style="margin: 4px 0 0 0; font-size: 12px; color: var(--van-gray-6);">
              {browser.i18n.getMessage("layout_config_desc") ||
                "自定义弹窗界面的组件布局和显示"}
              {hasUnsavedChanges.value && (
                <span style="color: #ff6b35; marginLeft: 8px;">
                  {browser.i18n.getMessage("layout_save_reminder") ||
                    "· 请记得保存更改"}
                </span>
              )}
            </p>
          </div>
          <div class="config-actions">
            <button onClick={exportConfig}>
              <Download class="icon" style="width: 12px; height: 12px;" />
              {browser.i18n.getMessage("layout_export") || "导出"}
            </button>
            <label style="display: flex; align-items: center; cursor: pointer;">
              <input
                type="file"
                accept=".json"
                onChange={importConfig}
                style="display: none;"
              />
              <span style="padding: 6px 12px; border: 1px solid var(--van-gray-4); background: white; border-radius: 4px; font-size: 12px;">
                {browser.i18n.getMessage("layout_import") || "导入"}
              </span>
            </label>
            <button onClick={handleReset}>
              <Refresh class="icon" style="width: 12px; height: 12px;" />
              {browser.i18n.getMessage("layout_reset") || "重置"}
            </button>{" "}
            <button
              onClick={handleSave}
              style={{
                background: hasUnsavedChanges.value
                  ? "#ff6b35"
                  : "var(--van-primary-color)",
                color: "white",
                border: "none",
                position: "relative",
              }}
            >
              <FileCheck class="icon" style="width: 12px; height: 12px;" />
              {browser.i18n.getMessage("layout_save") || "保存"}
              {hasUnsavedChanges.value && (
                <span
                  style={{
                    position: "absolute",
                    top: "-2px",
                    right: "-2px",
                    width: "8px",
                    height: "8px",
                    background: "#ff4757",
                    borderRadius: "50%",
                    fontSize: "10px",
                  }}
                />
              )}
            </button>
            {showSaveMessage.value && (
              <span
                class={`success-message ${showSaveMessage.value ? "show" : ""}`}
              >
                {saveMessage.value}
              </span>
            )}
          </div>
        </div>

        {/* 标签页配置 */}
        <div class="tab-config">
          <div class="tab-config-header">
            <h3>
              {browser.i18n.getMessage("layout_tabs_config") || "标签页配置"}
            </h3>
          </div>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;">
            {layoutConfig.tabs.map((tab) => (
              <div
                key={tab.id}
                style="display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; background: white; border-radius: 6px; border: 1px solid var(--van-gray-4);"
              >
                <span style="font-size: 14px; color: var(--van-gray-7);">
                  {tab.name}
                </span>
                <div
                  class={`toggle-switch ${tab.visible ? "active" : ""}`}
                  onClick={() => toggleTabVisibility(tab.id)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* 标签页选择 */}
        <div class="tab-selector">
          {layoutConfig.tabs
            .filter((tab) => tab.visible)
            .map((tab) => (
              <button
                key={tab.id}
                class={`tab-btn ${activeTab.value === tab.id ? "active" : ""}`}
                onClick={() => (activeTab.value = tab.id)}
              >
                {tab.name}
              </button>
            ))}
        </div>

        {/* 组件布局配置 */}
        <div class="rows-config">
          {layoutConfig.tabs
            .find((tab) => tab.id === activeTab.value)
            ?.rows.map((row, rowIndex) => (
              <div key={row.id} class="row-config">
                <div class="row-header">
                  <span>
                    {browser.i18n.getMessage("layout_row_title") || "第 {0} 行"}
                    .replace('{0}', (rowIndex + 1).toString())
                  </span>
                  <div class="row-controls">
                    <label>
                      {browser.i18n.getMessage("layout_max_columns") ||
                        "每行显示"}
                      :
                      <select
                        value={row.maxColumns}
                        onChange={(e) =>
                          setRowMaxColumns(
                            activeTab.value,
                            row.id,
                            parseInt((e.target as HTMLSelectElement).value)
                          )
                        }
                      >
                        {[1, 2, 3, 4].map((num) => (
                          <option key={num} value={num}>
                            {num}
                            {browser.i18n.getMessage("layout_items") || "个"}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button
                      onClick={() => addRow(activeTab.value, row.id)}
                      title={
                        browser.i18n.getMessage("layout_add_row") || "添加行"
                      }
                    >
                      <Plus class="icon" />
                    </button>
                    <button
                      onClick={() => removeRow(activeTab.value, row.id)}
                      title={
                        browser.i18n.getMessage("layout_remove_row") || "删除行"
                      }
                    >
                      <Trash class="icon" />
                    </button>
                  </div>
                </div>

                <div
                  class="components-grid"
                  onDragover={handleDragOver}
                  onDrop={(e) =>
                    handleDrop(
                      activeTab.value,
                      row.id,
                      row.components.length,
                      e
                    )
                  }
                >
                  {row.components.map((component, index) => (
                    <div
                      key={component.id}
                      class={`component-item ${
                        !component.visible ? "hidden" : ""
                      }`}
                      draggable
                      onDragstart={(e) =>
                        handleDragStart(
                          component.id,
                          activeTab.value,
                          row.id,
                          e
                        )
                      }
                      onDrop={(e) =>
                        handleDrop(activeTab.value, row.id, index, e)
                      }
                    >
                      <div class="component-header">
                        <GripVertical class="drag-handle" />
                        <span>{component.name}</span>
                        <button
                          onClick={() =>
                            toggleComponentVisibility(
                              activeTab.value,
                              component.id
                            )
                          }
                          title={
                            component.visible
                              ? browser.i18n.getMessage(
                                  "layout_hide_component"
                                ) || "隐藏组件"
                              : browser.i18n.getMessage(
                                  "layout_show_component"
                                ) || "显示组件"
                          }
                        >
                          {component.visible ? (
                            <Eye class="icon" />
                          ) : (
                            <EyeOff class="icon" />
                          )}
                        </button>
                      </div>

                      <div class="component-controls">
                        <label>
                          {browser.i18n.getMessage("layout_width") || "宽度"}:
                          <select
                            value={component.colSpan}
                            onChange={(e) =>
                              setComponentColSpan(
                                activeTab.value,
                                component.id,
                                parseInt((e.target as HTMLSelectElement).value)
                              )
                            }
                          >
                            <option value={6}>1/4</option>
                            <option value={8}>1/3</option>
                            <option value={12}>1/2</option>
                            <option value={24}>
                              {browser.i18n.getMessage("layout_full_width") ||
                                "全宽"}
                            </option>
                          </select>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

          <button class="add-row-btn" onClick={() => addRow(activeTab.value)}>
            <Plus class="icon" />
            {browser.i18n.getMessage("layout_add_new_row") || "添加新行"}
          </button>
        </div>

        {/* 预设布局 */}
        <div class="preset-layouts">
          <h3>{browser.i18n.getMessage("layout_presets") || "预设布局"}</h3>
          <div class="preset-buttons">
            {" "}
            <button
              class="preset-btn"
              onClick={() => {
                // 紧凑布局
                layoutConfig.tabs.forEach((tab) => {
                  tab.rows.forEach((row) => {
                    row.maxColumns = 4;
                    row.components.forEach((comp) => {
                      if (comp.colSpan === 24) comp.colSpan = 12;
                      else if (comp.colSpan === 12) comp.colSpan = 6;
                    });
                  });
                });
                checkForChanges();
              }}
            >
              {browser.i18n.getMessage("layout_preset_compact") || "紧凑布局"}
            </button>
            <button
              class="preset-btn"
              onClick={() => {
                // 宽松布局
                layoutConfig.tabs.forEach((tab) => {
                  tab.rows.forEach((row) => {
                    row.maxColumns = 2;
                    row.components.forEach((comp) => {
                      if (comp.colSpan === 6) comp.colSpan = 12;
                    });
                  });
                });
                checkForChanges();
              }}
            >
              {browser.i18n.getMessage("layout_preset_spacious") || "宽松布局"}
            </button>{" "}
            <button
              class="preset-btn"
              onClick={() => {
                // 单列布局
                layoutConfig.tabs.forEach((tab) => {
                  tab.rows.forEach((row) => {
                    row.maxColumns = 1;
                    row.components.forEach((comp) => {
                      comp.colSpan = 24;
                    });
                  });
                });
                checkForChanges();
              }}
            >
              {browser.i18n.getMessage("layout_preset_single") || "单列布局"}
            </button>
          </div>
        </div>
      </div>
    );
  },
});
