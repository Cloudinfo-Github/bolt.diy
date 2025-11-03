export interface DesignScheme {
  palette: { [key: string]: string }; // Changed from string[] to object
  features: string[];
  font: string[];
}

export const defaultDesignScheme: DesignScheme = {
  palette: {
    primary: '#9E7FFF',
    secondary: '#38bdf8',
    accent: '#f472b6',
    background: '#171717',
    surface: '#262626',
    text: '#FFFFFF',
    textSecondary: '#A3A3A3',
    border: '#2F2F2F',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
  },
  features: ['rounded'],
  font: ['sans-serif'],
};

export const paletteRoles = [
  {
    key: 'primary',
    label: '主要',
    description: '主要品牌色 - 用於主要按鈕、活動連結和關鍵互動元素',
  },
  {
    key: 'secondary',
    label: '次要',
    description: '輔助品牌色 - 用於次要按鈕、非活動狀態和補充元素',
  },
  {
    key: 'accent',
    label: '強調',
    description: '突顯色 - 用於徽章、通知、焦點狀態和號召性用語元素',
  },
  {
    key: 'background',
    label: '背景',
    description: '頁面背景 - 用於所有內容後方的主要應用程式/網站背景',
  },
  {
    key: 'surface',
    label: '表面',
    description: '提升的內容區域 - 用於卡片、模態框、下拉選單和位於背景之上的面板',
  },
  { key: 'text', label: '文字', description: '主要文字 - 用於標題、正文和主要可讀內容' },
  {
    key: 'textSecondary',
    label: '次要文字',
    description: '次要文字 - 用於說明文字、佔位符、時間戳記和不太重要的資訊',
  },
  {
    key: 'border',
    label: '邊框',
    description: '分隔線 - 用於輸入框邊框、分隔線、表格線和元素輪廓',
  },
  {
    key: 'success',
    label: '成功',
    description: '正面回饋 - 用於成功訊息、完成狀態和正面指示器',
  },
  {
    key: 'warning',
    label: '警告',
    description: '注意警示 - 用於警告訊息、待處理狀態和需要注意的指示器',
  },
  {
    key: 'error',
    label: '錯誤',
    description: '錯誤狀態 - 用於錯誤訊息、失敗狀態和破壞性操作指示器',
  },
];

export const designFeatures = [
  { key: 'rounded', label: '圓角' },
  { key: 'border', label: '細邊框' },
  { key: 'gradient', label: '漸層強調' },
  { key: 'shadow', label: '柔和陰影' },
  { key: 'frosted-glass', label: '毛玻璃' },
];

export const designFonts = [
  { key: 'sans-serif', label: '無襯線體', preview: 'Aa' },
  { key: 'serif', label: '襯線體', preview: 'Aa' },
  { key: 'monospace', label: '等寬字體', preview: 'Aa' },
  { key: 'cursive', label: '手寫體', preview: 'Aa' },
  { key: 'fantasy', label: '藝術字體', preview: 'Aa' },
];
