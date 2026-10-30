"use client";

import React, { useState, useEffect, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  ShieldCheck,
  RefreshCw,
  Maximize2,
  Minimize2,
  Clock,
  Sparkles,
  MapPin,
  Lock,
} from "lucide-react";

interface DynamicQRDisplayProps {
  sessionId: string;
  courseCode: string;
  courseName: string;
  sessionTitle: string;
  classroomName?: string | null;
}

export default function DynamicQRDisplay({
  sessionId,
  courseCode,
  courseName,
  sessionTitle,
  classroomName,
}: DynamicQRDisplayProps) {
  const [qrString, setQrString] = useState<string>("");
  const [token, setToken] = useState<string>("");
  const [countdown, setCountdown] = useState<number>(10);
  const [loading, setLoading] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch token function
  const fetchToken = async () => {
    try {
      const res = await fetch(`/api/sessions/${sessionId}/token`);
      const data = await res.json();
      if (res.ok && data.qrString) {
        setQrString(data.qrString);
        setToken(data.token);
        setCountdown(data.remainingSeconds || 10);
      }
    } catch (err) {
      console.error("Failed to fetch dynamic QR token:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchToken();

    // 1-second interval to tick down countdown and refresh when 0
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchToken();
          return 10;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [sessionId]);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`flex flex-col items-center justify-center p-6 bg-white rounded-3xl border border-slate-200 shadow-sm transition-all duration-300 ${
        isFullscreen
          ? "fixed inset-0 z-50 rounded-none border-none p-12 bg-slate-950 text-white flex justify-center"
          : ""
      }`}
    >
      {/* Top Banner / Session Info */}
      <div className="w-full flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase ${
              isFullscreen
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                : "bg-emerald-50 text-emerald-700 border border-emerald-200"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Session
          </span>

          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
              isFullscreen
                ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                : "bg-indigo-50 text-indigo-700 border border-indigo-200"
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5" /> Dynamic Anti-Proxy
          </span>
        </div>

        <button
          onClick={toggleFullscreen}
          title={isFullscreen ? "Exit Projector Mode" : "Full-screen Projector View"}
          className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
            isFullscreen
              ? "bg-slate-800 hover:bg-slate-700 text-white border border-slate-700"
              : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
          }`}
        >
          {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          <span className="hidden sm:inline">
            {isFullscreen ? "Exit Projector" : "Projector View"}
          </span>
        </button>
      </div>

      {/* Session Title Header */}
      <div className="text-center mb-5">
        <h2
          className={`font-bold tracking-tight ${
            isFullscreen ? "text-3xl text-white" : "text-xl text-slate-900"
          }`}
        >
          {courseCode}: {courseName}
        </h2>
        <p
          className={`text-sm mt-1 flex items-center justify-center gap-2 ${
            isFullscreen ? "text-slate-300" : "text-slate-600"
          }`}
        >
          <span className="font-semibold">{sessionTitle}</span>
          {classroomName && (
            <span className="flex items-center gap-1 text-xs opacity-80">
              • <MapPin className="h-3.5 w-3.5" /> {classroomName}
            </span>
          )}
        </p>
      </div>

      {/* Dynamic QR Code Canvas Box */}
      <div
        className={`relative p-5 rounded-3xl transition-all flex flex-col items-center justify-center ${
          isFullscreen
            ? "bg-white p-8 shadow-2xl shadow-indigo-500/20 border-4 border-indigo-500/30"
            : "bg-slate-50 border-2 border-dashed border-indigo-200 p-6"
        }`}
      >
        {loading || !qrString ? (
          <div className="w-64 h-64 flex flex-col items-center justify-center text-slate-400 gap-2">
            <RefreshCw className="h-8 w-8 animate-spin text-indigo-500" />
            <span className="text-xs">Generating dynamic HMAC token...</span>
          </div>
        ) : (
          <QRCodeSVG
            value={qrString}
            size={isFullscreen ? 360 : 240}
            level="M"
            includeMargin={true}
            className="rounded-xl shadow-xs"
          />
        )}

        {/* Security Token Tag */}
        <div className="mt-3 flex items-center gap-2">
          <div className="px-3 py-1 bg-slate-900 text-white rounded-lg text-xs font-mono font-bold tracking-wider flex items-center gap-1 shadow-xs">
            <Lock className="h-3 w-3 text-indigo-400" />
            OTP: {token || "--------"}
          </div>
        </div>
      </div>

      {/* Dynamic Refresh Bar & Countdown */}
      <div className="w-full max-w-xs mt-5 flex flex-col items-center space-y-2">
        <div className="w-full flex items-center justify-between text-xs font-medium">
          <span
            className={`flex items-center gap-1 ${
              isFullscreen ? "text-slate-400" : "text-slate-500"
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            Next Token Rotation:
          </span>
          <span className="font-bold font-mono text-indigo-600 dark:text-indigo-400">
            {countdown}s
          </span>
        </div>

        {/* Visual Progress Bar */}
        <div
          className={`w-full h-2 rounded-full overflow-hidden ${
            isFullscreen ? "bg-slate-800" : "bg-slate-200"
          }`}
        >
          <div
            className="h-full bg-indigo-600 transition-all duration-1000 ease-linear rounded-full"
            style={{ width: `${(countdown / 10) * 100}%` }}
          />
        </div>

        <p
          className={`text-[11px] text-center ${
            isFullscreen ? "text-slate-400" : "text-slate-500"
          }`}
        >
          Tokens rotate every 10 seconds. Students must scan directly from this screen.
        </p>
      </div>
    </div>
  );
}

