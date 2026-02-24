# CLAUDE.md

このファイルはClaude Codeがこのリポジトリで作業する際のガイドラインです。

## プロジェクト概要

- **サービス名**: Link（LINEライクなメッセージングアプリ）
- **ドメイン**: link.kkweb.io
- **フレームワーク**: Next.js 16 (App Router, Turbopack)
- **UI**: Tailwind CSS v4 + shadcn/ui
- **言語**: TypeScript (strict mode)
- **リンター/フォーマッター**: Biome
- **バックエンド**: Supabase (Auth, PostgreSQL, Realtime)
- **通話**: SkyWay (音声/ビデオ通話)
- **環境変数**: @t3-oss/env-nextjs（型安全）
- **デプロイ**: Vercel
- **パッケージマネージャー**: pnpm

## 開発コマンド

```bash
pnpm dev          # 開発サーバー起動
pnpm build        # プロダクションビルド（+ next-sitemap 自動実行）
pnpm start        # プロダクションサーバー起動
pnpm lint         # Biome によるリント
pnpm lint:fix     # Biome による自動修正
pnpm format       # Biome によるフォーマット
pnpm format:check # フォーマットチェック（CI用）
pnpm typecheck    # TypeScript 型チェック
pnpm secretlint   # シークレット検出
pnpm knip         # 未使用コード検出

# Supabase
pnpm db:start     # Supabaseローカル起動（Docker Desktop必要）
pnpm db:stop      # Supabaseローカル停止
pnpm db:reset     # DBリセット＋シード投入
pnpm db:types     # 型定義生成
```

## Supabase ローカル環境

### ポート設定

| サービス  | ポート |
| --------- | ------ |
| API       | 57421  |
| DB        | 57422  |
| Studio    | 57423  |
| Inbucket  | 57424  |
| Analytics | 57427  |

### セットアップ

```bash
# Docker Desktop起動後
pnpm db:start

# 環境変数を設定（.env.localにコピー）
# supabase startの出力からAPI URLとanon keyを取得
```

### Supabase Studio

- URL: http://localhost:57423
- ユーザー作成・データ確認はここで行う

## ディレクトリ構成

```
src/
├── app/
│   ├── layout.tsx            # ルートレイアウト (lang="ja")
│   ├── globals.css           # グローバルCSS (shadcnテーマ変数含む)
│   ├── (auth)/               # 未認証ルート
│   │   ├── login/            # ログインページ (Google OAuth)
│   │   └── auth/callback/    # OAuthコールバック
│   └── (authenticated)/      # 認証済みルート
│       ├── page.tsx          # ホーム (メッセージ一覧)
│       └── profile/          # プロフィール表示・編集
│           ├── _components/  # ページ固有コンポーネント
│           ├── actions.ts    # Server Actions
│           └── schema.ts     # Zodスキーマ
├── components/               # 共通コンポーネント
│   └── ui/                   # shadcn/ui (自動生成、編集禁止)
├── env.ts                    # 環境変数定義（型安全）
├── proxy.ts                  # ミドルウェア（認証セッション管理）
└── lib/
    ├── utils.ts              # cn()ヘルパー (shadcn)
    └── supabase/
        ├── client.ts         # ブラウザ用クライアント
        ├── server.ts         # サーバー用クライアント
        └── proxy.ts          # セッション更新（getClaims）
```

## Supabase クライアント

### サーバーコンポーネント / Server Actions

```typescript
import { createClient } from "@/lib/supabase/server";

const supabase = await createClient();
const { data } = await supabase.from("table").select();
```

### クライアントコンポーネント

```typescript
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();
```

### 認証チェック

サーバーサイドでは `getClaims()` を使用（`getUser()` や `getSession()` は使わない）:

```typescript
const { data } = await supabase.auth.getClaims();
const user = data?.claims;
// user.sub = ユーザーID (UUID)
```

## 認証フロー

- **認証方式**: Google OAuth のみ
- **ログイン**: `/login` → Google OAuth → `/auth/callback` → `/`
- **ログアウト**: `signOut()` Server Action → `/login`
- **セッション管理**: `src/proxy.ts` が全リクエストで `getClaims()` を実行
- **未認証時**: `/login` と `/auth/*` 以外は `/login` にリダイレクト

## データベース

### profiles テーブル

| カラム       | 型           | 説明                           |
| ------------ | ------------ | ------------------------------ |
| id           | UUID (PK/FK) | auth.users(id) への参照        |
| display_name | TEXT          | 表示名（Google名から自動設定） |
| avatar_url   | TEXT          | アバターURL（Google画像）     |
| created_at   | TIMESTAMPTZ  | 作成日時                       |
| updated_at   | TIMESTAMPTZ  | 更新日時（自動更新）           |

- `on_auth_user_created` トリガーで自動作成
- RLS: 認証済みユーザーは全参照可、更新は自分のみ

## 環境変数

`.env.local` に以下を設定（テンプレート: `.env.example`）:

```bash
SITE_URL=https://link.kkweb.io
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:57421
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-anon-key
```

環境変数は `src/env.ts` で型安全に管理。新しい環境変数を追加する際は `env.ts` と `.env.example` の両方を更新すること。

## コーディング規約

### 命名規則

- **ファイル名**: kebab-case または PascalCase（コンポーネント）
- **変数・関数**: camelCase
- **型・インターフェース**: PascalCase（`type` を使用、`interface` は使わない）
- **定数**: UPPER_SNAKE_CASE

### コンポーネント

- Props型は `ComponentNameProps` 形式で定義
- `src/components/ui/` は shadcn/ui で生成するため直接編集しない
- ページ固有のコンポーネントは `_components/` に配置

### インポート

- `@/` エイリアスを使用（`src/` を指す）
- 型のみのインポートは `import type` を使用（Biome の `useImportType` ルール）
- インポートは Biome により自動でソートされる

### 関数

- `_` で始まる引数は未使用として許容される

## Git フック

Lefthook により pre-commit で以下が実行されます：

- Biome（リント＆フォーマット＆自動修正）
- TypeScript 型チェック
- Secretlint（シークレット検出）

コミットメッセージは Conventional Commits 形式に従ってください：

```
feat: 新機能を追加
fix: バグ修正
docs: ドキュメントのみの変更
style: コードの意味に影響しない変更
refactor: バグ修正でも機能追加でもないコード変更
test: テストの追加・修正
chore: ビルドプロセスやツールの変更
```
