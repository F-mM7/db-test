# Pokemon Sleep 食材別ポケモン検索アプリ

対話は日本語で行います。

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
/home/futa/db-test/
├── scripts/                    # データ処理スクリプト
│   ├── download-wiki.js       # Wiki HTML ダウンロード
│   ├── parse-wiki-data.js     # HTML → JSON パース (メイン処理)
│   └── analyze-table-structure.js # 開発用テーブル構造分析
│
├── src/                       # React アプリケーション
│   ├── components/           # UI コンポーネント
│   │   ├── IngredientFilter.jsx    # メインフィルタリング画面
│   │   ├── PokemonCard.jsx         # ポケモン表示カード
│   │   ├── IngredientButton.jsx    # 食材選択ボタン
│   │   ├── LoadingSpinner.jsx      # ローディング表示
│   │   ├── ErrorDisplay.jsx        # エラー表示
│   │   └── ErrorBoundary.jsx       # エラーバウンダリ
│   │
│   ├── hooks/                # カスタムフック
│   │   ├── usePokemonData.js       # データ取得ロジック
│   │   └── usePokemonFilter.js     # フィルタリングロジック
│   │
│   ├── utils/                # ユーティリティ
│   │   └── constants.js            # 共通定数定義
│   │
│   ├── App.jsx               # アプリケーションルート
│   └── main.jsx              # エントリーポイント
│
├── data/                     # データファイル
│   ├── wiki-raw.html         # ダウンロードしたWiki HTML
│   └── parse-summary.json    # パース結果サマリー
│
└── public/
    └── pokemon-data.json     # パース済みポケモンデータ (192体)
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
- **食材別検索**: 17種類の食材から選択
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
npm run fetch-data

# 個別実行
npm run download-wiki  # HTML ダウンロード
npm run parse-wiki     # JSON パース

# ビルド・デプロイ
npm run build
npm run deploy
```

## 設定情報

### 重要な設定
- **データURL**: `/db-test/pokemon-data.json`
- **対象パターン**: `['AAA', 'AAC', 'ABB']`
- **対象ポケモン**: 192体（C食材あり: 34セル, なし: 26セル）

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