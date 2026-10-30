"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import ODManagement from "@/components/ODManagement";
import {
  Shield,
  Users,
  GraduationCap,
  BookOpen,
  Calendar,
  CheckCircle,
  Clock,
  School,
  TrendingUp,
} from "lucide-react";

export default function AdminDashboard() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (!res.ok || !data.user) {
          router.push("/login");
          return;
        }
        setCurrentUser(data.user);
      } catch (err) {
        router.push("/login");
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-2" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <Navbar user={currentUser} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
        {/* Admin Header */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                <Shield className="h-3.5 w-3.5" /> Institutional Administration
              </span>
              <span className="text-xs text-slate-500 font-medium">Academic Affairs</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mt-1">
              Campus Attendance Governance & OD Audit
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Comprehensive institutional oversight, digital attendance audits, and university-wide OD decisions.
            </p>
          </div>
        </div>

        {/* Institution Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
            <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
              <Users className="h-3.5 w-3.5 text-indigo-500" /> Total Students
            </span>
            <p className="text-2xl font-black text-slate-900 mt-1">6 Enrolled</p>
            <span className="text-[10px] text-emerald-600 font-semibold">Demo Cohort</span>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
            <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
              <GraduationCap className="h-3.5 w-3.5 text-indigo-500" /> Active Faculty
            </span>
            <p className="text-2xl font-black text-slate-900 mt-1">2 Professors</p>
            <span className="text-[10px] text-slate-500">Computer Science Dept</span>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
            <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
              <BookOpen className="h-3.5 w-3.5 text-indigo-500" /> Courses Offered
            </span>
            <p className="text-2xl font-black text-slate-900 mt-1">3 Subjects</p>
            <span className="text-[10px] text-slate-500">CS301, CS302, CS303</span>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
            <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500" /> College Turnout Rate
            </span>
            <p className="text-2xl font-black text-emerald-700 mt-1">87.5%</p>
            <span className="text-[10px] text-emerald-600 font-semibold">Above 75% threshold</span>
          </div>
        </div>

        {/* Institution OD Audit Module */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
          <ODManagement userRole="ADMIN" />
        </div>
      </main>
    </div>
  );
}

