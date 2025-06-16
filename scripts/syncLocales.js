import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 语言文件路径
const localesDir = path.join(__dirname, '..', '_locales');
const baseLocale = 'zh_CN'; // 使用中文作为基准

// 读取基准语言文件
const baseFile = path.join(localesDir, baseLocale, 'messages.json');
const baseContent = JSON.parse(fs.readFileSync(baseFile, 'utf8'));
const baseKeys = Object.keys(baseContent);

console.log(`Base locale (${baseLocale}) has ${baseKeys.length} keys`);

// 获取所有语言目录
const locales = fs.readdirSync(localesDir).filter(dir => {
    return fs.statSync(path.join(localesDir, dir)).isDirectory() && dir !== baseLocale;
});

console.log(`Checking locales: ${locales.join(', ')}`);

// 检查每个语言文件
const results = {};

locales.forEach(locale => {
    const messageFile = path.join(localesDir, locale, 'messages.json');
    
    if (!fs.existsSync(messageFile)) {
        console.log(`❌ ${locale}: messages.json not found`);
        results[locale] = { missing: baseKeys, total: baseKeys.length };
        return;
    }
    
    try {
        const content = JSON.parse(fs.readFileSync(messageFile, 'utf8'));
        const keys = Object.keys(content);
        const missingKeys = baseKeys.filter(key => !content.hasOwnProperty(key));
        
        results[locale] = {
            missing: missingKeys,
            total: missingKeys.length,
            hasKeys: keys.length
        };
        
        console.log(`\n📋 ${locale}:`);
        console.log(`   Has ${keys.length} keys, missing ${missingKeys.length} keys`);
        
        if (missingKeys.length > 0) {
            console.log(`   Missing keys: ${missingKeys.slice(0, 5).join(', ')}${missingKeys.length > 5 ? '...' : ''}`);
        }
        
    } catch (error) {
        console.log(`❌ ${locale}: Error parsing JSON - ${error.message}`);
        results[locale] = { error: error.message };
    }
});

// 生成更新文件的功能
function updateLocaleFile(locale, missingKeys) {
    const messageFile = path.join(localesDir, locale, 'messages.json');
    
    try {
        let content = {};
        if (fs.existsSync(messageFile)) {
            content = JSON.parse(fs.readFileSync(messageFile, 'utf8'));
        }
        
        // 添加缺失的键，使用基准文件的值作为占位符
        missingKeys.forEach(key => {
            if (!content[key]) {
                // 对于某些语言，我们可以提供基本的翻译
                content[key] = {
                    message: getTranslation(key, locale, baseContent[key].message)
                };
                if (baseContent[key].description) {
                    content[key].description = baseContent[key].description;
                }
            }
        });
        
        // 保存文件
        fs.writeFileSync(messageFile, JSON.stringify(content, null, 3) + '\n', 'utf8');
        console.log(`✅ Updated ${locale} with ${missingKeys.length} missing keys`);
        
    } catch (error) {
        console.log(`❌ Failed to update ${locale}: ${error.message}`);
    }
}

