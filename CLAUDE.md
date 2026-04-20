# Pokemon Sleep 食材別ポケモン検索アプリ

## プロジェクト概要

ポケモンスリープで各ポケモンが獲得できる食材を検索・比較できるWebアプリケーションです。
Wiki データを自動取得・解析し、食材ごとにポケモンを効率順でソートして表示します。

## 技術スタック

- **フロントエンド**: React 19, Vite
- **データ取得**: Cheerio (HTMLパース), Node.js スクリプト
- **デプロイ**: GitHub Pages
- **開発ツール**: ESLint, npm scripts

## アーキテクチャ構成

### データフロー
1. **データ取得** (`npm run download-wiki`) → Wiki HTMLダウンロード
2. **データパース** (`npm run parse-wiki`) → JSON形式に変換
3. **アプリ表示** → React フロントエンドで検索・フィルタリング

### ディレクトリ構成

```
/home/futa/pokesleep-kitchen/
├── scripts/                          # データ処理スクリプト
│   ├── download.js                   # Wiki HTML ダウンロード (pokemon/recipe/ingredient 対応)
│   ├── parse-wiki-data.js            # ポケモン HTML → JSON パース
│   ├── parse-recipe-data.js          # 料理 HTML → JSON パース
│   ├── parse-ingredient-data.js      # 食材 HTML → JSON パース (基礎エナジー含む)
│   ├── analyze-table-structure.js    # 開発用テーブル構造分析
│   └── lib/
│       └── io.js                     # 共通 I/O ヘルパー (loadHtml / writeJson)
│
├── src/                       # React アプリケーション
│   ├── components/           # UI コンポーネント
│   │   ├── IngredientFilter.jsx    # 食材検索画面（親）
│   │   ├── PokemonCard.jsx         # ポケモン表示カード
│   │   ├── IngredientButton.jsx    # 食材選択ボタン
│   │   ├── IngredientIcon.jsx      # 食材アイコン + 数量表示（汎用）
│   │   ├── RecipeCalculator.jsx    # 料理カリキュレーター画面（親）
│   │   ├── RecipeCalculator/       # RecipeCalculator のサブコンポーネント
│   │   │   ├── FilterBar.jsx           # 鍋サイズ調整
│   │   │   ├── CategoryTabs.jsx        # カテゴリタブ + 集計タブ
│   │   │   ├── RecipeRow.jsx           # 料理1行（list / summary 共用）
│   │   │   ├── RecipeList.jsx          # 料理一覧
│   │   │   ├── SummaryList.jsx         # 集計タブの選択中料理一覧
│   │   │   ├── TotalResults.jsx        # 必要食材合計
│   │   │   └── MissingIngredients.jsx  # 集計に含まれない食材
│   │   ├── AsyncBoundary.jsx       # loading / error ハンドラ
│   │   ├── LoadingSpinner.jsx      # ローディング表示
│   │   ├── ErrorDisplay.jsx        # エラー表示
│   │   └── ErrorBoundary.jsx       # エラーバウンダリ
│   │
│   ├── hooks/                # カスタムフック
│   │   ├── useFetchJson.js         # 汎用 JSON 取得（旧 usePokemon/Recipe/Ingredient データを統合）
│   │   ├── usePokemonFilter.js     # 食材選択・フィルタ・効率順ソート
│   │   └── useRecipeCalculator.js  # 料理選択・鍋サイズ・必要食材集計
│   │
│   ├── styles/               # 汎用コンポーネント用 CSS
│   │   └── components.css          # .badge / .tab / .btn / .icon-btn / .loading / .error-* 等
│   │
│   ├── utils/                # ユーティリティ
│   │   └── constants.js            # 共通定数 + ingredientIconUrl()
│   │
│   ├── App.jsx               # アプリケーションルート（タブ切替）
│   ├── App.css               # ルート + .app-nav + .tab-panel
│   ├── index.css             # デザイントークン（CSS 変数） + .page-container
│   └── main.jsx              # エントリーポイント
│
├── data/                            # データファイル (gitignore候補)
│   ├── wiki-raw.html                # ダウンロードしたポケモン Wiki HTML
│   ├── recipe-wiki-raw.html         # ダウンロードした料理 Wiki HTML
│   ├── ingredient-wiki-raw.html     # ダウンロードした食材 Wiki HTML
│   └── *-summary.json               # 各パース結果サマリー
│
└── public/
    ├── pokemon-data.json            # パース済みポケモンデータ
    ├── recipe-data.json             # パース済み料理データ
    └── ingredient-data.json         # パース済み食材データ (基礎エナジー含む)
```

