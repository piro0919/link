import type { NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { updateSession } from "./lib/supabase/proxy";

const intlMiddleware = createIntlMiddleware(routing);

export async function proxy(request: NextRequest) {
  // Supabaseセッション更新（認証チェック＋リダイレクト）
  const supabaseResponse = await updateSession(request);

  // 認証リダイレクトがある場合はそのまま返す
  if (supabaseResponse.headers.get("location")) {
    return supabaseResponse;
  }

  // next-intlミドルウェアを適用（ロケール解決＋リライト）
  const intlResponse = intlMiddleware(request);

  // Supabaseのクッキーをintlレスポンスにマージ
  for (const cookie of supabaseResponse.cookies.getAll()) {
    intlResponse.cookies.set(cookie.name, cookie.value);
  }

  return intlResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sw\\.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
