import { useState, useRef } from "react";
import { COLS } from "../utils/seclParser";
import { InfoCard } from "./Cards";

export default function SECLIntimationResults({ data, fileName, onReset, onAddFiles, onExportJson, onExportCsv }) {
  const dataArray = Array.isArray(data) ? data : [data];
  const firstData = dataArray[0];
  const { meta } = firstData;
  const allItems = dataArray.flatMap(d => d.items || []);
  const [activeTab, setActiveTab] = useState("table");
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []).filter(f => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"));
    if (files.length > 0 && onAddFiles) onAddFiles(files);
    e.target.value = "";
  };

  return (
    <section id="results">
      {/* ── Action bar ── */}
      <div className="results-bar">
        <div>
          <div className="results-file" id="resFileName">{fileName}</div>
          <div className="results-hint">SECL Intimation Extracted</div>
        </div>
        <div className="results-actions">
          <button className="btn" onClick={onExportJson}>
            ↓ Export JSON
          </button>
          <button className="btn" onClick={onExportCsv}>
            ↓ Export CSV
          </button>
          <button className="btn ghost" onClick={onReset}>
            START OVER
          </button>
          <input type="file" multiple ref={fileInputRef} onChange={handleFileChange} style={{ display: "none" }} accept=".pdf" />
          <button className="btn" onClick={() => fileInputRef.current?.click()}>
            ADD PDF
          </button>
        </div>
      </div>

      <div className="results-content">
        <div className="summary-section" style={{ marginTop: 0 }}>
          <div className="summary-header">
            <div className="summary-title">Extracted Items</div>
          </div>
          <div className="summary-table-wrap">
            {allItems && allItems.length > 0 ? (
              <table className="stable">
                <thead>
                  <tr>
                    {COLS.map((c) => (
                      <th key={c.label}>{c.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allItems.map((row, i) => (
                    <tr key={i}>
                      {COLS.map((c) => (
                        <td key={c.label}>{row[c.label] || "—"}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ padding: 20, textAlign: "center", color: "var(--text-muted)" }}>
                No items found in the PDF.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
