import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { origin, searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development";

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}/`);
      }
      if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}/`);
      }
      return NextResponse.redirect(`${origin}/`);
    }
  }

  // 認証エラー時はログインページにリダイレクト
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
