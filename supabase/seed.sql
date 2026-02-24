-- テスト用ユーザー（ローカル開発用）
-- パスワード: password123

-- ユーザー1: テスト太郎 (taro@example.com)
INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token
) VALUES (
  'a1111111-1111-1111-1111-111111111111',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'taro@example.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  '{"full_name": "テスト太郎", "avatar_url": null}'::jsonb,
  NOW(), NOW(), '', ''
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

-- handle_new_user トリガーで profiles が自動作成される（link_id = 'a1111111'）
-- 分かりやすい link_id に更新
UPDATE public.profiles SET link_id = 'taro' WHERE id = 'a1111111-1111-1111-1111-111111111111';

-- ユーザー2: テスト花子 (hanako@example.com)
INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token
) VALUES (
  'b2222222-2222-2222-2222-222222222222',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'hanako@example.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  '{"full_name": "テスト花子", "avatar_url": null}'::jsonb,
  NOW(), NOW(), '', ''
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

-- link_id を分かりやすいものに更新
UPDATE public.profiles SET link_id = 'hanako' WHERE id = 'b2222222-2222-2222-2222-222222222222';
