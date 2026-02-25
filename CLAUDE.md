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
│   ├── (authenticated)/      # 認証済みルート (ボトムナビ付き)
│   │   ├── layout.tsx        # ボトムナビバー配置
│   │   ├── _components/      # BottomNav
│   │   ├── page.tsx          # ホーム (会話一覧)
│   │   ├── friends/          # フレンド一覧・検索・リクエスト
│   │   └── profile/          # プロフィール表示・編集
│   └── (chat)/               # チャットルート (フルスクリーン)
│       └── chat/[conversationId]/  # リアルタイムチャット + 通話
├── components/               # 共通コンポーネント
│   ├── theme-provider.tsx    # next-themes ダークモード対応
│   ├── theme-toggle.tsx      # テーマ切替UI（ライト/ダーク/自動）
│   └── ui/                   # shadcn/ui (自動生成、編集禁止)
├── env.ts                    # 環境変数定義（型安全）
├── proxy.ts                  # ミドルウェア（認証セッション管理）
└── lib/
    ├── utils.ts              # cn()ヘルパー (shadcn)
    ├── call/
    │   ├── call-context.tsx   # 通話状態管理 Context (Realtime監視)
    │   ├── call-overlay.tsx   # フルスクリーン通話UI (SkyWay P2P)
    │   └── incoming-call-dialog.tsx  # 着信ダイアログ
    ├── push/
    │   ├── send.ts            # web-push 送信ユーティリティ
    │   ├── actions.ts         # プッシュ購読管理 Server Actions
    │   └── push-subscription-manager.tsx  # クライアント側購読登録
    ├── pwa/
    │   ├── pwa-install-button.tsx  # PWAインストールボタン (use-pwa)
    │   └── pwa-prompt.tsx          # iOS PWAインストールプロンプト
    └── supabase/
        ├── client.ts         # ブラウザ用クライアント (Database型付き)
        ├── server.ts         # サーバー用クライアント (Database型付き)
        ├── database.types.ts # 自動生成DB型定義
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
| link_id      | TEXT (UNIQUE) | ユーザー検索用ID              |
| created_at   | TIMESTAMPTZ  | 作成日時                       |
| updated_at   | TIMESTAMPTZ  | 更新日時（自動更新）           |

- `on_auth_user_created` トリガーで自動作成（link_id はUUID先頭8文字）
- RLS: 認証済みユーザーは全参照可、更新は自分のみ

### friend_requests テーブル

| カラム      | 型           | 説明                              |
| ----------- | ------------ | --------------------------------- |
| id          | UUID (PK)    | リクエストID                      |
| sender_id   | UUID (FK)    | 送信者 → profiles(id)             |
| receiver_id | UUID (FK)    | 受信者 → profiles(id)             |
| status      | TEXT          | pending / accepted / rejected     |
| created_at  | TIMESTAMPTZ  | 作成日時                          |
| updated_at  | TIMESTAMPTZ  | 更新日時                          |

- UNIQUE(sender_id, receiver_id), CHECK(sender_id <> receiver_id)
- RLS: 自分の送受信のみ参照、自分からのみ送信、受信者のみ更新
- Realtime 有効

### conversations テーブル

| カラム     | 型          | 説明         |
| ---------- | ----------- | ------------ |
| id         | UUID (PK)   | 会話ID       |
| created_at | TIMESTAMPTZ | 作成日時     |
| updated_at | TIMESTAMPTZ | 更新日時     |

- RLS: 参加者のみ参照・更新可

### conversation_participants テーブル

| カラム          | 型        | 説明                  |
| --------------- | --------- | --------------------- |
| conversation_id | UUID (FK) | → conversations(id)   |
| user_id         | UUID (FK) | → profiles(id)        |

- 複合PK (conversation_id, user_id)
- RLS: 同じ会話の参加者のみ参照可

### messages テーブル

| カラム          | 型          | 説明                  |
| --------------- | ----------- | --------------------- |
| id              | UUID (PK)   | メッセージID          |
| conversation_id | UUID (FK)   | → conversations(id)   |
| sender_id       | UUID (FK)   | → profiles(id)        |
| content         | TEXT        | メッセージ本文        |
| read_at         | TIMESTAMPTZ | 既読日時（NULL=未読） |
| created_at      | TIMESTAMPTZ | 送信日時              |

- RLS: 参加者のみ参照可、自分のみ送信可、自分宛てメッセージの read_at のみ更新可
- Realtime 有効（INSERT + UPDATE）
- `get_unread_counts()` RPC: 全会話の未読数を一括取得

### call_sessions テーブル

| カラム          | 型          | 説明                                           |
| --------------- | ----------- | ---------------------------------------------- |
| id              | UUID (PK)   | セッションID                                   |
| conversation_id | UUID (FK)   | → conversations(id)                            |
| caller_id       | UUID (FK)   | 発信者 → profiles(id)                          |
| callee_id       | UUID (FK)   | 着信者 → profiles(id)                          |
| call_type       | TEXT        | audio / video                                  |
| status          | TEXT        | ringing / accepted / rejected / ended / missed |
| started_at      | TIMESTAMPTZ | 通話開始日時（accepted時に設定）               |
| ended_at        | TIMESTAMPTZ | 通話終了日時                                   |
| created_at      | TIMESTAMPTZ | 作成日時                                       |
| updated_at      | TIMESTAMPTZ | 更新日時                                       |

- RLS: caller/callee のみ参照・更新可、caller のみ INSERT（会話参加者チェック付き）
- Realtime 有効

### push_subscriptions テーブル

| カラム          | 型          | 説明                               |
| --------------- | ----------- | ---------------------------------- |
| id              | UUID (PK)   | サブスクリプションID               |
| user_id         | UUID (FK)   | → profiles(id) ON DELETE CASCADE   |
| endpoint        | TEXT        | Push API エンドポイントURL         |
| p256dh          | TEXT        | 公開鍵                             |
| auth            | TEXT        | 認証シークレット                   |
| expiration_time | BIGINT      | 有効期限                           |
| created_at      | TIMESTAMPTZ | 作成日時                           |
| updated_at      | TIMESTAMPTZ | 更新日時                           |

- UNIQUE(user_id, endpoint)（複数デバイス対応）
- RLS: 自分のみ CRUD、同じ会話の参加者の subscription も SELECT 可

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
