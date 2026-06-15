---
name: update-and-deploy
description: Wikiからポケモン・料理・食材データを取得してGitHub Pagesにデプロイ
allowed-tools:
  - "Bash(npm ci:*)"
  - "Bash(npm run fetch-data:*)"
  - "Bash(npm run fetch-recipe-data:*)"
  - "Bash(npm run fetch-ingredient-data:*)"
  - "Bash(npm run deploy:*)"
---

## Pokemon Sleep データ更新 & デプロイ

以下の手順を実行してください：

### 1. 依存パッケージの確認・インストール
`npm ci` を実行して、`package-lock.json` に基づき依存パッケージを揃えます。パース（cheerio）・ビルド（vite）・公開（gh-pages）はいずれも `node_modules` を必要とし、`node_modules` は Git 管理外（gitignore）のため、以降の手順を確実に遂行するための前提です。

### 2. ポケモンデータ更新
`npm run fetch-data` を実行して、最新のWikiデータからポケモン食材データを取得・パースします。

### 3. 料理データ更新
`npm run fetch-recipe-data` を実行して、最新のWikiデータから料理レシピデータを取得・パースします。

### 4. 食材データ更新
`npm run fetch-ingredient-data` を実行して、最新のWikiデータから食材データ（基礎エナジー等）を取得・パースします。

### 5. デプロイ
`npm run deploy` を実行して、GitHub Pagesにデプロイします。

### 6. 結果報告
以下を報告してください：
- パースしたポケモン数
- パースした料理数（カテゴリ別の内訳も含む）
- パースした食材数
- デプロイの成否
