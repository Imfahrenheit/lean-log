import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  // Handle errors from Supabase
  if (searchParams.get("error_description")) {
    return NextResponse.redirect(
      `${origin}/signin?error=${searchParams.get("error_description")}`
    );
  }

  // Exchange code for session
  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return NextResponse.redirect(`${origin}/signin?error=${error.message}`);
    }
  }

  // Redirect to the next URL or home
  return NextResponse.redirect(`${origin}${next}`);
}
