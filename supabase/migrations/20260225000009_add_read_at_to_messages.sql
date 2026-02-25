-- メッセージ既読管理: read_at カラム追加
ALTER TABLE public.messages ADD COLUMN read_at TIMESTAMPTZ;

-- インデックス: 未読メッセージの効率的な取得用
CREATE INDEX messages_unread_idx
  ON public.messages (conversation_id, sender_id)
  WHERE read_at IS NULL;

-- UPDATE ポリシー: 会話参加者が、自分宛て（自分が送信者でない）メッセージの read_at のみ更新可能
CREATE POLICY "messages_update_read_at"
  ON public.messages FOR UPDATE TO authenticated
  USING (
    sender_id != auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.conversation_participants
      WHERE conversation_id = messages.conversation_id
        AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    sender_id != auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.conversation_participants
      WHERE conversation_id = messages.conversation_id
        AND user_id = auth.uid()
    )
  );

-- RPC: 各会話の未読メッセージ数を一括取得
CREATE OR REPLACE FUNCTION public.get_unread_counts()
RETURNS TABLE(conversation_id UUID, unread_count BIGINT)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT
    m.conversation_id,
    COUNT(*) AS unread_count
  FROM public.messages m
  WHERE m.sender_id != auth.uid()
    AND m.read_at IS NULL
    AND m.conversation_id IN (SELECT public.get_my_conversation_ids())
  GROUP BY m.conversation_id
$$;
