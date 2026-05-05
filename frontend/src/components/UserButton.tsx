"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User, LogOut } from "lucide-react";
import { isLoggedIn, clearToken } from "@/lib/auth";

export default function UserButton() {
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setLoggedIn(isLoggedIn());
    const handler = () => setLoggedIn(isLoggedIn());
    window.addEventListener("auth-changed", handler);
    return () => window.removeEventListener("auth-changed", handler);
  }, []);

  if (!loggedIn) {
    return (
      <button
        onClick={() => router.push("/login")}
        className="inline-flex items-center justify-center rounded-md w-9 h-9 hover:bg-accent transition-colors"
        aria-label="Sign in"
      >
        <User className="w-4 h-4" />
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center justify-center rounded-md w-9 h-9 bg-[#F59E0B]/10 hover:bg-[#F59E0B]/20 transition-colors"
        aria-label="Account"
      >
        <User className="w-4 h-4 text-[#F59E0B]" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-40 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111] shadow-lg z-20 overflow-hidden">
            <button
              onClick={() => {
                clearToken();
                setOpen(false);
                router.push("/");
              }}
              className="w-full flex items-center gap-2 px-4 py-3 text-sm text-gray-600 dark:text-white/70 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        </>
      )}
    </div>
  );
}
