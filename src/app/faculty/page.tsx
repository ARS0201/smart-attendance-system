"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import DynamicQRDisplay from "@/components/DynamicQRDisplay";
import LiveAttendanceMonitor from "@/components/LiveAttendanceMonitor";
import ODManagement from "@/components/ODManagement";
import {
  Plus,
  Play,
  Calendar,
  BookOpen,
  Users,
  CheckCircle,
  Clock,
  Download,
  School,
  ArrowRight,
  FileText,
  MapPin,
  Sparkles,
} from "lucide-react";

export default function FacultyDashboard() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [activeSession, setActiveSession] = useState<any | null>(null);
  const [currentTab, setCurrentTab] = useState<"LIVE" | "SESSIONS" | "OD">("LIVE");
  const [loading, setLoading] = useState(true);

  // New Session Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCourseId, setNewCourseId] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newClassroom, setNewClassroom] = useState("Auditorium Hall 101");
  const [creatingSession, setCreatingSession] = useState(false);

  const initData = async () => {
    try {
      const authRes = await fetch("/api/auth/me");
      const authData = await authRes.json();
      if (!authRes.ok || !authData.user) {
        router.push("/login");
        return;
      }
      setCurrentUser(authData.user);

      // Fetch Courses
      const cRes = await fetch("/api/courses");
      const cData = await cRes.json();
      if (cRes.ok) {
        setCourses(cData.courses);
        if (cData.courses.length > 0) {
          setNewCourseId(cData.courses[0].id);
        }
      }

      // Fetch Sessions
      await fetchSessions();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchSessions = async () => {
    try {
      const sRes = await fetch("/api/sessions");
      const sData = await sRes.json();
      if (sRes.ok && sData.sessions) {
        setSessions(sData.sessions);
        const live = sData.sessions.find((s: any) => s.status === "ACTIVE");
        setActiveSession(live || null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    initData();
  }, []);

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingSession(true);

    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: newCourseId,
          title: newTitle,
          classroomName: newClassroom,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to create session");
        return;
      }

      setShowCreateModal(false);
      setNewTitle("");
      await fetchSessions();
      setActiveSession(data.session);
      setCurrentTab("LIVE");
    } catch (err: any) {
      alert("Error creating session: " + err.message);
    } finally {
      setCreatingSession(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center text-xs text-slate-500">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2" />
          Loading Faculty Portal...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <Navbar user={currentUser} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
        {/* Top Greeting & Action Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-wider">
                Faculty Workspace
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-500 font-medium">{currentUser?.department}</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mt-1">
              Welcome, {currentUser?.name}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Generate dynamic session QR codes, view real-time check-ins, and approve On-Duty requests.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-2xl flex items-center gap-2 shadow-md shadow-indigo-200 transition-all hover:scale-102"
            >
              <Plus className="h-4 w-4" />
              <span>Start New Class Session</span>
            </button>
          </div>
        </div>

        {/* Dashboard Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
          <button
            onClick={() => setCurrentTab("LIVE")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              currentTab === "LIVE"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Play className="h-3.5 w-3.5" />
            <span>Active Session ({activeSession ? "1 Live" : "0"})</span>
          </button>

          <button
            onClick={() => setCurrentTab("SESSIONS")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              currentTab === "SESSIONS"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>All Sessions & Records ({sessions.length})</span>
          </button>

          <button
            onClick={() => setCurrentTab("OD")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              currentTab === "OD"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>On-Duty Approvals</span>
          </button>
        </div>

        {/* TAB 1: LIVE SESSION VIEW */}
        {currentTab === "LIVE" && (
          <div>
            {activeSession ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left: Dynamic QR Generator (5 cols) */}
                <div className="lg:col-span-5">
                  <DynamicQRDisplay
                    sessionId={activeSession.id}
                    courseCode={activeSession.course.code}
                    courseName={activeSession.course.name}
                    sessionTitle={activeSession.title}
                    classroomName={activeSession.classroomName}
                  />
                </div>

                {/* Right: Live Monitor & Roster Feed (7 cols) */}
                <div className="lg:col-span-7">
                  <LiveAttendanceMonitor
                    sessionId={activeSession.id}
                    onSessionEnded={() => {
                      fetchSessions();
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center">
                <div className="h-14 w-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
                  <Play className="h-7 w-7" />
                </div>
                <h3 className="font-bold text-slate-800 text-base">No Class Session Active Right Now</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                  Click below to launch an attendance session. A live dynamic QR code will appear for students to scan.
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="mt-4 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs"
                >
                  Start a Class Session Now
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ALL SESSIONS & HISTORICAL RECORDS */}
        {currentTab === "SESSIONS" && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Attendance Session History</h3>
                <p className="text-xs text-slate-500">All lectures conducted and historical records</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 font-medium">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Course</th>
                    <th className="py-3 px-4">Lecture Title</th>
                    <th className="py-3 px-4">Classroom</th>
                    <th className="py-3 px-4">Attended</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sessions.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-medium text-slate-700">
                        {new Date(s.sessionDate).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900">{s.course.code}</span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">{s.title}</td>
                      <td className="py-3.5 px-4 text-slate-500">{s.classroomName || "N/A"}</td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-indigo-700">
                          {s.attendances?.length || 0} students
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            s.status === "ACTIVE"
                              ? "bg-emerald-100 text-emerald-800 animate-pulse"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {s.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        {s.status === "ACTIVE" ? (
                          <button
                            onClick={() => {
                              setActiveSession(s);
                              setCurrentTab("LIVE");
                            }}
                            className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold border border-indigo-200"
                          >
                            Open Live Screen
                          </button>
                        ) : (
                          <a
                            href={`/api/attendance/export?sessionId=${s.id}`}
                            target="_blank"
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold inline-flex items-center gap-1"
                          >
                            <Download className="h-3 w-3" /> Export CSV
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: ON-DUTY (OD) REVIEW CENTER */}
        {currentTab === "OD" && <ODManagement userRole="FACULTY" />}
      </main>

      {/* START NEW SESSION MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Play className="h-4 w-4 text-indigo-600" />
                Start Class Session & Launch QR
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSession} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Course / Subject *
                </label>
                <select
                  value={newCourseId}
                  onChange={(e) => setNewCourseId(e.target.value)}
                  required
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code}: {c.name} (Sem {c.semester})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Lecture / Session Topic *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lecture 16: Concurrency Control & Deadlocks"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Classroom / Hall Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Auditorium Hall 101"
                  value={newClassroom}
                  onChange={(e) => setNewClassroom(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-[11px] text-indigo-900 flex items-start gap-2">
                <Sparkles className="h-4 w-4 shrink-0 text-indigo-600 mt-0.5" />
                <span>
                  Anti-proxy protection will automatically activate with dynamic TOTP tokens rotating every 10 seconds.
                </span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingSession}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-md shadow-indigo-100"
                >
                  <Play className="h-3.5 w-3.5" />
                  <span>{creatingSession ? "Starting..." : "Launch QR Projector"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

