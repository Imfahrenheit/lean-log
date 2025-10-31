import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const inviteCode = searchParams.get("invite_code");
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
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return NextResponse.redirect(`${origin}/signin?error=${error.message}`);
    }

    // If this is a new user signup and an invite code was provided, mark it as used
    if (data.user && inviteCode) {
      // Check if this user was just created (by checking created_at time)
      // We'll use the service client to call the database function
      const serviceClient = createSupabaseServiceClient();
      
      // Call the database function to mark the invite as used
      const { error: inviteError } = await serviceClient.rpc("mark_invite_used", {
        invite_code: inviteCode,
        user_id: data.user.id,
      });

      if (inviteError) {
        console.error("Error marking invite as used:", inviteError);
        // Don't block the user from signing in if invite marking fails
        // The invite will remain unused, but the user is already created
      }
    }
  }

  // Redirect to the next URL or home
  return NextResponse.redirect(`${origin}${next}`);
}
