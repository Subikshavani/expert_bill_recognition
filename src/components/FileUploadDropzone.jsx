import { UploadCloud } from "lucide-react";
import { useRef } from "react";

export default function FileUploadDropzone({ files, setFiles, label = "Upload Bill" }) {
  const inputRef = useRef(null);

  const handleFiles = (selected) => {
    if (!selected?.length) {
      return;
    }

    setFiles((prev) => [...prev, ...Array.from(selected)]);
  };

  return (
    <div className="space-y-3">
      <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</label>
      <div
        className="panel rounded-2xl border-2 border-dashed border-slate-300 p-6 text-center dark:border-slate-600"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          handleFiles(event.dataTransfer.files);
        }}
      >
        <UploadCloud className="mx-auto h-10 w-10 text-brand-600" />
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
          Drag and drop files here or browse from your device
        </p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-4 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          Browse Files
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.png,.jpg,.jpeg"
          className="hidden"
          onChange={(event) => handleFiles(event.target.files)}
        />
      </div>
      {!!files.length && (
        <ul className="panel rounded-xl p-3 text-sm text-slate-600 dark:text-slate-300">
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
