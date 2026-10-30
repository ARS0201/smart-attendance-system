"use client";

import React, { useState, useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import confetti from "canvas-confetti";
import {
  Camera,
  X,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  RefreshCw,
  ShieldAlert,
  Zap,
} from "lucide-react";

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  activeSessionId?: string;
  activeSessionTitle?: string;
}

export default function QRScannerModal({
  isOpen,
  onClose,
  onSuccess,
  activeSessionId,
  activeSessionTitle,
}: QRScannerModalProps) {
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<any | null>(null);
  const [cameraPermissionError, setCameraPermissionError] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const qrRegionId = "smart-attend-reader";

  useEffect(() => {
    if (isOpen && !successData) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, successData]);

  const startCamera = async () => {
    setErrorMsg(null);
    setCameraPermissionError(false);

    try {
      // Small timeout to ensure DOM element exists
      setTimeout(async () => {
        const element = document.getElementById(qrRegionId);
        if (!element) return;

        try {
          if (scannerRef.current) {
            await scannerRef.current.stop().catch(() => {});
          }

          const html5QrCode = new Html5Qrcode(qrRegionId);
          scannerRef.current = html5QrCode;

          await html5QrCode.start(
            { facingMode: "environment" },
            {
              fps: 10,
              qrbox: { width: 250, height: 250 },
              aspectRatio: 1.0,
            },
            (decodedText) => {
              handleQrDetected(decodedText);
            },
            (errorMessage) => {
              // Ignore standard frame-by-frame non-detection
            }
          );
          setScanning(true);
        } catch (camErr: any) {
          console.warn("Camera start failed, activating fallback testing mode:", camErr);
          setCameraPermissionError(true);
          setScanning(false);
        }
      }, 300);
    } catch (err) {
      setCameraPermissionError(true);
    }
  };

  const stopCamera = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        await scannerRef.current.clear();
      } catch (e) {
        // Safe ignore
      }
      scannerRef.current = null;
    }
    setScanning(false);
  };

  const handleQrDetected = async (rawQrString: string) => {
    stopCamera();
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/attendance/mark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          qrData: rawQrString,
          deviceInfo: navigator.userAgent.substring(0, 80),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Attendance marking failed.");
        setLoading(false);
        return;
      }

      // Celebrate success!
      setSuccessData(data.attendance);
      triggerConfetti();
      onSuccess();
    } catch (err: any) {
      setErrorMsg("Network error communicating with attendance server.");
    } finally {
      setLoading(false);
    }
  };

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#4f46e5", "#10b981", "#3b82f6", "#f59e0b"],
      });
    } catch (e) {
      // Safe ignore
    }
  };

  // Test Simulation helper: Fetches latest live token directly from session and verifies it
  const handleSimulateScan = async () => {
    if (!activeSessionId) {
      setErrorMsg("No active session ID specified for simulation.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      const tokenRes = await fetch(`/api/sessions/${activeSessionId}/token`);
      const tokenData = await tokenRes.json();

      if (!tokenRes.ok) {
        setErrorMsg(tokenData.error || "Failed to fetch live session token.");
        setLoading(false);
        return;
      }

      // Pass the live dynamic QR payload to mark attendance
      await handleQrDetected(tokenData.qrString);
    } catch (err: any) {
      setErrorMsg("Failed to simulate dynamic scan.");
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
              <Camera className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-base">QR Attendance Scanner</h3>
              <p className="text-xs text-slate-500">Scan faculty classroom projector</p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition-colors hover:bg-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 flex flex-col items-center">
          {successData ? (
            /* Instant Success Confirmation State */
            <div className="w-full flex flex-col items-center text-center py-4 space-y-4 animate-in zoom-in-95 duration-200">
              <div className="h-20 w-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-100 border-4 border-emerald-50">
                <CheckCircle2 className="h-12 w-12" />
              </div>

              <div>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-2">
                  <Sparkles className="h-3.5 w-3.5" /> Instant Confirmation
                </span>
                <h4 className="text-xl font-bold text-slate-900">Attendance Recorded!</h4>
                <p className="text-xs text-slate-600 mt-1">
                  Your attendance has been validated and recorded in the college database.
                </p>
              </div>

              {/* Record Summary Card */}
              <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-left space-y-2 text-xs">
                <div className="flex justify-between border-b border-slate-200/60 pb-2">
                  <span className="text-slate-500 font-medium">Course:</span>
                  <span className="font-bold text-slate-900">
                    {successData.courseCode} - {successData.courseName}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-2">
                  <span className="text-slate-500 font-medium">Session:</span>
                  <span className="font-semibold text-slate-800">{successData.sessionTitle}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-2">
                  <span className="text-slate-500 font-medium">Faculty:</span>
                  <span className="font-medium text-slate-700">{successData.facultyName}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-2">
                  <span className="text-slate-500 font-medium">Classroom:</span>
                  <span className="font-medium text-slate-700">{successData.classroom || "Assigned Hall"}</span>
                </div>
                <div className="flex justify-between items-center pt-1">
                  <span className="text-slate-500 font-medium">Recorded At:</span>
                  <span className="font-bold text-indigo-600 flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {new Date(successData.markedAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  setSuccessData(null);
                  onClose();
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-colors shadow-md shadow-indigo-100"
              >
                Done & Return to Dashboard
              </button>
            </div>
          ) : (
            /* Scanning / Camera Viewfinder State */
            <div className="w-full flex flex-col items-center">
              {/* Camera Region */}
              <div className="relative w-full max-w-[280px] aspect-square rounded-2xl overflow-hidden bg-slate-900 border-2 border-indigo-500 shadow-inner flex items-center justify-center">
                <div id={qrRegionId} className="w-full h-full" />

                {loading && (
                  <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center text-white text-xs gap-2">
                    <RefreshCw className="h-8 w-8 animate-spin text-indigo-400" />
                    <span>Verifying dynamic session token...</span>
                  </div>
                )}

                {/* Target overlay guide */}
                {scanning && !loading && (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="w-48 h-48 border-2 border-dashed border-indigo-400/80 rounded-xl animate-pulse" />
                  </div>
                )}
              </div>

              {/* Error Alert */}
              {errorMsg && (
                <div className="w-full mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start gap-2 text-left">
                  <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
                  <div>
                    <span className="font-bold">Scan Rejected:</span> {errorMsg}
                  </div>
                </div>
              )}

              {/* Camera Unavailable / Desktop Fallback Guidance */}
              {cameraPermissionError && (
                <div className="w-full mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-start gap-2 text-left">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
                  <div>
                    <span className="font-bold">Camera hardware or permission unavailable.</span> Use the instant scan simulator below for testing without webcam.
                  </div>
                </div>
              )}

              {/* Anti-Proxy Guidance Notice */}
              <p className="text-[11px] text-slate-500 mt-3 text-center">
                Point your camera at the faculty screen. Dynamic QR tokens rotate automatically every few seconds to prevent screenshot sharing.
              </p>

              {/* Fast Simulation Trigger for Testing */}
              {activeSessionId && (
                <div className="w-full mt-4 pt-3 border-t border-slate-100 flex flex-col items-center">
                  <button
                    onClick={handleSimulateScan}
                    disabled={loading}
                    className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border border-slate-200"
                  >
                    <Zap className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                    <span>Instant Check-in Simulator ({activeSessionTitle || "Active Class"})</span>
                  </button>
                  <span className="text-[10px] text-slate-600 mt-1">
                    Simulates capturing live TOTP QR token directly from the session
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

