"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("token")) {
      setLoggedIn(true);
    }
  }, []);

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new URLSearchParams();
    formData.append("username", form.email);
    formData.append("password", form.password);

    const res = await fetch("http://127.0.0.1:8000/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData.toString(),
    });

    setLoading(false);

    if (res.ok) {
      const data = await res.json();
      localStorage.setItem("token", data.access_token);
      router.push("/");
    } else {
      setError("Invalid email or password");
    }
  };

  if (loggedIn) {
    return (
      <main className="flex flex-1 items-center justify-center py-12">
        <p className="text-lg text-gray-600">You are already logged in.</p>
      </main>
    );
  }

  return (
    <main className="flex flex-1 items-center justify-center py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Log in</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Logging in..." : "Log in"}
            </Button>
            <p className="text-sm text-center text-gray-500">
              Don&apos;t have an account?{" "}
              <a href="/signup" className="underline">
                Sign up
              </a>
            </p>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
