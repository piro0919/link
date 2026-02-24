-- 会話テーブル（将来のグループチャット拡張に対応）
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 会話参加者テーブル
CREATE TABLE public.conversation_participants (
  conversation_id UUID NOT NULL
    REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL
    REFERENCES public.profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (conversation_id, user_id)
);

CREATE INDEX conversation_participants_user_id_idx
  ON public.conversation_participants (user_id);

-- メッセージテーブル
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL
    REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL
    REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX messages_conversation_id_created_at_idx
  ON public.messages (conversation_id, created_at);

-- RLS: conversations
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "conversations_select_participant"
  ON public.conversations FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants
      WHERE conversation_id = id AND user_id = auth.uid()
    )
  );

CREATE POLICY "conversations_insert_authenticated"
  ON public.conversations FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "conversations_update_participant"
  ON public.conversations FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants
      WHERE conversation_id = id AND user_id = auth.uid()
    )
  );

-- RLS: conversation_participants
ALTER TABLE public.conversation_participants
  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "participants_select_member"
  ON public.conversation_participants FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = conversation_id
        AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "participants_insert_authenticated"
  ON public.conversation_participants FOR INSERT TO authenticated
  WITH CHECK (true);

-- RLS: messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "messages_select_participant"
  ON public.messages FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants
      WHERE conversation_id = messages.conversation_id
        AND user_id = auth.uid()
    )
  );

CREATE POLICY "messages_insert_participant"
  ON public.messages FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.conversation_participants
      WHERE conversation_id = messages.conversation_id
        AND user_id = auth.uid()
    )
  );

-- Realtime 有効化
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
