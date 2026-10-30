import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  QrCode,
  ShieldCheck,
  Smartphone,
  FileCheck2,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getCurrentUser();

  if (user) {
    if (user.role === "FACULTY") {
      redirect("/faculty");
    } else if (user.role === "ADMIN") {
      redirect("/admin");
    } else {
      redirect("/student");
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
              <QrCode className="h-6 w-6" />
            </div>
            <span className="font-bold text-lg tracking-tight">SmartAttend</span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-md shadow-indigo-600/30 transition-all hover:scale-102"
            >
              Sign In to Portal
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-950 border border-indigo-700/60 text-indigo-300 text-xs font-semibold mb-6 animate-pulse">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Next-Generation Digital Attendance & OD System</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight">
          Reclaim Classroom Time with{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-sky-300 to-indigo-200">
            Smart Dynamic QR Attendance
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Replace tedious manual roll calls with rotating anti-proxy QR codes. Students scan from mobile, faculty monitor in real-time, and On-Duty requests process seamlessly.
        </p>

        {/* Action Portal Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/login"
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 transition-all hover:scale-102 flex items-center justify-center gap-2"
          >
            <span>Launch Smart Attendance</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Feature Highlights Grid */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-3xl p-6 backdrop-blur-xs">
            <div className="h-12 w-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4 border border-indigo-500/30">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-lg text-white">Dynamic Anti-Proxy QR</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Cryptographically signed TOTP tokens rotate every 10 seconds. Absent friends cannot mark attendance using forwarded screenshots.
            </p>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/60 rounded-3xl p-6 backdrop-blur-xs">
            <div className="h-12 w-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4 border border-emerald-500/30">
              <Smartphone className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-lg text-white">Zero App Installation</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Students scan directly using browser camera WebRTC streams. Instant confirmation with sub-second database validation and confetti celebration.
            </p>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/60 rounded-3xl p-6 backdrop-blur-xs">
            <div className="h-12 w-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-4 border border-amber-500/30">
              <FileCheck2 className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-lg text-white">Automated On-Duty (OD)</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Students upload event proofs digitally. Once faculty approves, absent lecture records automatically convert to On-Duty credits.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-500">
        <p>© 2026 Smart Attendance System. Built with Next.js, Prisma, and Tailwind CSS.</p>
      </footer>
    </div>
  );
}
