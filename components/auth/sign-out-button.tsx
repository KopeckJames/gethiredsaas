"use client";

import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function SignOutButton() {
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error signing out:", error);
    } else {
      router.push("/");
    }
  };

  return (
    <button
      onClick={handleSignOut}
      className="text-sm text-gray-700 hover:text-gray-900"
    >
      Sign Out
    </button>
  );
}
