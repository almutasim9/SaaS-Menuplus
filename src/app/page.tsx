import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import LandingClient from "@/components/landing/LandingClient";

export default async function LandingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Only redirect regular users — let super_admin preview the landing page
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "super_admin") {
      redirect("/dashboard");
    }
  }

  return <LandingClient />;
}
