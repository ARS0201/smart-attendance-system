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
  User,
  Hash,
  Building2,
  UserPlus,
  LogIn,
} from "lucide-react";

export default function AuthPage() {
  const router = useRouter();
  const [authMode, setAuthMode] = useState<"LOGIN" | "SIGNUP">("LOGIN");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Signup form state
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("");
  const [signupRole, setSignupRole] = useState<"STUDENT" | "FACULTY">("STUDENT");
  const [signupRollNumber, setSignupRollNumber] = useState("");
  const [signupClassName, setSignupClassName] = useState("CSE-A");
  const [signupDepartment, setSignupDepartment] = useState("Computer Science & Engineering");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
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

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    if (signupPassword !== signupConfirmPassword) {
      setErrorMsg("Passwords do not match.");
      setLoading(false);
      return;
    }

    if (signupPassword.length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
      setLoading(false);
      return;
    }

    if (signupRole === "STUDENT" && !signupRollNumber.trim()) {
      setErrorMsg("Roll number is required for students.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: signupName,
          email: signupEmail,
          password: signupPassword,
          role: signupRole,
          rollNumber: signupRole === "STUDENT" ? signupRollNumber : null,
          className: signupRole === "STUDENT" ? signupClassName : null,
          department: signupDepartment,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Registration failed");
        setLoading(false);
        return;
      }

      setSuccessMsg("Account created! Redirecting to your dashboard...");
      setTimeout(() => {
        router.push(data.redirectUrl || "/");
        router.refresh();
      }, 1000);
    } catch (err: any) {
      setErrorMsg("Network error during registration.");
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 text-slate-100">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-500/30 mb-3 animate-bounce">
          <QrCode className="h-9 w-9" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white">SmartAttend</h1>
        <p className="mt-1 text-sm text-slate-400">
          Digital QR & On-Duty Attendance Platform for Colleges & Universities
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white text-slate-900 py-7 px-6 sm:px-9 shadow-2xl rounded-3xl border border-slate-200/80">
          {/* Mode Switcher Tabs (Sign In vs Sign Up) */}
          <div className="flex bg-slate-100 p-1 rounded-2xl mb-5 border border-slate-200">
            <button
              type="button"
              onClick={() => {
                setAuthMode("LOGIN");
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                authMode === "LOGIN"
                  ? "bg-white text-indigo-700 shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <LogIn className="h-3.5 w-3.5" />
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode("SIGNUP");
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                authMode === "SIGNUP"
                  ? "bg-white text-indigo-700 shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <UserPlus className="h-3.5 w-3.5" />
              Create Account
            </button>
          </div>

          {/* Alert Banners */}
          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium animate-in fade-in">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-1.5 animate-in fade-in">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* SIGN IN FORM */}
          {authMode === "LOGIN" ? (
            <>
              {/* Quick Demo Persona Section */}
              <div className="mb-5 p-3.5 rounded-2xl bg-indigo-50/80 border border-indigo-100">
                <span className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1 mb-2">
                  <Zap className="h-3.5 w-3.5 text-indigo-600" />
                  1-Click Instant Persona Login
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => handleQuickDemo("FACULTY")}
                    disabled={loading}
                    className="py-2 px-2.5 rounded-xl bg-white hover:bg-indigo-600 hover:text-white text-indigo-700 font-semibold border border-indigo-200 shadow-2xs transition-all flex flex-col items-center text-center group"
                  >
                    <span className="font-bold text-xs">Faculty Portal</span>
                    <span className="text-[10px] text-slate-400 group-hover:text-indigo-200">
                      Dr. Alan Turing
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickDemo("STUDENT")}
                    disabled={loading}
                    className="py-2 px-2.5 rounded-xl bg-white hover:bg-indigo-600 hover:text-white text-indigo-700 font-semibold border border-indigo-200 shadow-2xs transition-all flex flex-col items-center text-center group"
                  >
                    <span className="font-bold text-xs">Student Portal</span>
                    <span className="text-[10px] text-slate-400 group-hover:text-indigo-200">
                      John Doe (21CS001)
                    </span>
                  </button>
                </div>
              </div>

              <div className="relative my-3">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-[11px] uppercase">
                  <span className="bg-white px-2.5 text-slate-400 font-medium">Or Sign in with Registered ID</span>
                </div>
              </div>

              <form onSubmit={handleLogin} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      required
                      placeholder="name@smartattend.edu"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
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
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
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
            </>
          ) : (
            /* CREATE ACCOUNT (SIGN UP) FORM */
            <form onSubmit={handleSignup} className="space-y-3 animate-in fade-in">
              {/* Role Picker */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">I am registering as</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSignupRole("STUDENT")}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      signupRole === "STUDENT"
                        ? "bg-indigo-50 border-indigo-500 text-indigo-700 shadow-2xs"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <User className="h-3.5 w-3.5" />
                    Student
                  </button>
                  <button
                    type="button"
                    onClick={() => setSignupRole("FACULTY")}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      signupRole === "FACULTY"
                        ? "bg-indigo-50 border-indigo-500 text-indigo-700 shadow-2xs"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <GraduationCap className="h-3.5 w-3.5" />
                    Faculty
                  </button>
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <div className="relative">
                  <User className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alex Johnson"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                  />
                </div>
              </div>

              {/* Roll Number & Class Section (Students only) */}
              {signupRole === "STUDENT" && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Roll / Registration Number *</label>
                    <div className="relative">
                      <Hash className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. 21CS042"
                        value={signupRollNumber}
                        onChange={(e) => setSignupRollNumber(e.target.value)}
                        className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 uppercase"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Class / Section *</label>
                    <div className="relative">
                      <GraduationCap className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <select
                        value={signupClassName}
                        onChange={(e) => setSignupClassName(e.target.value)}
                        className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 bg-white font-semibold"
                      >
                        <option value="CSE-A">CSE - Section A</option>
                        <option value="CSE-B">CSE - Section B</option>
                        <option value="CSE-C">CSE - Section C</option>
                        <option value="IT-A">IT - Section A</option>
                        <option value="IT-B">IT - Section B</option>
                        <option value="ECE-A">ECE - Section A</option>
                        <option value="ECE-B">ECE - Section B</option>
                        <option value="EEE-A">EEE - Section A</option>
                        <option value="MECH-A">MECH - Section A</option>
                        <option value="CIVIL-A">CIVIL - Section A</option>
                        <option value="AIML-A">AI & ML - Section A</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {/* Department */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                <div className="relative">
                  <Building2 className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select
                    value={signupDepartment}
                    onChange={(e) => setSignupDepartment(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 bg-white"
                  >
                    <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                    <option value="Information Technology">Information Technology</option>
                    <option value="Electronics & Communication">Electronics & Communication</option>
                    <option value="Electrical & Electronics">Electrical & Electronics</option>
                    <option value="Mechanical Engineering">Mechanical Engineering</option>
                    <option value="Civil Engineering">Civil Engineering</option>
                  </select>
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Institutional Email</label>
                <div className="relative">
                  <Mail className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="alex@college.edu"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                  <div className="relative">
                    <Lock className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="password"
                      required
                      placeholder="Min 6 chars"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      className="w-full pl-8 pr-2.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm</label>
                  <div className="relative">
                    <Lock className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="password"
                      required
                      placeholder="Repeat"
                      value={signupConfirmPassword}
                      onChange={(e) => setSignupConfirmPassword(e.target.value)}
                      className="w-full pl-8 pr-2.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors shadow-md shadow-indigo-200 flex items-center justify-center gap-1.5"
              >
                <span>{loading ? "Registering in Database..." : "Register & Sign In"}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </form>
          )}

          {/* Footer note */}
          <div className="mt-5 pt-3 border-t border-slate-100 text-center text-[11px] text-slate-500">
            {authMode === "LOGIN" ? (
              <p>
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("SIGNUP");
                    setErrorMsg(null);
                  }}
                  className="font-bold text-indigo-600 hover:text-indigo-800 underline"
                >
                  Create one now
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("LOGIN");
                    setErrorMsg(null);
                  }}
                  className="font-bold text-indigo-600 hover:text-indigo-800 underline"
                >
                  Sign in here
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
