-- conversation_participants の SELECT ポリシーが自テーブルを参照して無限再帰になっていたのを修正
-- SECURITY DEFINER 関数で自分の会話IDを取得し、再帰を回避する

CREATE OR REPLACE FUNCTION public.get_my_conversation_ids()
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT conversation_id
  FROM public.conversation_participants
  WHERE user_id = auth.uid()
$$;

-- 旧ポリシー削除
DROP POLICY "participants_select_member" ON public.conversation_participants;

-- 自分が参加している会話のメンバーを閲覧可能
CREATE POLICY "participants_select_member"
  ON public.conversation_participants FOR SELECT TO authenticated
  USING (conversation_id IN (SELECT public.get_my_conversation_ids()));
