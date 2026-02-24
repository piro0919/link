import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  client: {
    NEXT_PUBLIC_SUPABASE_URL: z.url(),
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
    NEXT_PUBLIC_SKYWAY_APP_ID: z.string().min(1),
  },
  runtimeEnv: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_SKYWAY_APP_ID: process.env.NEXT_PUBLIC_SKYWAY_APP_ID,
    SITE_URL: process.env.SITE_URL,
    SKYWAY_SECRET_KEY: process.env.SKYWAY_SECRET_KEY,
  },
  server: {
    SITE_URL: z.url(),
    SKYWAY_SECRET_KEY: z.string().min(1),
  },
});
