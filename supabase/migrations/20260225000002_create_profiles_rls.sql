-- RLSを有効化
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 認証済みユーザーは全プロフィールを参照可能
-- メッセージングアプリなので他ユーザーの名前・アバターが必要
CREATE POLICY "profiles_select_authenticated"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- 自分のプロフィールのみ更新可能
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
