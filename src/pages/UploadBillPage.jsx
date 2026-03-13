import { useState } from "react";
import { apiFetch } from "../api/client";
import Button from "../components/Button";
import FileUpload from "../components/FileUpload";
import FormInput from "../components/FormInput";

const initialForm = {
  billNumber: "",
  vendorName: "",
  category: "Fuel",
  amount: "",
  date: "",
  department: "",
};

export default function UploadBillPage() {
  const [billFiles, setBillFiles] = useState([]);
  const [supportFiles, setSupportFiles] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [ocrRawText, setOcrRawText] = useState("");
  const [error, setError] = useState("");

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
    const formData = new FormData();
    Object.entries(form).forEach(([key, val]) => formData.append(key, val));
    billFiles.forEach((file) => formData.append("billFile", file));
    supportFiles.forEach((file) => formData.append("supportFile", file));

    setSubmitting(true);
    try {
      await apiFetch("/bills", { method: "POST", body: formData });
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setBillFiles([]);
        setSupportFiles([]);
        setForm(initialForm);
        setOcrRawText("");
        setError("");
      }, 2200);
    } catch (err) {
      setError(`Upload failed: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="panel rounded-2xl p-6 shadow-panel">
      <h2 className="page-title text-2xl font-bold text-slate-800">Bill Upload</h2>
      <p className="mt-1 text-sm text-slate-400">Scan and submit expense bills with supporting documentation.</p>

      <form className="mt-6 space-y-6" onSubmit={submitBill}>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          <FormInput
            label="Bill Number"
            value={form.billNumber}
            onChange={(event) => setForm((prev) => ({ ...prev, billNumber: event.target.value }))}
            placeholder="EXP-2026-201"
            required
          />
          <FormInput
            label="Vendor Name"
            value={form.vendorName}
            onChange={(event) => setForm((prev) => ({ ...prev, vendorName: event.target.value }))}
            placeholder="Vendor"
            required
          />

          <label className="space-y-2 text-sm">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Expense Category</span>
            <select
              value={form.category}
              onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800"
            >
              <option>Fuel</option>
              <option>Hotel</option>
              <option>Courier</option>
              <option>Travel</option>
            </select>
          </label>

          <FormInput
            label="Amount"
            type="number"
            value={form.amount}
            onChange={(event) => setForm((prev) => ({ ...prev, amount: event.target.value }))}
            placeholder="0.00"
            required
          />
          <FormInput
            label="Date"
            type="date"
            value={form.date}
            onChange={(event) => setForm((prev) => ({ ...prev, date: event.target.value }))}
            required
          />
          <FormInput
            label="Department"
            value={form.department}
            onChange={(event) => setForm((prev) => ({ ...prev, department: event.target.value }))}
            placeholder="Operations"
            required
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <FileUpload files={billFiles} setFiles={setBillFiles} label="Bill Image / PDF" />
          <FileUpload files={supportFiles} setFiles={setSupportFiles} label="Supporting Documents" />
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

        {error ? <p className="text-sm text-blue-300">{error}</p> : null}

        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" disabled={submitting} className="rounded-xl bg-blue-500 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60">
            {submitting ? "Submitting..." : "Submit Bill"}
          </button>
          {submitted ? <p className="text-sm text-blue-300">Bill submitted successfully for approval.</p> : null}
        </div>
      </form>
    </section>
  );
}

