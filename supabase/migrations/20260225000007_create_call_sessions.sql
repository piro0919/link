-- 通話セッション管理テーブル
CREATE TABLE public.call_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL
    REFERENCES public.conversations(id) ON DELETE CASCADE,
  caller_id UUID NOT NULL
    REFERENCES public.profiles(id) ON DELETE CASCADE,
  callee_id UUID NOT NULL
    REFERENCES public.profiles(id) ON DELETE CASCADE,
  call_type TEXT NOT NULL CHECK (call_type IN ('audio', 'video')),
  status TEXT NOT NULL DEFAULT 'ringing'
    CHECK (status IN ('ringing', 'accepted', 'rejected', 'ended', 'missed')),
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER call_sessions_updated_at
  BEFORE UPDATE ON public.call_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX call_sessions_conversation_id_idx
  ON public.call_sessions (conversation_id);
CREATE INDEX call_sessions_callee_status_idx
  ON public.call_sessions (callee_id, status);

-- RLS
ALTER TABLE public.call_sessions ENABLE ROW LEVEL SECURITY;

-- caller/callee のみ参照可
CREATE POLICY "call_sessions_select_participant"
  ON public.call_sessions FOR SELECT TO authenticated
  USING (auth.uid() = caller_id OR auth.uid() = callee_id);

-- caller のみ挿入可（会話の参加者であること）
CREATE POLICY "call_sessions_insert_caller"
  ON public.call_sessions FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = caller_id
    AND conversation_id IN (SELECT public.get_my_conversation_ids())
  );

-- caller/callee のみ更新可
CREATE POLICY "call_sessions_update_participant"
  ON public.call_sessions FOR UPDATE TO authenticated
  USING (auth.uid() = caller_id OR auth.uid() = callee_id);

-- Realtime 有効化
ALTER PUBLICATION supabase_realtime ADD TABLE public.call_sessions;
