import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../api/client";
import Button from "../components/Button";
import FileUpload from "../components/FileUpload";
import { getActiveSession } from "../api/tripSession";

const initialForm = {
  billNumber: "",
  vendorName: "",
  category: "Fuel",
  amount: "",
  date: "",
  notes: "",
};

export default function EmployeeUploadBillPage({ user }) {
  const [billFiles, setBillFiles] = useState([]);
  const [supportFiles, setSupportFiles] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [ocrRawText, setOcrRawText] = useState("");
  const [error, setError] = useState("");

  const [session, setSession] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(true);

  useEffect(() => {
    if (!user?.email) return;
    getActiveSession(user.email)
      .then((s) => setSession(s))
      .catch(() => setSession(null))
      .finally(() => setSessionLoading(false));
  }, [user?.email]);

  const scanBillWithOcr = async () => {
    if (!billFiles.length) {
      setError("Please upload a bill image or PDF before scanning.");
      return;
    }

    setError("");
    setOcrRawText("");
    setScanning(true);

    try {
      const payload = new FormData();
      payload.append("billFile", billFiles[0]);
      const result = await apiFetch("/ocr-bill", { method: "POST", body: payload });

      setForm((prev) => ({
        ...prev,
        vendorName: result.vendor || prev.vendorName,
        billNumber: result.billNumber || prev.billNumber,
        date: result.date || prev.date || new Date().toISOString().slice(0, 10),
        amount: result.amount != null ? String(result.amount) : prev.amount,
        category: result.category || prev.category,
      }));

      if (result.rawText) {
        setOcrRawText(result.rawText);
      }
    } catch (err) {
      setError(err.message || "Failed to scan bill.");
    } finally {
      setScanning(false);
    }
  };

  const submitBill = async (event) => {
    event.preventDefault();
    setError("");

    if (!billFiles.length) {
      setError("Please upload a bill file before submitting.");
      return;
    }

    if (!form.billNumber || !form.vendorName || !form.amount || !form.date) {
      setError("Scan the bill first so Bill Number, Vendor, Amount, and Date can be extracted.");
      return;
    }

    const formData = new FormData();
    Object.entries(form).forEach(([key, val]) => formData.append(key, val));
    formData.append("department", user?.department || "General");
    formData.append("employeeEmail", user?.email || "");
    formData.append("employeeName", user?.name || "");
    if (session?.sessionId) formData.append("sessionId", session.sessionId);
    billFiles.forEach((file) => formData.append("billFile", file));
    supportFiles.forEach((file) => formData.append("supportFile", file));

    setSubmitting(true);
    try {
      await apiFetch("/employee/bills", { method: "POST", body: formData });
      setSubmitted(true);
      setForm(initialForm);
      setBillFiles([]);
      setSupportFiles([]);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (sessionLoading) {
    return (
      <section className="panel rounded-2xl p-6 shadow-panel flex items-center justify-center min-h-[200px]">
        <p className="text-slate-400 text-sm">Checking trip session...</p>
      </section>
    );
  }

  const hasActiveSession = session && session.sessionStatus === "Active";

  if (!hasActiveSession) {
    return (
      <section className="panel rounded-2xl p-6 shadow-panel space-y-4">
        <h2 className="page-title text-2xl font-bold text-slate-800 dark:text-slate-100">Upload Bill</h2>
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800/40 p-8 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
          <p className="text-base font-semibold text-blue-700 dark:text-blue-400">
            No Active Trip Session
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">
            Trip session ended. Bill uploads are no longer allowed. Please start a new trip session from the dashboard before submitting bills.
          </p>
          <Link
            to="/employee"
            className="mt-2 inline-flex items-center gap-2 rounded-xl bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-600 transition-colors"
          >
            Go to Dashboard
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="panel rounded-2xl p-6 shadow-panel">
      <h2 className="page-title text-2xl font-bold text-slate-800">Upload Bill</h2>
      <p className="mt-1 text-sm text-slate-400">Submit your bill for approval workflow.</p>

      <form className="mt-6 space-y-6" onSubmit={submitBill}>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-2 text-sm">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Date</span>
            <input
              type="date"
              value={form.date}
              onChange={(event) => setForm((prev) => ({ ...prev, date: event.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800"
              required
            />
          </label>

          <label className="space-y-2 text-sm md:col-span-2 lg:col-span-3">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Optional Notes</span>
            <textarea
              value={form.notes}
              onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
              rows={3}
              placeholder="Add context for approvers (trip purpose, invoice remarks, etc.)"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800"
            />
          </label>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <FileUpload files={billFiles} setFiles={setBillFiles} label="Upload Bill File" />
          <FileUpload files={supportFiles} setFiles={setSupportFiles} label="Upload Supporting Documents" />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" variant="secondary" onClick={scanBillWithOcr} disabled={scanning || !billFiles.length}>
            {scanning ? "Scanning Bill..." : "Scan Bill"}
          </Button>
          {scanning ? <p className="text-sm text-blue-500">Running OCR and extracting bill fields...</p> : null}
        </div>

        {ocrRawText ? (
          <details className="rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs text-slate-600">
            <summary className="cursor-pointer text-blue-500">View OCR extracted raw text</summary>
            <pre className="mt-2 max-h-36 overflow-auto whitespace-pre-wrap">{ocrRawText}</pre>
          </details>
        ) : null}

        {(form.billNumber || form.vendorName || form.amount || form.category) ? (
          <div className="rounded-xl border border-blue-200/30 bg-blue-500/5 p-3 text-xs text-slate-600">
            <p className="font-semibold text-blue-500 mb-2">Extracted From OCR</p>
            <div className="grid gap-2 md:grid-cols-2">
              <p>Bill Number: <span className="text-slate-300">{form.billNumber || "-"}</span></p>
              <p>Vendor: <span className="text-slate-300">{form.vendorName || "-"}</span></p>
              <p>Amount: <span className="text-slate-300">{form.amount || "-"}</span></p>
              <p>Category: <span className="text-slate-300">{form.category || "-"}</span></p>
            </div>
          </div>
        ) : null}

        {error ? <p className="text-sm text-blue-300">{error}</p> : null}

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit Bill"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setForm(initialForm);
              setBillFiles([]);
              setSupportFiles([]);
              setSubmitted(false);
              setError("");
            }}
          >
            Reset
          </Button>
          {submitted ? <p className="text-sm text-blue-300">Bill submitted successfully.</p> : null}
        </div>
      </form>
    </section>
  );
}

