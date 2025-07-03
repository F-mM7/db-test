# ポケモンスリープ 食材獲得数データベース

ポケモンスリープの食材獲得数推定値を食材別に検索できるWebアプリケーションです。

## 機能

- **食材別検索**: 食材ボタンをクリックして、その食材を獲得できるポケモンを検索
- **最大値表示**: 各ポケモンの選択食材最大獲得量を表示（A/B/C食材タイプ付き）
- **食材タイプ表示**: ポケモンのA/B/C食材を明確に表示
- **効率ソート**: 選択した食材の最大値でポケモンを自動ソート
- **レスポンシブデザイン**: デスクトップ・タブレット・スマートフォンに対応
- **エラーハンドリング**: 堅牢なエラー処理とユーザーフレンドリーなエラー表示
- **パフォーマンス最適化**: React.memo、useMemo、useCallbackを活用した高速レンダリング
- **モダンUI**: GitHub Darkテーマをベースとしたダークモードデザイン
- **GitHub Pagesホスティング**: 静的サイトホスティング対応

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
```

### 注意事項

- `data/`ディレクトリはGitにコミットされません（生HTML保存用）
- パース処理が失敗した場合、サンプルデータにフォールバックします
- 手動でのデータ修正が必要な場合は、`public/pokemon-data.json`を直接編集してください
- HTMLの保存により、オフラインでのパース調整・デバッグが可能です

### データ形式

```json
[
  {
    "id": 1,
    "name": "ポケモン名",
    "levels": {
      "1": { "value": 1.5 },
      "30": { "value": 3.2 },
      "60": { "value": 5.8 }
    },
    "ingredientPatterns": {
      "AA": { 
        "ingredients": ["食材1", "食材1"], 
        "values": { "1": 2.1, "30": 4.5, "60": 8.2 } 
      },
      "AB": { 
        "ingredients": ["食材1", "食材2"], 
        "values": { "1": 1.8, "30": 3.9, "60": 7.1 } 
      }
    }
  }
]
```

## デプロイ

### GitHub Pagesへのデプロイ

```bash
npm run deploy
```

このコマンドは：
1. プロダクションビルドを作成
2. `dist`ディレクトリの内容をGitHub Pagesにデプロイ

### 注意事項

- `vite.config.js`の`base`設定がリポジトリ名と一致していることを確認
- GitHub Pagesの設定で、ソースを`gh-pages`ブランチに設定

## 技術スタック

- **Frontend**: React 19 with Hooks (useState, useEffect, useMemo, useCallback)
- **Build Tool**: Vite 5
- **CSS**: Modern CSS with CSS Grid, Flexbox, Animations
- **Development**: Node.js 20+, ESLint, Hot Module Replacement
- **Deployment**: GitHub Pages with gh-pages
- **Data Processing**: Cheerio for HTML parsing, Node.js fs module
- **Performance**: React.memo, component memoization, optimized re-renders

## 制限事項

- CORS制限のため、ブラウザから直接外部サイトのデータを取得することはできません
- データ更新は手動で行う必要があります
- 将来的にはバックエンドAPIの実装を検討

## ライセンス

このプロジェクトはプライベートリポジトリです。