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

/**
 * 获取默认组件配置
 */
export function getDefaultComponents(): ComponentItem[] {
  return [
    { 
      id: 'rotate', 
      name: browser.i18n.getMessage('video_rotate') || '旋转', 
      nameKey: 'video_rotate',
      component: null, 
      category: 'video', 
      visible: true, 
      order: 1, 
      colSpan: 6 
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
      name: browser.i18n.getMessage('audio_delay') || '延迟', 
      nameKey: 'audio_delay',
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
      colSpan: 24 
    }
  ];
}

/**
 * 生成默认行配置
 */
export function generateDefaultRows(components: ComponentItem[]): RowConfig[] {
  const rows: RowConfig[] = [];
  let currentRow: RowConfig = {
    id: `row_${Date.now()}`,
    components: [],
    maxColumns: 4
  };

  components.forEach(component => {
    currentRow.components.push(component);
    
    // 根据colSpan决定是否换行
    const currentRowSpan = currentRow.components.reduce((sum, comp) => sum + comp.colSpan, 0);
    
    if (currentRowSpan >= 24 || currentRow.components.length >= currentRow.maxColumns) {
      rows.push(currentRow);
      currentRow = {
        id: `row_${Date.now() + Math.random()}`,
        components: [],
        maxColumns: 4
      };
    }
  });

  // 添加最后一行（如果有未完成的组件）
  if (currentRow.components.length > 0) {
    rows.push(currentRow);
  }

  return rows;
}

/**
 * 获取默认布局配置
 */
export function getDefaultLayoutConfig(): LayoutConfig {
  const defaultComponents = getDefaultComponents();
  
  return {
    tabs: [
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
    ],
    version: '1.0.0'
  };
}

/**
 * 从storage加载布局配置，如果不存在则返回默认配置
 * 这是一个纯工具函数，不依赖于任何Vue响应式系统
 */
export async function loadLayoutConfigFromStorage(): Promise<LayoutConfig> {
  try {
    console.log('Loading layout config from storage...');
    const stored = await browser.storage.local.get(DEFAULT_LAYOUT_KEY);
    console.log('Raw storage result:', stored);
    
    if (stored[DEFAULT_LAYOUT_KEY] && stored[DEFAULT_LAYOUT_KEY].tabs) {
      const loadedConfig = stored[DEFAULT_LAYOUT_KEY];
      
      if (loadedConfig.tabs && loadedConfig.tabs.length > 0) {
        console.log('Found stored configuration, tabs count:', loadedConfig.tabs.length);
        return {
          tabs: JSON.parse(JSON.stringify(loadedConfig.tabs)), // 深拷贝
          version: loadedConfig.version || '1.0.0'
        };
      }
    }
    
    console.log('No valid stored configuration found, using default');
    return getDefaultLayoutConfig();
  } catch (error) {
    console.error('Failed to load layout config from storage:', error);
    return getDefaultLayoutConfig();
  }
}

/**
 * 保存布局配置到storage
 */
export async function saveLayoutConfigToStorage(config: LayoutConfig): Promise<boolean> {
  try {
    console.log('Saving layout config to storage:', JSON.stringify(config, null, 2));
    await browser.storage.local.set({
      [DEFAULT_LAYOUT_KEY]: JSON.parse(JSON.stringify(config))
    });
    console.log('Layout config saved successfully');
    return true;
  } catch (error) {
    console.error('Failed to save layout config to storage:', error);
    return false;
  }
}
