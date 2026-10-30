"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { QrCode, LogOut, User, Shield, GraduationCap, School, RefreshCw } from "lucide-react";

interface NavbarProps {
  user?: {
    id: string;
    name: string;
    email: string;
    role: "STUDENT" | "FACULTY" | "ADMIN";
    rollNumber?: string | null;
    department: string;
  } | null;
}

export default function Navbar({ user }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [switching, setSwitching] = useState(false);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSwitchPersona = async (demoRole: "FACULTY" | "STUDENT" | "ADMIN") => {
    setSwitching(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ demoRole }),
      });
      const data = await res.json();
      if (data.redirectUrl) {
        router.push(data.redirectUrl);
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSwitching(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-200 group-hover:scale-105 transition-transform">
            <QrCode className="h-6 w-6" />
          </div>
          <div>
            <span className="font-bold text-lg text-slate-900 tracking-tight flex items-center gap-1.5">
              SmartAttend <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200">v1.0</span>
            </span>
            <p className="text-xs text-slate-500 hidden sm:block">Digital QR & On-Duty Attendance System</p>
          </div>
        </Link>

        {/* User Info & Persona Switcher */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              {/* Persona Switcher Quick Dropdown / Chips */}
              <div className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-medium border border-slate-200">
                <span className="text-slate-600 px-2 flex items-center gap-1">
                  <RefreshCw className={`h-3 w-3 ${switching ? "animate-spin" : ""}`} /> Switch:
                </span>
                <button
                  onClick={() => handleSwitchPersona("FACULTY")}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    user.role === "FACULTY"
                      ? "bg-white text-indigo-700 font-bold shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Faculty
                </button>
                <button
                  onClick={() => handleSwitchPersona("STUDENT")}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    user.role === "STUDENT"
                      ? "bg-white text-indigo-700 font-bold shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Student
                </button>
                <button
                  onClick={() => handleSwitchPersona("ADMIN")}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    user.role === "ADMIN"
                      ? "bg-white text-indigo-700 font-bold shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Admin
                </button>
              </div>

              {/* Profile Card */}
              <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
                <div className="h-9 w-9 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-sm border border-slate-300">
                  {user.role === "FACULTY" ? (
                    <GraduationCap className="h-4 w-4 text-indigo-600" />
                  ) : user.role === "ADMIN" ? (
                    <Shield className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <User className="h-4 w-4 text-blue-600" />
                  )}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-semibold text-slate-900 leading-tight flex items-center gap-1">
                    {user.name}
                    {user.rollNumber && (
                      <span className="text-[10px] text-slate-500 font-normal">({user.rollNumber})</span>
                    )}
                  </div>
                  <div className="text-[10px] text-indigo-600 font-medium">
                    {user.role} • {user.department.split(" ")[0]}
                  </div>
                </div>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  title="Sign Out"
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-1"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </>
          ) : (
            <Link
              href="/login"
              className="text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg transition-colors shadow-xs"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

