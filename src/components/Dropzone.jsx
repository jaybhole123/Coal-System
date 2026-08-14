import { useRef } from "react";

/**
 * Dropzone — handles drag-and-drop + click-to-browse for PDF files.
 *
 * Props:
 *   onFile(file)    — called when a valid file is chosen
 *   loading         — bool, shows wagon animation while parsing
 *   loadingName     — string, filename currently being parsed
 *   error           — string | null, error message to show
 */
export default function Dropzone({ onFile, loading, loadingName, error, title = "Payment Advice PDF yahan drop karein", icon = "⛃" }) {
  const inputRef = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove("drag");
    const file = e.dataTransfer.files?.[0];
    if (file) onFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add("drag");
  };

  const handleDragLeave = (e) => {
    e.currentTarget.classList.remove("drag");
  };

  const handleClick = () => inputRef.current?.click();

  const handleChange = (e) => {
    const file = e.target.files?.[0];
    if (file) onFile(file);
    // reset so the same file can be re-selected
    e.target.value = "";
  };

  return (
    <section
      id="dropzone"
      className={`dropzone${error ? " err" : ""}`}
      onClick={handleClick}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      role="button"
      tabIndex={0}
      aria-label="Click or drop a PDF to upload"
      onKeyDown={(e) => e.key === "Enter" && handleClick()}
    >
      <input
        ref={inputRef}
        id="fileInput"
        type="file"
        accept="application/pdf,.pdf"
        hidden
        onChange={handleChange}
      />

      {loading ? (
        /* ── Loading state ── */
        <div id="dzLoading">
          <div className="wagon-loader">
            <div className="wagon" />
          </div>
          <p className="dz-title">Reading {loadingName}…</p>
          <p className="dz-sub">Data extract ho raha hai, ek second…</p>
        </div>
      ) : (
        /* ── Idle state ── */
        <div id="dzIdle">
          <div className="dz-icon">{icon}</div>
          <p className="dz-title">{title}</p>
          <p className="dz-sub">upload</p>
          {error && (
            <p id="dzError" className="dz-error" role="alert">
              {error}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
