"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { User } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { isLoggedIn } from "@/lib/auth";

export default function UserButton() {
  const { user } = useUser();
  // Use localStorage as primary signal — doesn't depend on backend being up
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    setLoggedIn(isLoggedIn());
    const handler = () => setLoggedIn(isLoggedIn());
    window.addEventListener("auth-changed", handler);
    return () => window.removeEventListener("auth-changed", handler);
  }, []);

  if (loggedIn) {
    const displayName = user ? (user.display_name || user.username) : null;
    const initials = displayName ? displayName.slice(0, 2).toUpperCase() : "ME";
    return (
      <Link
        href="/account"
        className="group inline-flex items-center gap-1.5 h-8 px-2 rounded-lg hover:bg-muted transition-colors"
        aria-label="Account"
      >
        <span className="w-5 h-5 rounded-full bg-horizon flex items-center justify-center text-black text-[9px] font-bold shrink-0">
          {initials}
        </span>
        <span className="text-sm font-medium text-foreground">Account</span>
      </Link>
    );
  }

  return (
    <Link
      href="/login"
      className="group inline-flex items-center h-8 px-2 rounded-lg hover:bg-muted transition-colors overflow-hidden"
      aria-label="Sign in"
    >
      <User className="size-4 shrink-0" />
      <span className="max-w-0 overflow-hidden whitespace-nowrap pl-0 opacity-0 text-sm font-medium group-hover:max-w-[55px] group-hover:pl-1.5 group-hover:opacity-100 transition-all duration-200">
        Sign In
      </span>
    </Link>
  );
}