// 获取对应语言的翻译
function getTranslation(key, locale, originalText) {
    const translations = {
        // 布局配置相关
        'layout_title': {
            'ar': 'تكوين التخطيط',
            'de': 'Layout-Konfiguration',
            'es': 'Configuración de diseño',
            'fr': 'Configuration de mise en page',
            'ja': 'レイアウト設定',
            'ko': '레이아웃 설정',
            'pt': 'Configuração de layout',
            'ru': 'Конфигурация макета'
        },
        'layout_description': {
            'ar': 'تخصيص تخطيط واجهة النافذة المنبثقة ورؤية المكونات',
            'de': 'Anpassen des Popup-Interface-Layouts und der Komponentensichtbarkeit',
            'es': 'Personalizar el diseño de la interfaz emergente y la visibilidad de componentes',
            'fr': 'Personnaliser la mise en page de l\'interface popup et la visibilité des composants',
            'ja': 'ポップアップインターフェースのレイアウトとコンポーネントの表示をカスタマイズ',
            'ko': '팝업 인터페이스 레이아웃과 컴포넌트 가시성을 사용자 정의',
            'pt': 'Personalizar o layout da interface popup e visibilidade dos componentes',
            'ru': 'Настройка макета всплывающего интерфейса и видимости компонентов'
        },
        'layout_visibility': {
            'ar': 'رؤية المكونات',
            'de': 'Komponentensichtbarkeit',
            'es': 'Visibilidad de componentes',
            'fr': 'Visibilité des composants',
            'ja': 'コンポーネントの表示',
            'ko': '컴포넌트 가시성',
            'pt': 'Visibilidade dos componentes',
            'ru': 'Видимость компонентов'
        },
        'layout_arrangement': {
            'ar': 'ترتيب التخطيط',
            'de': 'Layout-Anordnung',
            'es': 'Disposición del diseño',
            'fr': 'Arrangement de mise en page',
            'ja': 'レイアウト配置',
            'ko': '레이아웃 배치',
            'pt': 'Arranjo do layout',
            'ru': 'Расположение макета'
        },
        'layout_tabs': {
            'ar': 'علامات التبويب',
            'de': 'Registerkarten',
            'es': 'Pestañas',
            'fr': 'Onglets',
            'ja': 'タブ',
            'ko': '탭',
            'pt': 'Abas',
            'ru': 'Вкладки'
        },
        'layout_preset_layouts': {
            'ar': 'تخطيطات مسبقة الإعداد',
            'de': 'Vorgefertigte Layouts',
            'es': 'Diseños predefinidos',
            'fr': 'Mises en page prédéfinies',
            'ja': 'プリセットレイアウト',
            'ko': '프리셋 레이아웃',
            'pt': 'Layouts predefinidos',
            'ru': 'Предустановленные макеты'
        },
        'layout_compact': {
            'ar': 'تخطيط مضغوط',
            'de': 'Kompaktes Layout',
            'es': 'Diseño compacto',
            'fr': 'Mise en page compacte',
            'ja': 'コンパクトレイアウト',
            'ko': '컴팩트 레이아웃',
            'pt': 'Layout compacto',
            'ru': 'Компактный макет'
        },
        'layout_spacious': {
            'ar': 'تخطيط واسع',
            'de': 'Geräumiges Layout',
            'es': 'Diseño espacioso',
            'fr': 'Mise en page spacieuse',
            'ja': '広々レイアウト',
            'ko': '여유있는 레이아웃',
            'pt': 'Layout espaçoso',
            'ru': 'Просторный макет'
        },
        'layout_single_column': {
            'ar': 'تخطيط عمود واحد',
            'de': 'Einspalten-Layout',
            'es': 'Diseño de una columna',
            'fr': 'Mise en page une colonne',
            'ja': '単一列レイアウト',
            'ko': '단일 컬럼 레이아웃',
            'pt': 'Layout de coluna única',
            'ru': 'Одноколоночный макет'
        },
        'layout_apply': {
            'ar': 'تطبيق',
            'de': 'Anwenden',
            'es': 'Aplicar',
            'fr': 'Appliquer',
            'ja': '適用',
            'ko': '적용',
            'pt': 'Aplicar',
            'ru': 'Применить'
        },
        'layout_export': {
            'ar': 'تصدير التكوين',
            'de': 'Konfiguration exportieren',
            'es': 'Exportar configuración',
            'fr': 'Exporter la configuration',
            'ja': '設定をエクスポート',
            'ko': '설정 내보내기',
            'pt': 'Exportar configuração',
            'ru': 'Экспорт конфигурации'
        },
        'layout_import': {
            'ar': 'استيراد التكوين',
            'de': 'Konfiguration importieren',
            'es': 'Importar configuración',
            'fr': 'Importer la configuration',
            'ja': '設定をインポート',
            'ko': '설정 가져오기',
            'pt': 'Importar configuração',
            'ru': 'Импорт конфигурации'
        },
        'layout_reset': {
            'ar': 'إعادة تعيين إلى الافتراضي',
            'de': 'Auf Standard zurücksetzen',
            'es': 'Restablecer por defecto',
            'fr': 'Réinitialiser par défaut',
            'ja': 'デフォルトにリセット',
            'ko': '기본값으로 재설정',
            'pt': 'Redefinir para padrão',
            'ru': 'Сбросить к значениям по умолчанию'
        },
        'layout_rows_per_tab': {
            'ar': 'عدد الصفوف لكل علامة تبويب',
            'de': 'Zeilen pro Registerkarte',
            'es': 'Filas por pestaña',
            'fr': 'Lignes par onglet',
            'ja': 'タブあたりの行数',
            'ko': '탭당 행 수',
            'pt': 'Linhas por aba',
            'ru': 'Строк на вкладку'
        },
        'layout_columns_per_row': {
            'ar': 'الأعمدة لكل صف',
            'de': 'Spalten pro Zeile',
            'es': 'Columnas por fila',
            'fr': 'Colonnes par ligne',
            'ja': '行あたりの列数',
            'ko': '행당 열 수',
            'pt': 'Colunas por linha',
            'ru': 'Столбцов в строке'
        },
        'layout_drag_hint': {
            'ar': 'اسحب المكونات لإعادة ترتيبها',
            'de': 'Ziehen Sie Komponenten zum Neuanordnen',
            'es': 'Arrastra componentes para reordenar',
            'fr': 'Glissez les composants pour les réorganiser',
            'ja': 'コンポーネントをドラッグして並び替え',
            'ko': '컴포넌트를 드래그하여 재정렬',
            'pt': 'Arraste componentes para reorganizar',
            'ru': 'Перетащите компоненты для перестановки'
        },
        'layout_unsaved_changes': {
            'ar': 'غير محفوظ',
            'de': 'Nicht gespeichert',
            'es': 'Sin guardar',
            'fr': 'Non sauvegardé',
            'ja': '未保存',
            'ko': '저장되지 않음',
            'pt': 'Não salvo',
            'ru': 'Не сохранено'
        },
        'layout_save_reminder': {
            'ar': '· يرجى تذكر حفظ التغييرات',
            'de': '· Bitte denken Sie daran, Änderungen zu speichern',
            'es': '· Por favor recuerda guardar los cambios',
            'fr': '· Veuillez vous rappeler de sauvegarder les modifications',
            'ja': '· 変更を保存することを忘れずに',
            'ko': '· 변경사항을 저장하는 것을 잊지 마세요',
            'pt': '· Por favor, lembre-se de salvar as alterações',
            'ru': '· Пожалуйста, не забудьте сохранить изменения'
        },
        'layout_component_hidden': {
            'ar': 'مخفي',
            'de': 'Versteckt',
            'es': 'Oculto',
            'fr': 'Masqué',
            'ja': '非表示',
            'ko': '숨김',
            'pt': 'Oculto',
            'ru': 'Скрыто'
        },
        'layout_config_saved': {
            'ar': 'تم حفظ التكوين بنجاح!',
            'de': 'Konfiguration erfolgreich gespeichert!',
            'es': '¡Configuración guardada exitosamente!',
            'fr': 'Configuration sauvegardée avec succès !',
            'ja': '設定が正常に保存されました！',
            'ko': '설정이 성공적으로 저장되었습니다!',
            'pt': 'Configuração salva com sucesso!',
            'ru': 'Конфигурация успешно сохранена!'
        },
        'layout_config_reset': {
            'ar': 'تم إعادة تعيين التخطيط الافتراضي بنجاح!',
            'de': 'Standard-Layout erfolgreich zurückgesetzt!',
            'es': '¡Diseño por defecto restablecido exitosamente!',
            'fr': 'Mise en page par défaut réinitialisée avec succès !',
            'ja': 'デフォルトレイアウトが正常にリセットされました！',
            'ko': '기본 레이아웃이 성공적으로 재설정되었습니다!',
            'pt': 'Layout padrão redefinido com sucesso!',
            'ru': 'Макет по умолчанию успешно сброшен!'
        },
        'layout_config_title': {
            'ar': 'تكوين تخطيط الواجهة',
            'de': 'Interface-Layout-Konfiguration',
            'es': 'Configuración de diseño de interfaz',
            'fr': 'Configuration de mise en page d\'interface',
            'ja': 'インターフェースレイアウト設定',
            'ko': '인터페이스 레이아웃 설정',
            'pt': 'Configuração de layout de interface',
            'ru': 'Конфигурация макета интерфейса'
        },
        'layout_config_desc': {
            'ar': 'تخصيص تخطيط المكونات وعرض الواجهة المنبثقة',
            'de': 'Anpassen des Komponentenlayouts und der Anzeige der Popup-Oberfläche',
            'es': 'Personalizar el diseño de componentes y la visualización de la interfaz emergente',
            'fr': 'Personnaliser la mise en page des composants et l\'affichage de l\'interface popup',
            'ja': 'ポップアップインターフェースのコンポーネントレイアウトと表示をカスタマイズ',
            'ko': '팝업 인터페이스의 컴포넌트 레이아웃과 표시를 사용자 정의',
            'pt': 'Personalizar o layout dos componentes e exibição da interface popup',
            'ru': 'Настройка макета компонентов и отображения всплывающего интерфейса'
        },
        'layout_tabs_config': {
            'ar': 'تكوين علامات التبويب',
            'de': 'Registerkarten-Konfiguration',
            'es': 'Configuración de pestañas',
            'fr': 'Configuration des onglets',
            'ja': 'タブ設定',
            'ko': '탭 설정',
            'pt': 'Configuração de abas',
            'ru': 'Конфигурация вкладок'
        },
        'layout_row_title': {
            'ar': 'الصف {0}',
            'de': 'Zeile {0}',
            'es': 'Fila {0}',
            'fr': 'Ligne {0}',
            'ja': '第{0}行',
            'ko': '제{0}행',
            'pt': 'Linha {0}',
            'ru': 'Строка {0}'
        },
        'layout_max_columns': {
            'ar': 'عرض كل صف',
            'de': 'Jede Zeile anzeigen',
            'es': 'Mostrar cada fila',
            'fr': 'Afficher chaque ligne',
            'ja': '各行に表示',
            'ko': '각 행에 표시',
            'pt': 'Exibir cada linha',
            'ru': 'Показать каждую строку'
        },
        'layout_items': {
            'ar': 'عنصر',
            'de': 'Artikel',
            'es': 'elemento',
            'fr': 'élément',
            'ja': '個',
            'ko': '개',
            'pt': 'item',
            'ru': 'элемент'
        },
        'layout_add_row': {
            'ar': 'إضافة صف',
            'de': 'Zeile hinzufügen',
            'es': 'Agregar fila',
            'fr': 'Ajouter une ligne',
            'ja': '行を追加',
            'ko': '행 추가',
            'pt': 'Adicionar linha',
            'ru': 'Добавить строку'
        },
        'layout_remove_row': {
            'ar': 'حذف الصف',
            'de': 'Zeile löschen',
            'es': 'Eliminar fila',
            'fr': 'Supprimer la ligne',
            'ja': '行を削除',
            'ko': '행 삭제',
            'pt': 'Remover linha',
            'ru': 'Удалить строку'
        },
        'layout_add_new_row': {
            'ar': 'إضافة صف جديد',
            'de': 'Neue Zeile hinzufügen',
            'es': 'Agregar nueva fila',
            'fr': 'Ajouter une nouvelle ligne',
            'ja': '新しい行を追加',
            'ko': '새 행 추가',
            'pt': 'Adicionar nova linha',
            'ru': 'Добавить новую строку'
        },
        'layout_hide_component': {
            'ar': 'إخفاء المكون',
            'de': 'Komponente ausblenden',
            'es': 'Ocultar componente',
            'fr': 'Masquer le composant',
            'ja': 'コンポーネントを非表示',
            'ko': '컴포넌트 숨기기',
            'pt': 'Ocultar componente',
            'ru': 'Скрыть компонент'
        },
        'layout_show_component': {
            'ar': 'إظهار المكون',
            'de': 'Komponente anzeigen',
            'es': 'Mostrar componente',
            'fr': 'Afficher le composant',
            'ja': 'コンポーネントを表示',
            'ko': '컴포넌트 보이기',
            'pt': 'Mostrar componente',
            'ru': 'Показать компонент'
        },
        'layout_width': {
            'ar': 'العرض',
            'de': 'Breite',
            'es': 'Ancho',
            'fr': 'Largeur',
            'ja': '幅',
            'ko': '너비',
            'pt': 'Largura',
            'ru': 'Ширина'
        },
        'layout_config_import_error': {
            'ar': 'فشل في استيراد ملف التكوين',
            'de': 'Fehler beim Importieren der Konfigurationsdatei',
            'es': 'Error al importar archivo de configuración',
            'fr': 'Échec de l\'importation du fichier de configuration',
            'ja': '設定ファイルのインポートに失敗しました',
            'ko': '설정 파일 가져오기 실패',
            'pt': 'Falha ao importar arquivo de configuração',
            'ru': 'Ошибка импорта файла конфигурации'
        },
        'layout_config_reset_confirm': {
            'ar': 'هل أنت متأكد من أنك تريد إعادة تعيين التخطيط الافتراضي؟',
            'de': 'Sind Sie sicher, dass Sie auf das Standard-Layout zurücksetzen möchten?',
            'es': '¿Estás seguro de que quieres restablecer el diseño por defecto?',
            'fr': 'Êtes-vous sûr de vouloir réinitialiser la mise en page par défaut ?',
            'ja': 'デフォルトレイアウトにリセットしてもよろしいですか？',
            'ko': '기본 레이아웃으로 재설정하시겠습니까?',
            'pt': 'Tem certeza de que deseja redefinir para o layout padrão?',
            'ru': 'Вы уверены, что хотите сбросить макет по умолчанию?'
        },
        'layout_unsaved_warning': {
            'ar': 'لديك تغييرات غير محفوظة، هل أنت متأكد من أنك تريد المغادرة؟',
            'de': 'Sie haben ungespeicherte Änderungen. Sind Sie sicher, dass Sie gehen möchten?',
            'es': 'Tienes cambios sin guardar, ¿estás seguro de que quieres salir?',
            'fr': 'Vous avez des modifications non sauvegardées, êtes-vous sûr de vouloir partir ?',
            'ja': '未保存の変更があります。本当に離れますか？',
            'ko': '저장되지 않은 변경사항이 있습니다. 정말로 나가시겠습니까?',
            'pt': 'Você tem alterações não salvas, tem certeza de que deseja sair?',
            'ru': 'У вас есть несохраненные изменения, вы уверены, что хотите уйти?'
        },
        // 快捷键相关
        'clear_shortcut': {
            'ar': 'مسح الاختصار',
            'de': 'Tastenkürzel löschen',
            'es': 'Borrar atajo',
            'fr': 'Effacer raccourci',
            'ja': 'ショートカットをクリア',
            'ko': '단축키 지우기',
            'pt': 'Limpar atalho',
            'ru': 'Очистить ярлык'
        },
        'shortcut_cleared': {
            'ar': 'تم مسح الاختصار بنجاح',
            'de': 'Tastenkürzel erfolgreich gelöscht',
            'es': 'Atajo borrado exitosamente',
            'fr': 'Raccourci effacé avec succès',
            'ja': 'ショートカットが正常にクリアされました',
            'ko': '단축키가 성공적으로 지워졌습니다',
            'pt': 'Atalho limpo com sucesso',
            'ru': 'Ярлык успешно очищен'
        },
        // 下载相关
        'download_no_segments': {
            'ar': 'لا توجد أجزاء متاحة للتحميل!',
            'de': 'Keine Segmente zum Download verfügbar!',
            'es': '¡No hay segmentos disponibles para descargar!',
            'fr': 'Aucun segment disponible pour le téléchargement !',
            'ja': 'ダウンロード可能なセグメントがありません！',
            'ko': '다운로드할 수 있는 세그먼트가 없습니다!',
            'pt': 'Nenhum segmento disponível para download!',
            'ru': 'Нет доступных сегментов для загрузки!'
        },
        'download_size': {
            'ar': 'الحجم',
            'de': 'Größe',
            'es': 'Tamaño',
            'fr': 'Taille',
            'ja': 'サイズ',
            'ko': '크기',
            'pt': 'Tamanho',
            'ru': 'Размер'
        },
        'download_segments': {
            'ar': 'الأجزاء',
            'de': 'Segmente',
            'es': 'Segmentos',
            'fr': 'Segments',
            'ja': 'セグメント',
            'ko': '세그먼트',
            'pt': 'Segmentos',
            'ru': 'Сегменты'
        },
        'download_ts': {
            'ar': 'تحميل TS',
            'de': 'TS herunterladen',
            'es': 'Descargar TS',
            'fr': 'Télécharger TS',
            'ja': 'TSをダウンロード',
            'ko': 'TS 다운로드',
            'pt': 'Baixar TS',
            'ru': 'Скачать TS'
        },
        'download_mp4': {
            'ar': 'تحميل MP4',
            'de': 'MP4 herunterladen',
            'es': 'Descargar MP4',
            'fr': 'Télécharger MP4',
            'ja': 'MP4をダウンロード',
            'ko': 'MP4 다운로드',
            'pt': 'Baixar MP4',
            'ru': 'Скачать MP4'
        },
        // A-B循环相关
        'abloop_enable': {
            'ar': 'تفعيل التكرار A-B',
            'de': 'A-B Schleife aktivieren',
            'es': 'Habilitar bucle A-B',
            'fr': 'Activer la boucle A-B',
            'ja': 'A-Bループを有効にする',
            'ko': 'A-B루프 활성화',
            'pt': 'Ativar loop A-B',
            'ru': 'Включить A-B цикл'
        },
        'abloop_a': {
            'ar': 'النقطة A',
            'de': 'Punkt A',
            'es': 'Punto A',
            'fr': 'Point A',
            'ja': 'Aポイント',
            'ko': 'A지점',
            'pt': 'Ponto A',
            'ru': 'Точка A'
        },
        'abloop_b': {
            'ar': 'النقطة B',
            'de': 'Punkt B',
            'es': 'Punto B',
            'fr': 'Point B',
            'ja': 'Bポイント',
            'ko': 'B지점',
            'pt': 'Ponto B',
            'ru': 'Точка B'
        },
        // 播放器相关
        'player_local_file': {
            'ar': 'الملف المحلي',
            'de': 'Lokale Datei',
            'es': 'Archivo local',
            'fr': 'Fichier local',
            'ja': 'ローカルファイル',
            'ko': '로컬 파일',
            'pt': 'Arquivo local',
            'ru': 'Локальный файл'
        },
        'player_stream_url': {
            'ar': 'رابط البث',
            'de': 'Stream-URL',
            'es': 'URL de transmisión',
            'fr': 'URL de flux',
            'ja': 'ストリームURL',
            'ko': '스트림 URL',
            'pt': 'URL de stream',
            'ru': 'URL потока'
        },
        'player_enter_stream_url': {
            'ar': 'يرجى إدخال رابط البث',
            'de': 'Bitte geben Sie die Stream-URL ein',
            'es': 'Por favor ingrese la URL de transmisión',
            'fr': 'Veuillez saisir l\'URL du flux',
            'ja': 'ストリームURLを入力してください',
            'ko': '스트림 URL을 입력하세요',
            'pt': 'Por favor, insira a URL do stream',
            'ru': 'Пожалуйста, введите URL потока'
        },
        'player_upload_or_drag': {
            'ar': '+انقر للرفع أو اسحب',
            'de': '+Klicken zum Hochladen oder ziehen',
            'es': '+Clic para subir o arrastrar',
            'fr': '+Cliquer pour télécharger ou glisser',
            'ja': '+クリックでアップロードまたはドラッグ',
            'ko': '+업로드하려면 클릭하거나 드래그',
            'pt': '+Clique para fazer upload ou arrastar',
            'ru': '+Нажмите для загрузки или перетащите'
        },
        // Tab相关
        'tab_download': {
            'ar': 'تحميل',
            'de': 'Herunterladen',
            'es': 'Descargar',
            'fr': 'Télécharger',
            'ja': 'ダウンロード',
            'ko': '다운로드',
            'pt': 'Baixar',
            'ru': 'Скачать'
        },
        'tab_qr': {
            'ar': 'رمز QR',
            'de': 'QR-Code',
            'es': 'Código QR',
            'fr': 'Code QR',
            'ja': 'QRコード',
            'ko': 'QR코드',
            'pt': 'Código QR',
            'ru': 'QR-код'
        },
        'tab_player': {
            'ar': 'المشغل',
            'de': 'Player',
            'es': 'Reproductor',
            'fr': 'Lecteur',
            'ja': 'プレーヤー',
            'ko': '플레이어',
            'pt': 'Reprodutor',
            'ru': 'Плеер'
        },
        'tab_abloop': {
            'ar': 'تكرار A-B',
            'de': 'A-B Schleife',
            'es': 'Bucle A-B',
            'fr': 'Boucle A-B',
            'ja': 'A-Bループ',
            'ko': 'A-B루프',
            'pt': 'Loop A-B',
            'ru': 'A-B цикл'
        },
        'tab_vr': {
            'ar': 'الواقع الافتراضي',
            'de': 'VR',
            'es': 'RV',
            'fr': 'RV',
            'ja': 'VR',
            'ko': 'VR',
            'pt': 'RV',
            'ru': 'VR'
        },
        'tab_record': {
            'ar': 'تسجيل',
            'de': 'Aufnahme',
            'es': 'Grabar',
            'fr': 'Enregistrer',
            'ja': '録画',
            'ko': '녹화',
            'pt': 'Gravar',
            'ru': 'Запись'
        },
        // 用户中心相关
        'tips_user_center': {
            'ar': 'مركز المستخدم',
            'de': 'Benutzerzentrum',
            'es': 'Centro de usuario',
            'fr': 'Centre utilisateur',
            'ja': 'ユーザーセンター',
            'ko': '사용자 센터',
            'pt': 'Centro do usuário',
            'ru': 'Пользовательский центр'
        },
        'tips_login': {
            'ar': 'تسجيل الدخول',
            'de': 'Anmelden',
            'es': 'Iniciar sesión',
            'fr': 'Se connecter',
            'ja': 'ログイン',
            'ko': '로그인',
            'pt': 'Entrar',
            'ru': 'Войти'
        }
    };
    
    if (translations[key] && translations[key][locale]) {
        return translations[key][locale];
    }
    
    // 如果没有特定翻译，返回占位符
    return `[需要翻译] ${originalText}`;
}

// 主要逻辑
console.log('\n=== Locale Synchronization Report ===');

// 显示总结
const totalMissing = Object.values(results).reduce((sum, result) => sum + (result.total || 0), 0);
console.log(`\n📊 Summary:`);
console.log(`   Total missing translations: ${totalMissing}`);

// 询问是否更新文件
console.log('\n🔧 To update all locale files with missing keys, run:');
console.log('   node scripts/syncLocales.js --update');

// 如果有 --update 参数，则更新所有文件
if (process.argv.includes('--update')) {
    console.log('\n🚀 Updating locale files...');
    
    Object.keys(results).forEach(locale => {
        const result = results[locale];
        if (result.missing && result.missing.length > 0) {
            updateLocaleFile(locale, result.missing);
        }
    });
    
    console.log('\n✨ All locale files updated!');
}