## データ構造

### ポケモンデータ形式
```json
{
  "id": 1,
  "name": "フシギダネ",
  "ingredientPatterns": {
    "AAA": {
      "ingredients": ["あまいミツ", "あまいミツ", "あまいミツ"],
      "individualValues": { "あまいミツ": 41.2 }
    },
    "AAC": {
      "ingredients": ["あまいミツ", "あまいミツ", "ほっこりポテト"],
      "individualValues": { "あまいミツ": 20.6, "ほっこりポテト": 17.6 }
    },
    "ABB": {
      "ingredients": ["あまいミツ", "あんみんトマト", "あんみんトマト"],
      "individualValues": { "あまいミツ": 5.9, "あんみんトマト": 32.3 }
    }
  }
}
```

### パターン定義
- **AAA**: 同一食材3個（Lv.60想定）
- **AAC**: A食材2個 + C食材1個
- **ABB**: A食材1個 + B食材2個

## 主要機能

### 1. データ管理システム
- **自動データ更新**: `npm run fetch-data` で最新Wiki データを取得
- **セル位置自動検出**: HTMLテーブル構造の変化に対応
- **エラーハンドリング**: 不正データの自動スキップ

### 2. 検索・フィルタリング
- **食材別検索**: 食材から選択
- **効率順ソート**: 選択した食材の獲得効率でソート
- **リアルタイム検索**: 遅延なしの即座フィルタリング

### 3. 料理カリキュレーター
- **鍋サイズ調整**: 12〜81 を 3 刻みで増減
- **カテゴリタブ**: 料理を `category` で分けて表示、最右に「集計」タブ
- **必要食材集計**: 選択した料理 × 回数から食材合計を算出
- **集計にない食材**: 選択中の料理に含まれない食材を基礎エナジー降順で表示
- **タブ切替時の状態保持**: 食材検索／料理カリキュレーターは `display` 切替で両方 mount 維持

### 4. パフォーマンス最適化
- **メモ化**: 重い計算は `useMemo`、リスト要素は `React.memo` で再レンダリング抑制
- **カスタムフック**: データ取得 (`useFetchJson`)・状態管理を集約
- **コンポーネント分割**: 画面ごとにサブコンポーネント化（`RecipeCalculator/` 配下）

## 開発用コマンド

```bash
# 開発サーバー起動
npm run dev

# Wiki データ更新
npm run fetch-data              # ポケモン食材獲得データ
npm run fetch-recipe-data       # 料理レシピデータ
npm run fetch-ingredient-data   # 食材データ (基礎エナジー含む)

# 個別実行
npm run download-wiki              # ポケモン HTML ダウンロード
npm run parse-wiki                 # ポケモン JSON パース
npm run download-recipe-wiki       # 料理 HTML ダウンロード
npm run parse-recipe               # 料理 JSON パース
npm run download-ingredient-wiki   # 食材 HTML ダウンロード
npm run parse-ingredient           # 食材 JSON パース

# ビルド・デプロイ
npm run build
npm run deploy
```

## 設定情報

### 重要な設定
- **データURL**:
  - `/pokesleep-kitchen/pokemon-data.json`
  - `/pokesleep-kitchen/recipe-data.json`
  - `/pokesleep-kitchen/ingredient-data.json`
- **対象パターン**: `['AAA', 'AAC', 'ABB']`
- **対象ポケモン**: C食材あり: 34セル, なし: 26セル
- **食材データ取得元**: https://wikiwiki.jp/poke_sleep/食材/食材の一覧 （`基礎エナジー` を含むテーブルを自動選別）

### セル位置マッピング
```javascript
// C食材ありポケモン (34セル)
CELL_PATTERNS.WITH_C_INGREDIENT = {
  AAA: { start: 10, cells: 2 },
  AAC: { start: 16, cells: 4 },
  ABB: { start: 24, cells: 4 }
}

// C食材なしポケモン (26セル)  
CELL_PATTERNS.WITHOUT_C_INGREDIENT = {
  AAA: { start: 10, cells: 2 },
  ABB: { start: 21, cells: 4 }
}
```

## トラブルシューティング

### よくある問題
1. **データが表示されない** → `npm run fetch-data` でデータ更新
2. **パースエラー** → Wiki HTML構造の変更可能性
3. **セル位置エラー** → `analyze-table-structure.js` で構造確認

### 開発時の注意点
- パターン変更時は `constants.js` を更新
- 新しいポケモン追加時は最小セル数確認
- デプロイ前に `npm run build` でエラーチェック