"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push("/home");
        return;
      }

      const { data: userData, error } = await supabase
        .from("users")
        .select("role")
        .eq("id", session.user.id)
        .single();

      if (error) {
        console.error("Error fetching user role:", error);
        router.push("/login");
        return;
      }

      if (userData?.role === "admin") {
        router.push("/admin/dashboard");
      } else if (userData?.role === "user") {
        router.push("/user/dashboard");
      } else {
        router.push("/login");
      }
    };

    checkUser();
  }, [router]);

  return null;
}
