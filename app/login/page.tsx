"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const { status } = useSession();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/");
    }
  }, [status, router]);

  if (status === "authenticated") {
    return null;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await signIn("credentials", {
      redirect: false,
      username,
      password,
    });

    if (res?.error) {
      setError(res.error);
      setLoading(false);
    } else {
      router.push("/");
      router.refresh();
    }
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center p-4"
      style={{
        backgroundImage: "url('/background.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Overlay tipis — redup sedikit tanpa menghitamkan */}
      <div className="absolute inset-0 bg-black/25" />

      <div className="relative w-full max-w-sm">
        {/* Header */}
        <div className="mb-7 text-center">
          <Image
            src="/logo.png"
            alt="Logo"
            width={48}
            height={48}
            className="mx-auto mb-3 rounded-xl object-contain"
          />
          <h1 className="text-xl font-semibold text-white drop-shadow-md">
            Generator Sertifikat
          </h1>
          <p className="mt-0.5 text-sm text-white/70 drop-shadow">
            Bundo Kanduang
          </p>
        </div>

        {/* Card — putih frosted, cukup solid */}
        <div
          className="rounded-2xl p-6"
          style={{
            background: "rgba(255, 255, 255, 0.45)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(255, 255, 255, 0.6)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
          }}
        >
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-600">
                {error}
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-gray-500">
                Username
              </label>
              <input
                type="text"
                required
                className="h-10 w-full rounded-lg px-3 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7B1111]/40 transition-all"
                style={{
                  background: "rgba(255, 255, 255, 0.7)",
                  border: "1px solid rgba(0, 0, 0, 0.12)",
                }}
                placeholder="Masukkan username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-gray-500">
                Password
              </label>
              <input
                type="password"
                required
                className="h-10 w-full rounded-lg px-3 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7B1111]/40 transition-all"
                style={{
                  background: "rgba(255, 255, 255, 0.7)",
                  border: "1px solid rgba(0, 0, 0, 0.12)",
                }}
                placeholder="Masukkan password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-1 h-10 w-full rounded-lg bg-[#7B1111] text-sm font-medium text-white transition-all hover:bg-[#651010] active:scale-[0.98] disabled:opacity-40"
            >
              {loading ? "Memproses..." : "Masuk"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}