import { FileUp, ImageIcon } from "lucide-react";
import { useMemo, useRef } from "react";

export default function FileUpload({ files, setFiles, label = "Upload files" }) {
  const inputRef = useRef(null);

  const preview = useMemo(() => {
    if (!files.length) return null;
    const first = files[0];
    if (!first.type?.startsWith("image/")) return null;
    return URL.createObjectURL(first);
  }, [files]);

  const handleFiles = (selected) => {
    if (!selected?.length) return;
    setFiles((prev) => [...prev, ...Array.from(selected)]);
  };

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <div
        className="group rounded-2xl border border-dashed border-blue-400/35 bg-slate-50 p-6 text-center transition hover:border-blue-300 hover:bg-blue-300/5"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          handleFiles(event.dataTransfer.files);
        }}
      >
        <FileUp className="mx-auto h-10 w-10 text-blue-500 transition group-hover:scale-105" />
        <p className="mt-3 text-sm text-slate-600">Drag and drop PDF/JPG/PNG here</p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-4 rounded-xl border border-blue-400/30 bg-blue-400/10 px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-400/20"
        >
          Browse Files
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg"
          multiple
          className="hidden"
          onChange={(event) => handleFiles(event.target.files)}
        />
      </div>

      {preview ? (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white p-2">
          <img src={preview} alt="Bill preview" className="h-44 w-full rounded-lg object-cover" />
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-400">
          <ImageIcon className="h-4 w-4" />
          Preview available for image files
        </div>
      )}

      {!!files.length && (
        <ul className="rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-600">
          {files.map((file) => (
            <li key={`${file.name}-${file.size}`} className="py-1">
              {file.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

