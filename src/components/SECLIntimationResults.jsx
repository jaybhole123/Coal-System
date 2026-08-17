import { useState, useRef } from "react";
import { COLS } from "../utils/seclParser";
import { InfoCard } from "./Cards";
import EditModal from "./EditModal";

export default function SECLIntimationResults({ data, fileName, onReset, onAddFiles, onExportJson, onExportCsv, onDeleteRow, onUpdateRow }) {
  const dataArray = Array.isArray(data) ? data : [data];
  const allItems = dataArray.flatMap(d => 
    (d.items || []).map(item => ({ ...item, _meta: d.meta }))
  );
  const [activeTab, setActiveTab] = useState("table");
  const [editingIndex, setEditingIndex] = useState(null);
  const fileInputRef = useRef(null);

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

  return (
    <section id="results">
      {/* ── Action bar ── */}
      <div className="results-bar">
        <div>
          <div className="results-file" id="resFileName">{fileName}</div>
          <div className="results-hint">SECL Intimation Extracted</div>
        </div>
        <div className="results-actions">
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
                    <th>Name of Bidder</th>
                    <th>Date of Auction</th>
                    <th>Seller Name</th>
                    <th>Source Name</th>
                    <th>Grade / Size</th>
                    <th>Quantity Allotted</th>
                    <th>Winning Bid Price Rs/MT</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {allItems.map((row, i) => {
                    return (
                      <tr key={i}>
                        <td>{row._meta?.['Name of Bidder'] || "—"}</td>
                        <td>{row._meta?.['Date of Auction'] || "—"}</td>
                        <td>{row["Seller Name"] || "—"}</td>
                        <td>{row["Source Name"] || "—"}</td>
                        <td>{row["Grade / Size"] || "—"}</td>
                        <td>{row["Quantity Allotted"] || "—"}</td>
                        <td>{row["Winning Bid Price (Rs/MT)"] || "—"}</td>
                        <td style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                          <button
                            style={{
                              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px",
                              padding: "4px 8px", fontSize: "11px", fontWeight: "500", borderRadius: "4px",
                              border: "1px solid var(--border)", background: "white",
                              color: "var(--text)", boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                              transition: "all 0.15s ease",
                            }}
                            onMouseOver={(e) => { e.currentTarget.style.background = "#f4f4f5"; }}
                            onMouseOut={(e) => { e.currentTarget.style.background = "white"; }}
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
        </div>
      </div>
      
      <EditModal
        isOpen={editingIndex !== null}
        onClose={() => setEditingIndex(null)}
        onSave={handleSaveEdit}
        title="Edit SECL Intimation"
        initialData={editingIndex !== null ? allItems[editingIndex] : null}
        columns={COLS}
      />
    </section>
  );
}
