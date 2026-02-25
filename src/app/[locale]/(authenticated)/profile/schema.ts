import { z } from "zod";

export const updateProfileSchema = z.object({
  displayName: z.string().min(1, "表示名は必須です").max(50, "表示名は50文字以内にしてください"),
});

export const updateLinkIdSchema = z.object({
  linkId: z
    .string()
    .min(4, "Link IDは4文字以上にしてください")
    .max(20, "Link IDは20文字以内にしてください")
    .regex(/^[a-z0-9_-]+$/, "小文字英数字、ハイフン、アンダースコアのみ使用できます"),
});
