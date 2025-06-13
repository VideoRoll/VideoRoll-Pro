import { ref, reactive, computed, Ref } from 'vue';
import browser from 'webextension-polyfill';

export interface ComponentItem {
  id: string;
  name: string;
  nameKey?: string; // i18n key
  component: any;
  category: 'video' | 'audio' | 'download' | 'more';
  visible: boolean;
  order: number;
  colSpan: number; // 6, 8, 12, 24 (基于24栅格系统)
}

export interface RowConfig {
  id: string;
  components: ComponentItem[];
  maxColumns: number; // 每行最多显示几个组件 (1-4)
}

export interface TabConfig {
  id: string;
  name: string;
  nameKey: string; // i18n key
  icon: string;
  visible: boolean;
  rows: RowConfig[];
}

export interface LayoutConfig {
  tabs: TabConfig[];
  version: string;
}

const DEFAULT_LAYOUT_KEY = 'video_roll_layout_config';

export function useLayoutConfig() {
  const layoutConfig = reactive<LayoutConfig>({
    tabs: [],
    version: '1.0.0'
  });

  const isConfigMode = ref(false);
  const hasUnsavedChanges = ref(false);

  // 默认组件配置
  const getDefaultComponents = (): ComponentItem[] => [
    { 
      id: 'rotate', 
      name: browser.i18n.getMessage('video_rotate') || '旋转', 
      nameKey: 'video_rotate',
      component: null, 
      category: 'video', 
      visible: true, 
      order: 1, 
      colSpan: 12 
    },
    { 
      id: 'loop', 
      name: browser.i18n.getMessage('video_loop') || '循环', 
      nameKey: 'video_loop',
      component: null, 
      category: 'video', 
      visible: true, 
      order: 2, 
      colSpan: 6 
    },
    { 
      id: 'pip', 
      name: browser.i18n.getMessage('video_pic') || '画中画', 
      nameKey: 'video_pic',
      component: null, 
      category: 'video', 
      visible: true, 
      order: 3, 
      colSpan: 6 
    },
    { 
      id: 'reposition', 
      name: browser.i18n.getMessage('video_reposition') || '重新定位', 
      nameKey: 'video_reposition',
      component: null, 
      category: 'video', 
      visible: true, 
      order: 4, 
      colSpan: 6 
    },
    { 
      id: 'stretch', 
      name: browser.i18n.getMessage('video_stretch') || '拉伸', 
      nameKey: 'video_stretch',
      component: null, 
      category: 'video', 
      visible: true, 
      order: 5, 
      colSpan: 6 
    },
    { 
      id: 'flip', 
      name: browser.i18n.getMessage('video_flip') || '翻转', 
      nameKey: 'video_flip',
      component: null, 
      category: 'video', 
      visible: true, 
      order: 6, 
      colSpan: 6 
    },
    { 
      id: 'capture', 
      name: browser.i18n.getMessage('video_screenshot') || '截图', 
      nameKey: 'video_screenshot',
      component: null, 
      category: 'video', 
      visible: true, 
      order: 7, 
      colSpan: 6 
    },
    { 
      id: 'qr', 
      name: browser.i18n.getMessage('tab_qr') || '二维码', 
      nameKey: 'tab_qr',
      component: null, 
      category: 'video', 
      visible: true, 
      order: 8, 
      colSpan: 6 
    },
    { 
      id: 'filter', 
      name: browser.i18n.getMessage('video_filter') || '滤镜', 
      nameKey: 'video_filter',
      component: null, 
      category: 'video', 
      visible: true, 
      order: 9, 
      colSpan: 6 
    },
    { 
      id: 'focus', 
      name: browser.i18n.getMessage('video_focus') || '聚焦', 
      nameKey: 'video_focus',
      component: null, 
      category: 'video', 
      visible: true, 
      order: 10, 
      colSpan: 6 
    },
    { 
      id: 'separate', 
      name: 'Separate', 
      component: null, 
      category: 'video', 
      visible: true, 
      order: 11, 
      colSpan: 6 
    },
    { 
      id: 'player', 
      name: browser.i18n.getMessage('tab_player') || '播放器', 
      nameKey: 'tab_player',
      component: null, 
      category: 'video', 
      visible: true, 
      order: 12, 
      colSpan: 6 
    },
    { 
      id: 'abloop', 
      name: browser.i18n.getMessage('tab_abloop') || 'AB循环', 
      nameKey: 'tab_abloop',
      component: null, 
      category: 'video', 
      visible: true, 
      order: 13, 
      colSpan: 6 
    },
    { 
      id: 'vr', 
      name: browser.i18n.getMessage('tab_vr') || 'VR', 
      nameKey: 'tab_vr',
      component: null, 
      category: 'video', 
      visible: true, 
      order: 14, 
      colSpan: 6 
    },
    { 
      id: 'record', 
      name: browser.i18n.getMessage('tab_record') || '录制', 
      nameKey: 'tab_record',
      component: null, 
      category: 'video', 
      visible: true, 
      order: 15, 
      colSpan: 6 
    },
    { 
      id: 'summarizer', 
      name: 'AI摘要', 
      component: null, 
      category: 'video', 
      visible: true, 
      order: 16, 
      colSpan: 6 
    },
    { 
      id: 'speed', 
      name: browser.i18n.getMessage('video_speed') || '播放速度', 
      nameKey: 'video_speed',
      component: null, 
      category: 'video', 
      visible: true, 
      order: 17, 
      colSpan: 24 
    },
    { 
      id: 'zoom', 
      name: browser.i18n.getMessage('video_zoom') || '缩放', 
      nameKey: 'video_zoom',
      component: null, 
      category: 'video', 
      visible: true, 
      order: 18, 
      colSpan: 24 
    },
    // 音频组件
    { 
      id: 'mute', 
      name: browser.i18n.getMessage('audio_muted') || '静音', 
      nameKey: 'audio_muted',
      component: null, 
      category: 'audio', 
      visible: true, 
      order: 1, 
      colSpan: 12 
    },
    { 
      id: 'panner', 
      name: 'Surround', 
      component: null, 
      category: 'audio', 
      visible: true, 
      order: 2, 
      colSpan: 12 
    },
    { 
      id: 'volume', 
      name: browser.i18n.getMessage('audio_volume') || '音量', 
      nameKey: 'audio_volume',
      component: null, 
      category: 'audio', 
      visible: true, 
      order: 3, 
      colSpan: 24 
    },
    { 
      id: 'pitch', 
      name: browser.i18n.getMessage('audio_pitch') || '音调', 
      nameKey: 'audio_pitch',
      component: null, 
      category: 'audio', 
      visible: true, 
      order: 4, 
      colSpan: 24 
    },
    { 
      id: 'delay', 
      name: 'Delay', 
      component: null, 
      category: 'audio', 
      visible: true, 
      order: 5, 
      colSpan: 24 
    },
    { 
      id: 'stereo', 
      name: 'Stereo', 
      component: null, 
      category: 'audio', 
      visible: true, 
      order: 6, 
      colSpan: 24    }
  ];

  // 更新保存的配置快照 - 简化版本
  const checkForChanges = () => {
    // 简单标记有变更，不做复杂的快照对比
    hasUnsavedChanges.value = true;
  };
  // 加载配置
  const loadConfig = async () => {
    try {
      console.log('Loading layout config from storage...');
      
      // 强制清空当前配置
      layoutConfig.tabs.splice(0);
      layoutConfig.version = '1.0.0';
      
      // 从存储中获取配置
      const stored = await browser.storage.local.get(DEFAULT_LAYOUT_KEY);
      console.log('Raw storage result:', stored);
      
      if (stored[DEFAULT_LAYOUT_KEY] && stored[DEFAULT_LAYOUT_KEY].tabs) {
        // 加载存储的配置
        const loadedConfig = stored[DEFAULT_LAYOUT_KEY];
        layoutConfig.version = loadedConfig.version || '1.0.0';
        
        if (loadedConfig.tabs && loadedConfig.tabs.length > 0) {
          // 深拷贝配置数据以避免引用问题
          const configCopy = JSON.parse(JSON.stringify(loadedConfig.tabs));
          layoutConfig.tabs.push(...configCopy);
          console.log('Loaded configuration from storage, tabs count:', layoutConfig.tabs.length);
        } else {
          console.log('No tabs found in stored config, using default');
          resetToDefault();
        }
      } else {
        console.log('No stored configuration found, using default');
        resetToDefault();
      }
      
      // 加载完成后重置变更标记
      hasUnsavedChanges.value = false;
      console.log('Layout config load completed. Final config:', JSON.stringify(layoutConfig, null, 2));
    } catch (error) {
      console.error('Failed to load layout config:', error);
      resetToDefault();
      hasUnsavedChanges.value = false;
    }
  };

  // 保存配置
  const saveConfig = async () => {
    try {
      console.log('Saving layout config:', JSON.stringify(layoutConfig, null, 2));
      await browser.storage.local.set({
        [DEFAULT_LAYOUT_KEY]: JSON.parse(JSON.stringify(layoutConfig))
      });
      // 保存成功后重置变更标记
      hasUnsavedChanges.value = false;
      console.log('Layout config saved successfully');
      return true;
    } catch (error) {
      console.error('Failed to save layout config:', error);
      return false;
    }
  };  // 重置为默认配置
  const resetToDefault = () => {
    console.log('Resetting to default layout config');
    const defaultComponents = getDefaultComponents();
    
    // 清空现有配置并重新添加
    layoutConfig.tabs.splice(0);
    layoutConfig.tabs.push(
      {
        id: 'video',
        name: browser.i18n.getMessage('tabs_video') || '视频',
        nameKey: 'tabs_video',
        icon: 'DeviceTv',
        visible: true,
        rows: generateDefaultRows(defaultComponents.filter(c => c.category === 'video'))
      },
      {
        id: 'audio',
        name: browser.i18n.getMessage('tabs_audio') || '音频',
        nameKey: 'tabs_audio',
        icon: 'Headphones',
        visible: true,
        rows: generateDefaultRows(defaultComponents.filter(c => c.category === 'audio'))
      },
      {
        id: 'download',
        name: browser.i18n.getMessage('tab_download') || '下载',
        nameKey: 'tab_download',
        icon: 'Download',
        visible: true,
        rows: []
      },
      {
        id: 'more',
        name: browser.i18n.getMessage('tabs_more') || '更多',
        nameKey: 'tabs_more',
        icon: 'Adjustments',
        visible: true,
        rows: []
      }
    );
    console.log('Reset to default config completed:', JSON.stringify(layoutConfig.tabs, null, 2));
  };

  // 生成默认行配置
  const generateDefaultRows = (components: ComponentItem[]): RowConfig[] => {
    const rows: RowConfig[] = [];
    let currentRow: RowConfig = {
      id: `row_${Date.now()}`,
      components: [],
      maxColumns: 2
    };

    components.forEach(component => {
      // 根据 colSpan 决定是否换行
      if (component.colSpan === 24) {
        // 全宽组件独占一行
        if (currentRow.components.length > 0) {
          rows.push(currentRow);
          currentRow = {
            id: `row_${Date.now()}_${Math.random()}`,
            components: [],
            maxColumns: 1
          };
        }
        currentRow.components.push(component);
        currentRow.maxColumns = 1;
        rows.push(currentRow);
        currentRow = {
          id: `row_${Date.now()}_${Math.random()}`,
          components: [],
          maxColumns: 2
        };
      } else {
        // 普通组件
        if (currentRow.components.length >= currentRow.maxColumns) {
          rows.push(currentRow);
          currentRow = {
            id: `row_${Date.now()}_${Math.random()}`,
            components: [],
            maxColumns: 2
          };
        }
        currentRow.components.push(component);
      }
    });

    if (currentRow.components.length > 0) {
      rows.push(currentRow);
    }

    return rows;
  };
  // 切换组件可见性
  const toggleComponentVisibility = (tabId: string, componentId: string) => {
    const tab = layoutConfig.tabs.find(t => t.id === tabId);
    if (!tab) return;

    tab.rows.forEach(row => {
      const component = row.components.find(c => c.id === componentId);
      if (component) {
        component.visible = !component.visible;
      }
    });
    checkForChanges();
  };
  // 调整组件在行中的位置
  const moveComponent = (fromTabId: string, fromRowId: string, toTabId: string, toRowId: string, componentId: string, newIndex: number) => {
    const fromTab = layoutConfig.tabs.find(t => t.id === fromTabId);
    const toTab = layoutConfig.tabs.find(t => t.id === toTabId);
    if (!fromTab || !toTab) return;

    const fromRow = fromTab.rows.find(r => r.id === fromRowId);
    const toRow = toTab.rows.find(r => r.id === toRowId);
    if (!fromRow || !toRow) return;

    const componentIndex = fromRow.components.findIndex(c => c.id === componentId);
    if (componentIndex === -1) return;

    const [component] = fromRow.components.splice(componentIndex, 1);
    toRow.components.splice(newIndex, 0, component);
    checkForChanges();
  };
  // 调整行的最大列数
  const setRowMaxColumns = (tabId: string, rowId: string, maxColumns: number) => {
    const tab = layoutConfig.tabs.find(t => t.id === tabId);
    if (!tab) return;

    const row = tab.rows.find(r => r.id === rowId);
    if (!row) return;

    row.maxColumns = Math.max(1, Math.min(4, maxColumns));
    checkForChanges();
  };
  // 调整组件的列宽
  const setComponentColSpan = (tabId: string, componentId: string, colSpan: number) => {
    const tab = layoutConfig.tabs.find(t => t.id === tabId);
    if (!tab) return;

    tab.rows.forEach(row => {
      const component = row.components.find(c => c.id === componentId);
      if (component) {
        component.colSpan = colSpan;
      }
    });
    checkForChanges();
  };
  // 添加新行
  const addRow = (tabId: string, afterRowId?: string) => {
    const tab = layoutConfig.tabs.find(t => t.id === tabId);
    if (!tab) return;

    const newRow: RowConfig = {
      id: `row_${Date.now()}_${Math.random()}`,
      components: [],
      maxColumns: 2
    };

    if (afterRowId) {
      const index = tab.rows.findIndex(r => r.id === afterRowId);
      tab.rows.splice(index + 1, 0, newRow);
    } else {
      tab.rows.push(newRow);
    }
    checkForChanges();
  };
  // 删除行
  const removeRow = (tabId: string, rowId: string) => {
    const tab = layoutConfig.tabs.find(t => t.id === tabId);
    if (!tab) return;

    const rowIndex = tab.rows.findIndex(r => r.id === rowId);
    if (rowIndex !== -1) {
      const removedRow = tab.rows[rowIndex];
      if (removedRow.components.length > 0) {
        const targetRow = tab.rows[rowIndex - 1] || tab.rows[rowIndex + 1];
        if (targetRow) {
          targetRow.components.push(...removedRow.components);
        }
      }
      
      tab.rows.splice(rowIndex, 1);
    }
    checkForChanges();
  };
  // 切换标签页可见性
  const toggleTabVisibility = (tabId: string) => {
    const tab = layoutConfig.tabs.find(t => t.id === tabId);
    if (tab) {
      tab.visible = !tab.visible;
    }
    checkForChanges();
  };  return {
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
    checkForChanges
  };
}
