import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Check if a user is an admin
 * @param userId - The user ID to check
 * @returns true if user is admin, false otherwise
 */
export async function isAdmin(userId: string): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  
  const { data, error } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", userId)
    .single();

  if (error || !data) {
    // If profile doesn't exist or error, user is not admin
    return false;
  }

  return data.is_admin === true;
}

/**
 * Check if the currently authenticated user is an admin
 * Throws an error if user is not authenticated or not an admin
 * @throws Error if user is not authenticated or not an admin
 */
export async function checkAdmin(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const admin = await isAdmin(user.id);
  if (!admin) {
    throw new Error("Access denied: Admin privileges required");
  }
}

/**
 * Get the admin status of the currently authenticated user
 * Returns false if user is not authenticated
 * @returns true if current user is admin, false otherwise
 */
export async function getCurrentUserAdminStatus(): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return false;
  }

  return await isAdmin(user.id);
}
