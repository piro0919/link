import { z } from "zod";

export const searchLinkIdSchema = z.object({
  linkId: z.string().min(1),
});
