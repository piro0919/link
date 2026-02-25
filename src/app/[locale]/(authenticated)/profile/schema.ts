import { z } from "zod";

export const updateProfileSchema = z.object({
  displayName: z.string().min(1).max(50),
});

export const updateLinkIdSchema = z.object({
  linkId: z
    .string()
    .min(4)
    .max(20)
    .regex(/^[a-z0-9_-]+$/),
});
