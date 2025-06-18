import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 英文翻译映射
const englishTranslations = {
    'layout_visibility': 'Component Visibility',
    'layout_arrangement': 'Layout Arrangement', 
    'layout_preset_layouts': 'Preset Layouts',
    'layout_compact': 'Compact Layout',
    'layout_spacious': 'Spacious Layout',
    'layout_single_column': 'Single Column Layout',
    'layout_apply': 'Apply',
    'layout_rows_per_tab': 'Rows per Tab',
    'layout_columns_per_row': 'Columns per Row',
    'layout_drag_hint': 'Drag components to rearrange',
    'layout_config_title': 'Interface Layout Configuration',
    'layout_config_desc': 'Customize popup interface component layout and display',
    'layout_tabs_config': 'Tabs Configuration',
    'layout_row_title': 'Row {0}',
    'layout_max_columns': 'Display per row',
    'layout_items': 'items',
    'layout_add_row': 'Add Row',
    'layout_remove_row': 'Remove Row',
    'layout_add_new_row': 'Add New Row',
    'layout_hide_component': 'Hide Component',
    'layout_show_component': 'Show Component',
    'layout_width': 'Width'
};

const messageFile = path.join(__dirname, '..', '_locales', 'en_US', 'messages.json');

console.log('🔄 Updating English placeholder translations...');

try {
    const content = JSON.parse(fs.readFileSync(messageFile, 'utf8'));
    let updatedCount = 0;
    
    // 更新英文占位符翻译
    Object.keys(content).forEach(key => {
        const currentMessage = content[key].message;
        
        // 检查是否是英文占位符
        if (currentMessage.startsWith('[EN_US]') && englishTranslations[key]) {
            content[key].message = englishTranslations[key];
            updatedCount++;
            console.log(`✅ Updated: ${key} -> ${englishTranslations[key]}`);
        }
    });
    
    // 保存文件
    fs.writeFileSync(messageFile, JSON.stringify(content, null, 3) + '\n', 'utf8');
    console.log(`\n✅ Updated ${updatedCount} English translations`);
    
} catch (error) {
    console.log(`❌ Error: ${error.message}`);
}

console.log('✨ English translation update completed!');
