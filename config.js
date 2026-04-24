/**
 * config.js
 * 資格ダッシュボード 分類設定ファイル
 *
 * ここを編集することでカテゴリ・難易度・年齢層の定義を変更できます。
 * app.js / index.html は触らなくてOKです。
 */

// =====================================================
// 1. CSVカラム名マッピング
//    実際のCSVヘッダー名に合わせて変更してください
// =====================================================
export const CSV_COLUMNS = {
  memberId:    '社員番号',
  certName:    '資格名',
  acquiredDate:'取得年月日',   // YYYY/MM/DD 形式
  gender:      '(性別)',
  age:         '(年齢)',
  yearsOfService: '(勤続年数)', // "28年0ヶ月" 形式 → 先頭の数字を使用
  joinDate:    '(入社日)',
  birthDate:   '(生年月日)',   // YYYY/MM/DD 形式 — 取得時点の年齢層計算に使用
};

// =====================================================
// 2. 資格カテゴリ分類ルール
//    namePatterns: 資格名に含まれるキーワード（部分一致・大文字小文字無視）
//    順番が大事 — 上から順にマッチングするので、より具体的なものを上に書く
// =====================================================
export const CERT_CATEGORIES = [
  {
    key: 'cloud',
    label: 'クラウド',
    color: '#7F77DD',
    namePatterns: ['AWS', 'Azure', 'GCP', 'Google Cloud', 'クラウド'],
  },
  {
    key: 'security',
    label: 'セキュリティ',
    color: '#D85A30',
    namePatterns: ['セキュリティ', '情報処理安全確保', 'CISSP', 'セキュスペ'],
  },
  {
    key: 'programming',
    label: 'プログラミング',
    color: '#BA7517',
    namePatterns: ['Java', 'Python', 'HTML', 'Oracle認定', 'Oracle認定Java', 'PHP', 'Ruby', 'JavaScript'],
  },
  {
    key: 'it',
    label: 'IT基盤',
    color: '#378ADD',
    namePatterns: ['情報処理技術者', '基本情報', '応用情報', 'データベース', 'ネットワーク', 'システム', 'ITパスポート', 'Oracle DB', 'HTML5'],
  },
  {
    key: 'finance',
    label: '金融・FP',
    color: '#1D9E75',
    namePatterns: ['FP', 'ファイナンシャル', '銀行業務', '証券', '保険', '年金', '金融'],
  },
  {
    key: 'other',
    label: 'その他',
    color: '#888780',
    namePatterns: [], // 上記どれにも当てはまらない場合
  },
];

// =====================================================
// 3. 難易度分類ルール（カテゴリごとに設定）
//    levels: 低い順に並べる（グラフの積み上げ順になります）
//    namePatterns に含まれるキーワードで判定
// =====================================================
export const DIFFICULTY_CONFIG = {
  it: {
    levels: [
      { key: 'beginner', label: '初級',  color: '#B5D4F4', namePatterns: ['基本情報', 'ITパスポート', '情報処理技術者試験：基本'] },
      { key: 'middle',   label: '中級',  color: '#378ADD', namePatterns: ['応用情報', '情報処理技術者試験：応用'] },
      { key: 'advanced', label: '上級',  color: '#0C447C', namePatterns: ['データベーススペシャリスト', 'ネットワークスペシャリスト', '情報処理安全確保', 'システムアーキテクト', 'ITストラテジスト', 'プロジェクトマネージャ'] },
    ],
  },
  cloud: {
    levels: [
      { key: 'beginner', label: '入門（CP等）', color: '#CECBF6', namePatterns: ['クラウドプラクティショナー', 'Cloud Practitioner', 'AZ-900'] },
      { key: 'middle',   label: '中級（SAA等）',color: '#7F77DD', namePatterns: ['Solutions Architect', 'SAA', 'Developer', 'SysOps', 'AZ-104'] },
      { key: 'advanced', label: '上級（専門家）',color: '#3C3489', namePatterns: ['Professional', 'Specialty', 'Expert'] },
    ],
  },
  finance: {
    levels: [
      { key: 'beginner', label: 'FP3級・基礎', color: '#9FE1CB', namePatterns: ['FP3級', 'FP3', '3級', '証券3', '証券4', '保険販売3'] },
      { key: 'middle',   label: 'FP2級・中級', color: '#1D9E75', namePatterns: ['FP2級', 'FP2', '2級', '年金アドバイザー3'] },
      { key: 'advanced', label: 'FP1級・CFP', color: '#085041', namePatterns: ['FP1級', 'FP1', '1級', 'CFP', 'AFP'] },
    ],
  },
  programming: {
    levels: [
      { key: 'beginner', label: 'Silver・基礎', color: '#FAC775', namePatterns: ['Silver', 'silver', 'Bronze', 'bronze', '基礎', 'Python 3 エンジニア認定基礎'] },
      { key: 'middle',   label: 'Gold・応用',   color: '#BA7517', namePatterns: ['Gold', 'gold', '応用', 'データ分析'] },
      { key: 'advanced', label: 'Platinum・上位',color: '#633806', namePatterns: ['Platinum', 'platinum', 'Expert', 'expert'] },
    ],
  },
  security: {
    levels: [
      { key: 'beginner', label: '初級',  color: '#F0997B', namePatterns: ['セキュリティマネジメント'] },
      { key: 'middle',   label: '中級',  color: '#D85A30', namePatterns: ['情報処理安全確保支援士'] },
      { key: 'advanced', label: '上級',  color: '#712B13', namePatterns: ['CISSP', 'CISM'] },
    ],
  },
  other: {
    levels: [
      { key: 'other', label: 'その他', color: '#D3D1C7', namePatterns: [] },
    ],
  },
};

// =====================================================
// 4. 年齢層定義
//    「資格取得時点の年齢」で分類します（生年月日 + 取得年月日から算出）
//    ※ 現在の年齢・勤続年数ではないため、
//      40代のベテランが若手時代に取った資格は「若手」としてカウントされます
// =====================================================
export const AGE_GROUPS = [
  { key: 'junior', label: '20代（若手）',   color: '#378ADD', minAge: 20, maxAge: 29 },
  { key: 'middle', label: '30代（中堅）',   color: '#1D9E75', minAge: 30, maxAge: 39 },
  { key: 'senior', label: '40代以上',       color: '#888780', minAge: 40, maxAge: 999 },
];

// =====================================================
// 5. 表示設定
// =====================================================
export const DISPLAY_CONFIG = {
  title: '資格取得状況ダッシュボード',
  organization: 'SS7部',
  // グラフに表示する年度範囲（nullで自動）
  yearRange: { start: null, end: null },
  // 上位資格とみなすdifficulty key（ステップ分析で使用）
  advancedLevelKey: 'advanced',
};
