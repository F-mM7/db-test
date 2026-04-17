---
name: update-and-deploy
description: Wikiからポケモン・料理・食材データを取得してGitHub Pagesにデプロイ
allowed-tools:
  - "Bash(npm run fetch-data:*)"
  - "Bash(npm run fetch-recipe-data:*)"
  - "Bash(npm run fetch-ingredient-data:*)"
  - "Bash(npm run deploy:*)"
---

## Pokemon Sleep データ更新 & デプロイ

以下の手順を実行してください：

### 1. ポケモンデータ更新
`npm run fetch-data` を実行して、最新のWikiデータからポケモン食材データを取得・パースします。

### 2. 料理データ更新
`npm run fetch-recipe-data` を実行して、最新のWikiデータから料理レシピデータを取得・パースします。

### 3. 食材データ更新
`npm run fetch-ingredient-data` を実行して、最新のWikiデータから食材データ（基礎エナジー等）を取得・パースします。

### 4. デプロイ
`npm run deploy` を実行して、GitHub Pagesにデプロイします。

### 5. 結果報告
以下を報告してください：
- パースしたポケモン数
- パースした料理数（カテゴリ別の内訳も含む）
- パースした食材数
- デプロイの成否
