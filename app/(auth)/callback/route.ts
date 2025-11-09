import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

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
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return NextResponse.redirect(`${origin}/signin?error=${error.message}`);
    }

    // Mark the invite as used by email (for both new signups and existing users)
    // The function will only mark if the invite is valid and unused
    if (data.user && data.user.email) {
      const serviceClient = createSupabaseServiceClient();
      
      try {
        // Call the database function to mark the invite as used by email
        const { data: inviteResult, error: inviteError } = await serviceClient.rpc("mark_invite_used_by_email", {
          invite_email: data.user.email.toLowerCase(),
          user_id: data.user.id,
        });

        if (inviteError) {
          console.error("Error marking invite as used:", inviteError);
          // Don't block the user from signing in if invite marking fails
          // The invite will remain unused, but the user is already created
        } else if (inviteResult === false) {
          // Invite not found or already used - this is expected for existing users
          // but we log it for debugging
          console.log("Invite not marked as used (may already be used or not found):", data.user.email);
        }
      } catch (err) {
        console.error("Exception marking invite as used:", err);
        // Continue - don't block user signin
      }
    }
  }

  // Redirect to the next URL or home
  return NextResponse.redirect(`${origin}${next}`);
}
