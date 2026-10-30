"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import QRScannerModal from "@/components/QRScannerModal";
import ODManagement from "@/components/ODManagement";
import {
  Camera,
  CheckCircle2,
  Clock,
  BookOpen,
  Calendar,
  AlertTriangle,
  FileText,
  Sparkles,
  ArrowRight,
  TrendingUp,
  MapPin,
  Check,
} from "lucide-react";

export default function StudentDashboard() {
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"OVERVIEW" | "OD" | "HISTORY">("OVERVIEW");

  const fetchDashboard = async () => {
    try {
      const res = await fetch("/api/student/dashboard");
      const data = await res.json();
      if (!res.ok) {
        router.push("/login");
        return;
      }
      setDashboardData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center text-xs text-slate-500">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2" />
          Loading Student Portal...
        </div>
      </div>
    );
  }

  const { user, summary, courses, activeSessions, recentAttendances } = dashboardData || {
    user: null,
    summary: { overallPercentage: 0, totalClasses: 0, totalPresent: 0, totalOnDuty: 0, isWarning: false },
    courses: [],
    activeSessions: [],
    recentAttendances: [],
  };

  const currentLiveSession = activeSessions.find((s: any) => !s.isAlreadyMarked) || activeSessions[0];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col pb-24 md:pb-12">
      <Navbar user={user} />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full space-y-6">
        {/* Student Welcome & Hero Card */}
        <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-indigo-800 rounded-3xl p-6 sm:p-8 text-white shadow-lg shadow-indigo-200 relative overflow-hidden">
          {/* Subtle Background Glow */}
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold backdrop-blur-xs mb-3">
                <span className="font-mono">{user?.rollNumber || "Student"}</span> • {user?.department}
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Hello, {user?.name.split(" ")[0]}!
              </h1>
              <p className="text-xs text-indigo-100 mt-1 max-w-md">
                Fast digital attendance check-ins, real-time course metrics, and official On-Duty leave submissions.
              </p>
            </div>

            {/* Quick Scan Action Button */}
            <div>
              <button
                onClick={() => setIsScannerOpen(true)}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white hover:bg-slate-50 text-indigo-700 font-bold text-sm flex items-center justify-center gap-2.5 shadow-xl shadow-black/10 transition-transform active:scale-95"
              >
                <Camera className="h-5 w-5 text-indigo-600" />
                <span>Scan Classroom QR</span>
              </button>
            </div>
          </div>
        </div>

        {/* Live Active Session Alert (if a teacher has a session running right now) */}
        {currentLiveSession && (
          <div className="bg-amber-50 border-2 border-amber-300/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs animate-in fade-in">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500 text-white shadow-xs">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 animate-pulse">
                    Class in Session Now
                  </span>
                  <span className="text-xs font-semibold text-amber-900">
                    {currentLiveSession.courseCode}
                  </span>
                </div>
                <h4 className="font-bold text-slate-900 text-sm mt-0.5">
                  {currentLiveSession.title}
                </h4>
                <p className="text-xs text-slate-600 flex items-center gap-2 mt-0.5">
                  <span>Faculty: {currentLiveSession.facultyName}</span>
                  {currentLiveSession.classroom && (
                    <span className="flex items-center gap-1">
                      • <MapPin className="h-3 w-3" /> {currentLiveSession.classroom}
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div>
              {currentLiveSession.isAlreadyMarked ? (
                <div className="px-4 py-2 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Attended Today ({currentLiveSession.markedStatus})</span>
                </div>
              ) : (
                <button
                  onClick={() => setIsScannerOpen(true)}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-indigo-200 transition-colors"
                >
                  <Camera className="h-4 w-4" />
                  <span>Scan to Check In</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
          <button
            onClick={() => setActiveTab("OVERVIEW")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "OVERVIEW"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <TrendingUp className="h-3.5 w-3.5" />
            <span>Attendance Metrics</span>
          </button>

          <button
            onClick={() => setActiveTab("OD")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "OD"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>On-Duty (OD) Requests</span>
          </button>

          <button
            onClick={() => setActiveTab("HISTORY")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "HISTORY"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            <span>Activity Log</span>
          </button>
        </div>

        {/* TAB 1: OVERVIEW & COURSES */}
        {activeTab === "OVERVIEW" && (
          <div className="space-y-6">
            {/* Aggregate Metric Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
                <span className="text-[11px] text-slate-500 font-medium">Overall Attendance</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span
                    className={`text-2xl font-black ${
                      summary.isWarning ? "text-rose-600" : "text-slate-900"
                    }`}
                  >
                    {summary.overallPercentage}%
                  </span>
                  {summary.isWarning && (
                    <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                      <AlertTriangle className="h-3 w-3" /> Low
                    </span>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
                <span className="text-[11px] text-slate-500 font-medium">Total Lectures</span>
                <p className="text-2xl font-bold text-slate-900 mt-1">{summary.totalClasses}</p>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
                <span className="text-[11px] text-emerald-600 font-medium">Attended (Present)</span>
                <p className="text-2xl font-bold text-emerald-700 mt-1">{summary.totalPresent}</p>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
                <span className="text-[11px] text-blue-600 font-medium">OD Credits Approved</span>
                <p className="text-2xl font-bold text-blue-700 mt-1">{summary.totalOnDuty}</p>
              </div>
            </div>

            {/* Course-by-Course Attendance Cards */}
            <div>
              <h3 className="font-bold text-slate-900 text-base mb-3 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-indigo-600" />
                Enrolled Subjects & Attendance Standings
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {courses.map((course: any) => (
                  <div
                    key={course.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[11px] font-bold font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                            {course.code}
                          </span>
                          <h4 className="font-bold text-slate-900 text-sm mt-1">{course.name}</h4>
                          <p className="text-xs text-slate-500">Faculty: {course.facultyName}</p>
                        </div>

                        <div className="text-right">
                          <span
                            className={`text-xl font-black ${
                              course.isLowAttendance ? "text-rose-600" : "text-emerald-700"
                            }`}
                          >
                            {course.percentage}%
                          </span>
                          <p className="text-[10px] text-slate-400">Req: 75%</p>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-3">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            course.isLowAttendance ? "bg-rose-500" : "bg-emerald-500"
                          }`}
                          style={{ width: `${course.percentage}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100 text-center text-xs">
                      <div className="bg-slate-50 p-1.5 rounded-lg">
                        <span className="text-[10px] text-slate-500">Conducted</span>
                        <p className="font-bold text-slate-800">{course.totalSessions}</p>
                      </div>
                      <div className="bg-emerald-50 p-1.5 rounded-lg">
                        <span className="text-[10px] text-emerald-700">Present</span>
                        <p className="font-bold text-emerald-800">{course.presentCount}</p>
                      </div>
                      <div className="bg-blue-50 p-1.5 rounded-lg">
                        <span className="text-[10px] text-blue-700">On-Duty</span>
                        <p className="font-bold text-blue-800">{course.odCount}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ON-DUTY MANAGEMENT */}
        {activeTab === "OD" && <ODManagement userRole="STUDENT" />}

        {/* TAB 3: ACTIVITY LOG */}
        {activeTab === "HISTORY" && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Personal Attendance History</h3>
              <p className="text-xs text-slate-500">Your recent digital check-ins and timestamps</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-slate-400 font-medium">
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4">Course</th>
                    <th className="py-3 px-4">Session Title</th>
                    <th className="py-3 px-4">Verification</th>
                    <th className="py-3 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentAttendances.map((a: any) => (
                    <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-slate-600">
                        {new Date(a.markedAt).toLocaleDateString()} •{" "}
                        {new Date(a.markedAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {a.session?.course?.code}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-800">
                        {a.session?.title}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-[11px] bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                          {a.verificationMethod}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            a.status === "PRESENT"
                              ? "bg-emerald-100 text-emerald-800"
                              : a.status === "ON_DUTY"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {a.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Floating Action Scanner Button (Mobile-first) */}
      <div className="fixed bottom-6 right-6 z-40 md:hidden">
        <button
          onClick={() => setIsScannerOpen(true)}
          className="h-14 w-14 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center shadow-xl shadow-indigo-500/40 active:scale-95 transition-all"
        >
          <Camera className="h-7 w-7" />
        </button>
      </div>

      {/* QR SCANNER POPUP MODAL */}
      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onSuccess={() => {
          fetchDashboard();
        }}
        activeSessionId={currentLiveSession?.id}
        activeSessionTitle={currentLiveSession ? `${currentLiveSession.courseCode} - ${currentLiveSession.title}` : undefined}
      />
    </div>
  );
}

