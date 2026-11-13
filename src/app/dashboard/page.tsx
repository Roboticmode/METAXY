import { createClient } from "@/lib/supabase/server";
import { Shell } from "@/components/shell";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data } = supabase ? await supabase.auth.getUser() : { data: { user: null } };

  return <Shell userEmail={data.user?.email ?? null} />;
}
