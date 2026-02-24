-- フレンドリクエストテーブル
CREATE TABLE public.friend_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (sender_id, receiver_id),
  CHECK (sender_id <> receiver_id)
);

CREATE INDEX friend_requests_receiver_id_idx
  ON public.friend_requests (receiver_id);

CREATE TRIGGER friend_requests_updated_at
  BEFORE UPDATE ON public.friend_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- RLS
ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;

-- 自分が送信者または受信者のリクエストのみ閲覧可能
CREATE POLICY "friend_requests_select_own"
  ON public.friend_requests FOR SELECT TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- 自分からのみ送信可能
CREATE POLICY "friend_requests_insert_sender"
  ON public.friend_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id);

-- 受信者のみステータス更新可能
CREATE POLICY "friend_requests_update_receiver"
  ON public.friend_requests FOR UPDATE TO authenticated
  USING (auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = receiver_id);

-- Realtime 有効化
ALTER PUBLICATION supabase_realtime ADD TABLE public.friend_requests;
