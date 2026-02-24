-- profiles に link_id カラムを追加（LINEのIDのようなユーザー検索用識別子）
ALTER TABLE public.profiles
  ADD COLUMN link_id TEXT UNIQUE;

-- 既存ユーザーには UUID の先頭8文字を自動設定
UPDATE public.profiles SET link_id = LEFT(id::TEXT, 8);

-- NOT NULL 制約を追加
ALTER TABLE public.profiles
  ALTER COLUMN link_id SET NOT NULL;

-- 検索用インデックス
CREATE INDEX profiles_link_id_idx ON public.profiles (link_id);

-- handle_new_user() を更新して link_id を自動生成
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url, link_id)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'avatar_url',
      NEW.raw_user_meta_data->>'picture'
    ),
    LEFT(NEW.id::TEXT, 8)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
