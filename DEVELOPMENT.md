# 開発ガイド

## 開発環境のセットアップ

### 必要な環境

- Node.js 20以上（推奨）またはNode.js 18.x + Vite 5.x

### インストール

```bash
# リポジトリのクローン
git clone [repository-url]
cd db-test

# 依存関係のインストール
npm install

# Node.js 20を使用する場合（推奨）
nvm use 20
```

### 開発サーバーの起動

```bash
npm run dev
```

http://localhost:5173/db-test/ でアプリケーションが開きます。

## アーキテクチャ概要

### プロジェクト構成

```
src/
├── components/           # UI コンポーネント
│   ├── IngredientFilter.jsx    # メインフィルタリング画面
│   ├── PokemonCard.jsx         # ポケモン表示カード
│   ├── IngredientButton.jsx    # 食材選択ボタン
│   ├── LoadingSpinner.jsx      # ローディング表示
│   └── ErrorDisplay.jsx        # エラー表示
├── hooks/               # カスタムフック
│   ├── usePokemonData.js       # データ取得ロジック
│   └── usePokemonFilter.js     # フィルタリングロジック
└── utils/               # ユーティリティ
    └── constants.js            # 共通定数定義
```

### データフロー

1. **usePokemonData**: JSONファイルからデータ取得
2. **usePokemonFilter**: 食材による絞り込みと効率順ソート
3. **IngredientFilter**: UIコンポーネントの統合・表示

## データの更新方法

このアプリケーションは静的なJSONファイルからデータを読み込みます。GitHub Pagesで動作させるため、データは事前に取得して保存する必要があります。

### 自動更新手順

1. Wikiから最新データを取得：
```bash
npm run fetch-data
```

このコマンドは2段階で実行されます：
- `npm run download-wiki` - WikiのHTMLを`data/wiki-raw.html`に保存
- `npm run parse-wiki` - HTMLをパースして`public/pokemon-data.json`を生成

2. 生成されたデータを確認：
```bash
# JSONデータを確認
cat public/pokemon-data.json

# パース結果のサマリーを確認
cat data/parse-summary.json
```

3. データをコミットしてプッシュ：
```bash
git add public/pokemon-data.json
git commit -m "Update pokemon data from wiki"
git push
```

### 個別実行

必要に応じて各ステップを個別に実行できます：

```bash
# Step 1: WikiのHTMLをダウンロード
npm run download-wiki

# Step 2: HTMLをパースしてJSONを生成
npm run parse-wiki

# 開発用: テーブル構造を分析（デバッグ時）
node scripts/analyze-table-structure.js
```

### データ形式（最新版）

```json
[
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
]
```

### パターンの説明

- **AAA**: 同一食材3個（Lv.60の最大効率パターン）
- **AAC**: A食材2個 + C食材1個
- **ABB**: A食材1個 + B食材2個

### パース処理の詳細

#### セル位置マッピング

**C食材ありポケモン (34セル)**:
- AAA: セル 10-11 (食材, 値)
- AAC: セル 16-19 (A食材, A値, C食材, C値)  
- ABB: セル 24-27 (A食材, A値, B食材, B値)

**C食材なしポケモン (26セル)**:
- AAA: セル 10-11 (食材, 値)
- ABB: セル 21-24 (A食材, A値, B食材, B値)

## 開発用コマンド

```bash
# 開発サーバー起動
npm run dev

# データ更新
npm run fetch-data

# Linting
npm run lint

# ビルド
npm run build

# デプロイ
npm run deploy
```

## デプロイ

### GitHub Pagesへのデプロイ

```bash
npm run deploy
```

このコマンドは：
1. プロダクションビルドを作成 (`npm run build`)
2. `dist`ディレクトリの内容をGitHub Pagesにデプロイ

### 注意事項

- `vite.config.js`の`base`設定がリポジトリ名と一致していることを確認
- GitHub Pagesの設定で、ソースを`gh-pages`ブランチに設定

## 技術スタック

- **Frontend**: React 19 with Hooks
- **Build Tool**: Vite 5
- **CSS**: Modern CSS with CSS Grid, Flexbox, Animations
- **Development**: Node.js 20+, ESLint, Hot Module Replacement
- **Deployment**: GitHub Pages with gh-pages
- **Data Processing**: Cheerio for HTML parsing, クラスベースParser実装
- **Performance**: React.memo, useMemo, useCallback, カスタムフック分離

### アーキテクチャの特徴

- **カスタムフック**: データ取得・フィルタリングロジックを分離
- **コンポーネント分割**: 単一責任の原則に基づく設計
- **定数管理**: `src/utils/constants.js` で一元管理
- **クラスベース Parser**: `PokemonWikiParser` による構造化されたパース処理

## トラブルシューティング

### よくある問題

1. **データが表示されない**
   ```bash
   npm run fetch-data
   ```

2. **パースエラー**  
   Wiki HTML構造の変更が原因の可能性
   ```bash
   node scripts/analyze-table-structure.js
   ```

3. **セル位置エラー**
   `scripts/parse-wiki-data.js` の `CELL_PATTERNS` 設定を確認

### 開発時の注意点

- パターン変更時は `src/utils/constants.js` を更新
- 新しいポケモン追加時は最小セル数を確認
- デプロイ前に `npm run build` でエラーチェック

## 制限事項

- CORS制限のため、ブラウザから直接外部サイトのデータを取得することはできません
- データ更新は手動で行う必要があります
- 将来的にはバックエンドAPIの実装を検討