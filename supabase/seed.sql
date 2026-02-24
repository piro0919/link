-- テスト用ユーザー（ローカル開発用）
-- パスワード: password123

-- ユーザー1: テスト太郎 (taro@example.com)
INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token,
  email_change, email_change_token_new, email_change_token_current, email_change_confirm_status
) VALUES (
  'a1111111-1111-1111-1111-111111111111',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'taro@example.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  '{"full_name": "テスト太郎", "avatar_url": null}'::jsonb,
  NOW(), NOW(), '', '', '', '', '', 0
);

INSERT INTO auth.identities (
  id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
) VALUES (
  'a1111111-1111-1111-1111-111111111111',
  'a1111111-1111-1111-1111-111111111111',
  'a1111111-1111-1111-1111-111111111111',
  '{"sub": "a1111111-1111-1111-1111-111111111111", "email": "taro@example.com"}'::jsonb,
  'email', NOW(), NOW(), NOW()
);

-- handle_new_user トリガーで profiles が自動作成される
UPDATE public.profiles SET link_id = 'taro' WHERE id = 'a1111111-1111-1111-1111-111111111111';

-- ユーザー2: テスト花子 (hanako@example.com)
INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token,
  email_change, email_change_token_new, email_change_token_current, email_change_confirm_status
) VALUES (
  'b2222222-2222-2222-2222-222222222222',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'hanako@example.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  '{"full_name": "テスト花子", "avatar_url": null}'::jsonb,
  NOW(), NOW(), '', '', '', '', '', 0
);

INSERT INTO auth.identities (
  id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
) VALUES (
  'b2222222-2222-2222-2222-222222222222',
  'b2222222-2222-2222-2222-222222222222',
  'b2222222-2222-2222-2222-222222222222',
  '{"sub": "b2222222-2222-2222-2222-222222222222", "email": "hanako@example.com"}'::jsonb,
  'email', NOW(), NOW(), NOW()
);

UPDATE public.profiles SET link_id = 'hanako' WHERE id = 'b2222222-2222-2222-2222-222222222222';

-- フレンド関係（承認済み）
INSERT INTO public.friend_requests (sender_id, receiver_id, status)
VALUES (
  'a1111111-1111-1111-1111-111111111111',
  'b2222222-2222-2222-2222-222222222222',
  'accepted'
);

-- 1:1 会話
INSERT INTO public.conversations (id) VALUES ('c3333333-3333-3333-3333-333333333333');

INSERT INTO public.conversation_participants (conversation_id, user_id) VALUES
  ('c3333333-3333-3333-3333-333333333333', 'a1111111-1111-1111-1111-111111111111'),
  ('c3333333-3333-3333-3333-333333333333', 'b2222222-2222-2222-2222-222222222222');

-- サンプルメッセージ
INSERT INTO public.messages (conversation_id, sender_id, content, created_at) VALUES
  ('c3333333-3333-3333-3333-333333333333', 'a1111111-1111-1111-1111-111111111111', 'こんにちは！', NOW() - INTERVAL '2 minutes'),
  ('c3333333-3333-3333-3333-333333333333', 'b2222222-2222-2222-2222-222222222222', 'やっほー！元気？', NOW() - INTERVAL '1 minute'),
  ('c3333333-3333-3333-3333-333333333333', 'a1111111-1111-1111-1111-111111111111', 'うん、元気だよ！', NOW());

UPDATE public.conversations SET updated_at = NOW() WHERE id = 'c3333333-3333-3333-3333-333333333333';
