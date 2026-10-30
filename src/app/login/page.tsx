"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  QrCode,
  ShieldCheck,
  GraduationCap,
  Sparkles,
  ArrowRight,
  UserCheck,
  CheckCircle2,
  Lock,
  Mail,
  Zap,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Login failed");
        setLoading(false);
        return;
      }

      router.push(data.redirectUrl || "/");
      router.refresh();
    } catch (err: any) {
      setErrorMsg("Network error during login.");
      setLoading(false);
    }
  };

  const handleQuickDemo = async (demoRole: "FACULTY" | "STUDENT" | "ADMIN") => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ demoRole }),
      });
      const data = await res.json();
      if (res.ok && data.redirectUrl) {
        router.push(data.redirectUrl);
        router.refresh();
      } else {
        setErrorMsg(data.error || "Failed demo login");
      }
    } catch (err) {
      setErrorMsg("Demo login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 text-slate-100">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-500/30 mb-4 animate-bounce">
          <QrCode className="h-9 w-9" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white">SmartAttend</h1>
        <p className="mt-2 text-sm text-slate-400">
          Digital QR & On-Duty Attendance Platform for Colleges & Universities
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white text-slate-900 py-8 px-6 sm:px-10 shadow-2xl rounded-3xl border border-slate-200/80">
          {/* Quick Demo Persona Section */}
          <div className="mb-6 p-4 rounded-2xl bg-indigo-50/80 border border-indigo-100">
            <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1 mb-2">
              <Zap className="h-3.5 w-3.5 text-indigo-600" />
              1-Click Instant Persona Login
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickDemo("FACULTY")}
                disabled={loading}
                className="py-2.5 px-3 rounded-xl bg-white hover:bg-indigo-600 hover:text-white text-indigo-700 font-semibold border border-indigo-200 shadow-2xs transition-all flex flex-col items-center text-center group"
              >
                <span className="font-bold">Faculty Portal</span>
                <span className="text-[10px] text-slate-400 group-hover:text-indigo-200">
                  Dr. Alan Turing
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo("STUDENT")}
                disabled={loading}
                className="py-2.5 px-3 rounded-xl bg-white hover:bg-indigo-600 hover:text-white text-indigo-700 font-semibold border border-indigo-200 shadow-2xs transition-all flex flex-col items-center text-center group"
              >
                <span className="font-bold">Student Portal</span>
                <span className="text-[10px] text-slate-400 group-hover:text-indigo-200">
                  John Doe (21CS001)
                </span>
              </button>
            </div>
          </div>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-slate-400 font-medium">Or Sign in with Email</span>
            </div>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {errorMsg}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Institutional Email Address
              </label>
              <div className="relative">
                <Mail className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="faculty@smartattend.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors shadow-md shadow-indigo-200 flex items-center justify-center gap-1.5"
            >
              <span>{loading ? "Verifying..." : "Sign In to Account"}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </form>

          {/* Seed Credentials Hints */}
          <div className="mt-5 pt-4 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
            <p className="font-semibold text-slate-700">Pre-seeded Demo Credentials:</p>
            <p>• Faculty: <code className="text-indigo-600 font-mono">faculty@smartattend.edu</code> / <code className="text-slate-600">password123</code></p>
            <p>• Student: <code className="text-indigo-600 font-mono">student@smartattend.edu</code> / <code className="text-slate-600">password123</code></p>
          </div>
        </div>
      </div>
    </div>
  );
}

