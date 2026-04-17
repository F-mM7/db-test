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
│   ├── download-wiki.js              # ポケモン Wiki HTML ダウンロード
│   ├── parse-wiki-data.js            # ポケモン HTML → JSON パース
│   ├── download-recipe-wiki.js       # 料理 Wiki HTML ダウンロード
│   ├── parse-recipe-data.js          # 料理 HTML → JSON パース
│   ├── download-ingredient-wiki.js   # 食材 Wiki HTML ダウンロード
│   ├── parse-ingredient-data.js      # 食材 HTML → JSON パース (基礎エナジー含む)
│   └── analyze-table-structure.js    # 開発用テーブル構造分析
│
├── src/                       # React アプリケーション
│   ├── components/           # UI コンポーネント
│   │   ├── IngredientFilter.jsx    # メインフィルタリング画面
│   │   ├── PokemonCard.jsx         # ポケモン表示カード
│   │   ├── IngredientButton.jsx    # 食材選択ボタン
│   │   ├── RecipeCalculator.jsx    # 料理カリキュレーター画面
│   │   ├── LoadingSpinner.jsx      # ローディング表示
│   │   ├── ErrorDisplay.jsx        # エラー表示
│   │   └── ErrorBoundary.jsx       # エラーバウンダリ
│   │
│   ├── hooks/                # カスタムフック
│   │   ├── usePokemonData.js       # ポケモンデータ取得
│   │   ├── usePokemonFilter.js     # フィルタリングロジック
│   │   ├── useRecipeData.js        # 料理データ取得
│   │   ├── useIngredientData.js    # 食材データ取得 (基礎エナジー)
│   │   └── useRecipeCalculator.js  # 集計・並び替えロジック
│   │
│   ├── utils/                # ユーティリティ
│   │   └── constants.js            # 共通定数定義
│   │
│   ├── App.jsx               # アプリケーションルート
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

### 3. パフォーマンス最適化
- **メモ化**: React.memo, useMemo, useCallback 活用
- **カスタムフック**: ロジック分離とコード再利用
- **コンポーネント分割**: 責任範囲の明確化

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

## 今後の機能追加予定

### 料理必要食材カリキュレーター
ユーザーが作りたい料理と回数を指定すると、必要な食材の合計数を算出する機能。

- **入力例**: 料理Aを3回、料理Bを5回
- **出力例**: 食材Xは120個、食材Yは90個、食材Zは60個...
- **必要なデータ**: 料理ごとの必要食材DB（料理名・必要食材・個数）
- **実装方針**:
  - `public/` に料理データJSON を追加
  - 料理選択UI + 回数入力フォーム
  - 食材合計の集計・表示コンポーネント

## 最近の主要変更

### リファクタリング完了 (2025-07)
- ✅ **クラスベース設計**: PokemonWikiParser クラス導入
- ✅ **カスタムフック**: データ取得・フィルタリングロジック分離
- ✅ **コンポーネント分割**: UI と ロジックの責任分離
- ✅ **定数管理**: 共通設定の一元化
- ✅ **パフォーマンス**: 不要な再レンダリング削減

### データ最適化
- ✅ **不要パターン削除**: AA, AB, AAB, ABA, ABC → 5パターン削除
- ✅ **不要フィールド削除**: levels, totalValue → データサイズ削減
- ✅ **セル位置修正**: AACパターン(16列), ABBパターン(24/21列)

## トラブルシューティング

### よくある問題
1. **データが表示されない** → `npm run fetch-data` でデータ更新
2. **パースエラー** → Wiki HTML構造の変更可能性
3. **セル位置エラー** → `analyze-table-structure.js` で構造確認

### 開発時の注意点
- パターン変更時は `constants.js` を更新
- 新しいポケモン追加時は最小セル数確認
- デプロイ前に `npm run build` でエラーチェック