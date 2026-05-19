import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export async function requireAdminUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/admin");
  }

  const { data: admin } = await supabase
    .from("admin_users")
    .select("role")
    .eq("auth_user_id", user.id)
    .single();

  if (!admin || admin.role !== "owner") {
    redirect("/");
  }

  return user;
}
