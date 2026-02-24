import { z } from "zod";

export const updateProfileSchema = z.object({
  displayName: z.string().min(1, "表示名は必須です").max(50, "表示名は50文字以内にしてください"),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
