---
allowed-tools: Bash(npm run fetch-data:*), Bash(npm run fetch-recipe-data:*), Bash(npm run deploy:*)
description: Wikiからポケモン・料理データを取得してGitHub Pagesにデプロイ
---

## Pokemon Sleep データ更新 & デプロイ

以下の手順を実行してください：

### 1. ポケモンデータ更新
`npm run fetch-data` を実行して、最新のWikiデータからポケモン食材データを取得・パースします。

### 2. 料理データ更新
`npm run fetch-recipe-data` を実行して、最新のWikiデータから料理レシピデータを取得・パースします。

### 3. デプロイ
`npm run deploy` を実行して、GitHub Pagesにデプロイします。

### 4. 結果報告
以下を報告してください：
- パースしたポケモン数
- パースした料理数（カテゴリ別の内訳も含む）
- デプロイの成否
