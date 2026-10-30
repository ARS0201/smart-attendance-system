"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
  ShieldAlert,
  Send,
  Calendar,
  Tag,
  User,
  Filter,
} from "lucide-react";

interface ODManagementProps {
  userRole: "STUDENT" | "FACULTY" | "ADMIN";
}

export default function ODManagement({ userRole }: ODManagementProps) {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [reviewRemarks, setReviewRemarks] = useState<{ [key: string]: string }>({});
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // New OD Form State
  const [formData, setFormData] = useState({
    title: "",
    category: "ACADEMIC",
    fromDate: "",
    toDate: "",
    reason: "",
    documentUrl: "",
  });

  const fetchOds = async () => {
    try {
      const url = filterStatus === "ALL" ? "/api/od-requests" : `/api/od-requests?status=${filterStatus}`;
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok && data.success) {
        setRequests(data.odRequests);
      }
    } catch (err) {
      console.error("Failed to fetch OD requests:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOds();
  }, [filterStatus]);

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setActionMessage(null);

    try {
      const res = await fetch("/api/od-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to submit OD request");
        return;
      }

      setShowApplyModal(false);
      setFormData({
        title: "",
        category: "ACADEMIC",
        fromDate: "",
        toDate: "",
        reason: "",
        documentUrl: "",
      });
      setActionMessage("On-Duty request submitted successfully!");
      fetchOds();
    } catch (err: any) {
      alert("Submission error: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReview = async (id: string, status: "APPROVED" | "REJECTED") => {
    setReviewingId(id);
    try {
      const remarks = reviewRemarks[id] || (status === "APPROVED" ? "Approved by faculty" : "Rejected");
      const res = await fetch(`/api/od-requests/${id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, remarks }),
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage(data.message || `Request ${status.toLowerCase()}`);
        await fetchOds();
      } else {
        alert(data.error || "Failed to update OD status");
      }
    } catch (err: any) {
      alert("Review error: " + err.message);
    } finally {
      setReviewingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Message Banner */}
      {actionMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-2xl flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-emerald-600" />
            <span>{actionMessage}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="text-emerald-700 hover:text-emerald-900 text-xs font-bold">
            Dismiss
          </button>
        </div>
      )}

      {/* Top Header & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="h-6 w-6 text-indigo-600" />
            {userRole === "STUDENT" ? "My On-Duty (OD) Requests" : "On-Duty (OD) Review Center"}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {userRole === "STUDENT"
              ? "Submit official leave applications with event documentation for attendance credit"
              : "Review and grant On-Duty approvals with automated attendance credit adjustment"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-medium border border-slate-200">
            <Filter className="h-3.5 w-3.5 text-slate-400 ml-1.5" />
            {(["ALL", "PENDING", "APPROVED", "REJECTED"] as const).map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  filterStatus === st
                    ? "bg-white text-indigo-700 font-bold shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Student "Apply OD" button */}
          {userRole === "STUDENT" && (
            <button
              onClick={() => setShowApplyModal(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-sm shadow-indigo-200 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Apply for OD</span>
            </button>
          )}
        </div>
      </div>

      {/* OD Request Cards Grid */}
      {loading ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-xs text-slate-400">
          <Clock className="h-6 w-6 animate-spin mx-auto mb-2 text-indigo-500" />
          Loading On-Duty applications...
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center text-xs text-slate-500">
          <FileText className="h-10 w-10 mx-auto mb-2 text-slate-300" />
          <p className="font-semibold text-slate-700">No On-Duty requests found</p>
          <p className="mt-1">
            {userRole === "STUDENT"
              ? "You haven't submitted any OD applications for the selected filter."
              : "No pending or historical OD submissions matching this criteria."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {requests.map((od) => (
            <div
              key={od.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
            >
              <div>
                {/* Card Top: Category & Status */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-100">
                    <Tag className="h-3 w-3" />
                    {od.category}
                  </span>

                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                      od.status === "APPROVED"
                        ? "bg-emerald-100 text-emerald-800"
                        : od.status === "REJECTED"
                        ? "bg-rose-100 text-rose-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {od.status === "APPROVED" && <CheckCircle className="h-3 w-3" />}
                    {od.status === "REJECTED" && <XCircle className="h-3 w-3" />}
                    {od.status === "PENDING" && <Clock className="h-3 w-3" />}
                    {od.status}
                  </span>
                </div>

                {/* Title & Student Name (if Faculty/Admin) */}
                <h4 className="font-bold text-slate-900 text-sm">{od.title}</h4>

                {userRole !== "STUDENT" && od.student && (
                  <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-200/60">
                    <User className="h-3.5 w-3.5 text-slate-400" />
                    <span className="font-semibold text-slate-800">{od.student.name}</span>
                    <span className="text-slate-400 font-mono">({od.student.rollNumber || "No Roll"})</span>
                    <span className="text-slate-400">• {od.student.department.split(" ")[0]}</span>
                  </div>
                )}

                {/* Date Duration */}
                <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-2.5">
                  <Calendar className="h-3.5 w-3.5 text-indigo-500" />
                  <span className="font-medium">
                    {new Date(od.fromDate).toLocaleDateString()} —{" "}
                    {new Date(od.toDate).toLocaleDateString()}
                  </span>
                </div>

                {/* Reason description */}
                <p className="text-xs text-slate-600 mt-2 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                  {od.reason}
                </p>

                {/* Document Attachment Link */}
                {od.documentUrl && (
                  <div className="mt-2.5">
                    <a
                      href={od.documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
                    >
                      <ExternalLink className="h-3 w-3" />
                      View Verification Proof Document
                    </a>
                  </div>
                )}

                {/* Reviewer Note / Remarks */}
                {od.remarks && (
                  <div className="mt-3 p-2 bg-slate-100/80 rounded-xl text-[11px] text-slate-700 border border-slate-200">
                    <span className="font-semibold">Faculty Remark:</span> {od.remarks}
                  </div>
                )}
              </div>

              {/* Faculty Action Controls (if PENDING) */}
              {userRole !== "STUDENT" && od.status === "PENDING" && (
                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                  <input
                    type="text"
                    placeholder="Optional review remark..."
                    value={reviewRemarks[od.id] || ""}
                    onChange={(e) =>
                      setReviewRemarks({ ...reviewRemarks, [od.id]: e.target.value })
                    }
                    className="w-full text-xs px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleReview(od.id, "APPROVED")}
                      disabled={reviewingId === od.id}
                      className="flex-1 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-1 transition-colors shadow-xs"
                    >
                      <CheckCircle className="h-3.5 w-3.5" />
                      <span>{reviewingId === od.id ? "Updating..." : "Approve OD"}</span>
                    </button>
                    <button
                      onClick={() => handleReview(od.id, "REJECTED")}
                      disabled={reviewingId === od.id}
                      className="flex-1 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Student Apply Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <FileText className="h-5 w-5 text-indigo-600" />
                Submit On-Duty (OD) Request
              </h3>
              <button
                onClick={() => setShowApplyModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleApplySubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Event / Activity Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ACM Inter-University Coding Hackathon"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="ACADEMIC">Academic / Conference</option>
                    <option value="SPORTS">Sports Tournament</option>
                    <option value="CULTURAL">Cultural Event</option>
                    <option value="MEDICAL">Medical Leave</option>
                    <option value="INTERNSHIP">Official Internship</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Proof Document Link / URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://drive.google.com/proof.pdf"
                    value={formData.documentUrl}
                    onChange={(e) => setFormData({ ...formData, documentUrl: e.target.value })}
                    className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">From Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.fromDate}
                    onChange={(e) => setFormData({ ...formData, fromDate: e.target.value })}
                    className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">To Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.toDate}
                    onChange={(e) => setFormData({ ...formData, toDate: e.target.value })}
                    className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Detailed Reason & Purpose *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe your role, event venue, and faculty/faculty coordinator approval details..."
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-sm shadow-indigo-100"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>{submitting ? "Submitting..." : "Submit Application"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

