"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  CheckCircle,
  Clock,
  Download,
  StopCircle,
  AlertCircle,
  UserCheck,
  Shield,
  Search,
  Check,
} from "lucide-react";

interface LiveAttendanceMonitorProps {
  sessionId: string;
  onSessionEnded?: () => void;
}

export default function LiveAttendanceMonitor({
  sessionId,
  onSessionEnded,
}: LiveAttendanceMonitorProps) {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"PRESENT" | "UNMARKED">("PRESENT");
  const [searchQuery, setSearchQuery] = useState("");
  const [ending, setEnding] = useState(false);
  const [manualUpdating, setManualUpdating] = useState<string | null>(null);

  const fetchLive = async () => {
    try {
      const res = await fetch(`/api/sessions/${sessionId}/live`);
      const resData = await res.json();
      if (res.ok && resData.success) {
        setData(resData);
      }
    } catch (err) {
      console.error("Live fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLive();
    // Poll every 3 seconds for live student arrivals
    const interval = setInterval(fetchLive, 3000);
    return () => clearInterval(interval);
  }, [sessionId]);

  const handleEndSession = async () => {
    if (!confirm("Are you sure you want to end this attendance session? New scans will be rejected.")) {
      return;
    }
    setEnding(true);
    try {
      const res = await fetch(`/api/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "COMPLETED" }),
      });
      if (res.ok) {
        if (onSessionEnded) onSessionEnded();
        fetchLive();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setEnding(false);
    }
  };

  const handleManualOverride = async (studentId: string, status: "PRESENT" | "ON_DUTY" | "ABSENT") => {
    setManualUpdating(studentId);
    try {
      const res = await fetch("/api/attendance/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          studentId,
          status,
          notes: "Manual override by Faculty",
        }),
      });
      if (res.ok) {
        await fetchLive();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setManualUpdating(null);
    }
  };

  const handleExportCsv = () => {
    window.open(`/api/attendance/export?sessionId=${sessionId}`, "_blank");
  };

  if (loading && !data) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-3" />
        <p className="text-xs text-slate-500 font-medium">Connecting to live attendance stream...</p>
      </div>
    );
  }

  const stats = data?.stats || {
    totalEnrolled: 0,
    totalPresent: 0,
    totalOnDuty: 0,
    totalUnmarked: 0,
    attendancePercentage: 0,
  };

  const attendances = data?.attendances || [];
  const absentStudents = data?.absentStudents || [];

  const filteredAttendances = attendances.filter((a: any) => {
    const q = searchQuery.toLowerCase();
    return (
      a.student.name.toLowerCase().includes(q) ||
      (a.student.rollNumber && a.student.rollNumber.toLowerCase().includes(q))
    );
  });

  const filteredAbsent = absentStudents.filter((s: any) => {
    const q = searchQuery.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      (s.rollNumber && s.rollNumber.toLowerCase().includes(q))
    );
  });

  const isCompleted = data?.session?.status === "COMPLETED";

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      {/* Top Header & Actions */}
      <div className="p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
        <div className="flex items-center gap-2.5">
          <div className="h-10 w-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              Live Attendance Monitor
              {isCompleted ? (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-semibold">
                  CLOSED
                </span>
              ) : (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold animate-pulse">
                  ACTIVE
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-500">Real-time attendance submissions</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Download className="h-3.5 w-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          {!isCompleted && (
            <button
              onClick={handleEndSession}
              disabled={ending}
              className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <StopCircle className="h-3.5 w-3.5" />
              <span>{ending ? "Ending..." : "End Session"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Metric Counters Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-5 border-b border-slate-100">
        <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200/60 text-center">
          <span className="text-[11px] text-slate-500 font-medium">Enrolled Roster</span>
          <p className="text-xl font-bold text-slate-900 mt-0.5">{stats.totalEnrolled}</p>
        </div>

        <div className="bg-emerald-50 rounded-2xl p-3 border border-emerald-100 text-center">
          <span className="text-[11px] text-emerald-700 font-medium">Present (Scanned)</span>
          <p className="text-xl font-bold text-emerald-800 mt-0.5">{stats.totalPresent}</p>
        </div>

        <div className="bg-blue-50 rounded-2xl p-3 border border-blue-100 text-center">
          <span className="text-[11px] text-blue-700 font-medium">On-Duty (Approved)</span>
          <p className="text-xl font-bold text-blue-800 mt-0.5">{stats.totalOnDuty}</p>
        </div>

        <div className="bg-amber-50 rounded-2xl p-3 border border-amber-100 text-center">
          <span className="text-[11px] text-amber-700 font-medium">Turnout Rate</span>
          <p className="text-xl font-bold text-amber-800 mt-0.5">{stats.attendancePercentage}%</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="px-5 pt-3">
        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden flex">
          <div
            className="bg-emerald-500 h-full transition-all duration-500"
            style={{
              width: `${stats.totalEnrolled > 0 ? (stats.totalPresent / stats.totalEnrolled) * 100 : 0}%`,
            }}
            title={`Present: ${stats.totalPresent}`}
          />
          <div
            className="bg-blue-500 h-full transition-all duration-500"
            style={{
              width: `${stats.totalEnrolled > 0 ? (stats.totalOnDuty / stats.totalEnrolled) * 100 : 0}%`,
            }}
            title={`On-Duty: ${stats.totalOnDuty}`}
          />
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="p-5 pb-3 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold w-full sm:w-auto border border-slate-200">
          <button
            onClick={() => setActiveTab("PRESENT")}
            className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg transition-all ${
              activeTab === "PRESENT"
                ? "bg-white text-indigo-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Marked ({attendances.length})
          </button>
          <button
            onClick={() => setActiveTab("UNMARKED")}
            className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg transition-all ${
              activeTab === "UNMARKED"
                ? "bg-white text-indigo-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Not Marked ({absentStudents.length})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-60">
          <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search roll or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
          />
        </div>
      </div>

      {/* Roster Table */}
      <div className="p-5 pt-0 overflow-x-auto">
        {activeTab === "PRESENT" ? (
          filteredAttendances.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              <Clock className="h-8 w-8 mx-auto mb-2 text-slate-300 animate-pulse" />
              Waiting for students to scan QR code...
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200/80 text-slate-400 font-medium">
                  <th className="py-2.5 px-3">Roll No</th>
                  <th className="py-2.5 px-3">Student Name</th>
                  <th className="py-2.5 px-3">Time</th>
                  <th className="py-2.5 px-3">Method</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAttendances.map((a: any) => (
                  <tr key={a.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 font-mono font-semibold text-slate-900">
                      {a.student.rollNumber || "N/A"}
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-800">{a.student.name}</td>
                    <td className="py-3 px-3 text-slate-500 font-mono">
                      {new Date(a.markedAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md font-medium">
                        {a.verificationMethod === "QR_SCAN" ? "📱 QR Scan" : "✍️ Manual"}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                          a.status === "PRESENT"
                            ? "bg-emerald-100 text-emerald-800"
                            : a.status === "ON_DUTY"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        <Check className="h-3 w-3" />
                        {a.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        ) : (
          filteredAbsent.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              <CheckCircle className="h-8 w-8 mx-auto mb-2 text-emerald-400" />
              All enrolled students have marked their attendance!
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200/80 text-slate-400 font-medium">
                  <th className="py-2.5 px-3">Roll No</th>
                  <th className="py-2.5 px-3">Student Name</th>
                  <th className="py-2.5 px-3">Email</th>
                  <th className="py-2.5 px-3 text-right">Manual Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAbsent.map((student: any) => (
                  <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 font-mono font-semibold text-slate-900">
                      {student.rollNumber || "N/A"}
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-800">{student.name}</td>
                    <td className="py-3 px-3 text-slate-500">{student.email}</td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => handleManualOverride(student.id, "PRESENT")}
                        disabled={manualUpdating === student.id}
                        className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition-colors border border-indigo-200"
                      >
                        {manualUpdating === student.id ? "Marking..." : "Mark Present"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}
      </div>
    </div>
  );
}

