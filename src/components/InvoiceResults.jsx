import { useRef, useState } from "react";
import { INVOICE_COLS } from "../utils/invoiceParser";
import EditModal from "./EditModal";
import { exportToExcel, exportToPDF } from "../utils/exportHelpers";

export default function InvoiceResults({ data, fileName, onReset, onAddFiles, onExportJson, onExportCsv, onSave, onDeleteRow, onUpdateRow, onAddManual }) {
  const dataArray = Array.isArray(data) ? data : [data];
  const allItems = dataArray;
  const fileInputRef = useRef(null);
  const [editingIndex, setEditingIndex] = useState(null);

  const handleEditClick = (index) => {
    setEditingIndex(index);
  };

  const handleSaveEdit = (updatedData) => {
    onUpdateRow && onUpdateRow(editingIndex, updatedData);
    setEditingIndex(null);
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []).filter(f => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"));
    if (files.length > 0 && onAddFiles) onAddFiles(files);
    e.target.value = "";
  };

  const handleExportExcel = () => {
    exportToExcel(allItems, INVOICE_COLS, fileName || "invoices");
  };

  const handleExportPdf = () => {
    exportToPDF(allItems, INVOICE_COLS, fileName || "invoices", "Invoices Summary");
  };

  return (
    <section id="results">
      {/* ── Action bar ── */}
      <div className="results-bar">
        <div>
          <div className="results-file" id="resFileName">{fileName}</div>
          <div className="results-hint">Invoice Extracted</div>
        </div>
        <div className="results-actions" style={{ display: "flex", gap: "8px", alignItems: "center" }}>

          <button 
            className="btn ghost" 
            onClick={handleExportExcel} 
            style={{ 
              borderColor: "#107c41", 
              color: "#107c41", 
              display: "inline-flex", 
              alignItems: "center", 
              gap: "6px",
              background: "rgba(16, 124, 65, 0.04)"
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="8" y1="13" x2="16" y2="13"></line>
              <line x1="8" y1="17" x2="16" y2="17"></line>
            </svg>
            EXCEL
          </button>
          <button 
            className="btn ghost" 
            onClick={handleExportPdf}
            style={{ 
              borderColor: "#d6251b", 
              color: "#d6251b", 
              display: "inline-flex", 
              alignItems: "center", 
              gap: "6px",
              background: "rgba(214, 37, 27, 0.04)"
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <path d="M9 15h1a2 2 0 0 0 0-4H9v4Z"></path>
            </svg>
            PDF
          </button>
          <input type="file" multiple ref={fileInputRef} onChange={handleFileChange} style={{ display: "none" }} accept=".pdf" />
          <button className="btn outline" onClick={onAddManual}>
            + ADD FORM
          </button>
          <button className="btn" onClick={() => fileInputRef.current?.click()}>
            ADD PDF
          </button>
        </div>
      </div>

      <div className="results-content">
        <div className="summary-section" style={{ marginTop: 0 }}>
          <div className="summary-header">
            <div className="summary-title">Extracted Invoice Items</div>
          </div>
          <div className="summary-table-wrap">
            {allItems && allItems.length > 0 ? (
              <table className="stable">
                <thead>
                  <tr>
                    <th className="num-h">#</th>
                    {INVOICE_COLS.map((c) => (
                      <th key={c.key}>{c.label}</th>
                    ))}
                    <th>Preview</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {allItems.map((row, i) => {
                    return (
                      <tr key={i}>
                        <td className="row-num" data-label="#">{i + 1}</td>
                        {INVOICE_COLS.map((c) => (
                          <td key={c.key} data-label={c.label}>
                            {row[c.key] || "—"}
                          </td>
                        ))}
                        <td data-label="Preview">
                          {row.pdfUrl ? (
                            <a href={row.pdfUrl} target="_blank" rel="noopener noreferrer" style={{ color: "var(--primary)", textDecoration: "none", fontWeight: 500, fontSize: "12px" }}>
                              View PDF
                            </a>
                          ) : (
                            <span style={{ color: "var(--muted)" }}>-</span>
                          )}
                        </td>
                        <td data-label="Action">
                          <div style={{ display: "flex", gap: "6px", alignItems: "center", justifyContent: "flex-end" }}>
                          <button
                            style={{
                              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px",
                              padding: "4px 8px", fontSize: "11px", fontWeight: "500", borderRadius: "4px",
                              border: "1px solid #dcfce7", background: "#f0fdf4",
                              color: "#16a34a", boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                              transition: "all 0.15s ease",
                            }}
                            onMouseOver={(e) => { e.currentTarget.style.background = "#dcfce7"; }}
                            onMouseOut={(e) => { e.currentTarget.style.background = "#f0fdf4"; }}
                            onClick={() => handleEditClick(i)}
                            title="Edit"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                            Edit
                          </button>
                          <button
                            style={{
                              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px",
                              padding: "4px 8px", fontSize: "11px", fontWeight: "500", borderRadius: "4px",
                              border: "1px solid #fee2e2", background: "#fef2f2", color: "#dc2626",
                              boxShadow: "0 1px 2px rgba(0,0,0,0.05)", transition: "all 0.15s ease",
                            }}
                            onMouseOver={(e) => { e.currentTarget.style.background = "#fee2e2"; }}
                            onMouseOut={(e) => { e.currentTarget.style.background = "#fef2f2"; }}
                            onClick={() => { if(window.confirm("Are you sure you want to delete this row?")) { onDeleteRow && onDeleteRow(i); } }}
                            title="Delete"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>Delete
                          </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div style={{ padding: 20, textAlign: "center", color: "var(--text-muted)" }}>
                No items found in the PDF.
              </div>
            )}
          </div>
          <div style={{ padding: "16px 20px", display: "flex", justifyContent: "flex-end", borderTop: "1px solid var(--line)", background: "var(--panel)", borderBottomLeftRadius: "var(--radius)", borderBottomRightRadius: "var(--radius)" }}>
            <button className="btn" onClick={onSave} style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "var(--ember-bright)", color: "white", padding: "8px 24px", fontSize: "14px", fontWeight: "600", border: "none", borderRadius: "6px", cursor: "pointer", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
              SAVE DATA
            </button>
          </div>
        </div>
      </div>
      
      <EditModal
        isOpen={editingIndex !== null}
        onClose={() => setEditingIndex(null)}
        onSave={handleSaveEdit}
        title="Edit Invoice"
        initialData={editingIndex !== null ? allItems[editingIndex] : null}
        columns={INVOICE_COLS}
      />
    </section>
  );
}
