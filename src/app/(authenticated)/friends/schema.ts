import { z } from "zod";

export const searchLinkIdSchema = z.object({
  linkId: z.string().min(1, "Link IDを入力してください"),
});

export type SearchLinkIdInput = z.infer<typeof searchLinkIdSchema>;
