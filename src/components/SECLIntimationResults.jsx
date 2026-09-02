import React, { useState, useRef, useEffect } from "react";
import { COLS } from "../utils/seclParser";
import HighlightText from "./HighlightText";
import { InfoCard } from "./Cards";
import EditModal from "./EditModal";
import { exportToExcel, exportToPDF } from "../utils/exportHelpers";

export default function SECLIntimationResults({ data, fileName, onReset, onAddFiles, onExportJson, onExportCsv, onSave, onDeleteRow, onUpdateRow, onAddManual }) {
  const dataArray = Array.isArray(data) ? data : [data];
  const allItems = dataArray.flatMap(d => 
    (d.items || []).map(item => ({ ...item, _meta: d.meta, pdfUrl: d.pdfUrl, pdfName: d.pdfName }))
  );
  const [activeTab, setActiveTab] = useState("table");
  const [editingIndex, setEditingIndex] = useState(null);
  const fileInputRef = useRef(null);

  const [searchTerm, setSearchTerm] = useState("");

  // --- COLUMN TOGGLE LOGIC ---
  const [showColumnDropdown, setShowColumnDropdown] = useState(false);
  const columnDropdownRef = useRef(null);

  const allTableColumns = [
    { key: "srNo", label: "S.No." },
    { key: "bidderName", label: "Name of Bidder" },
    { key: "auctionDate", label: "Date of Auction" },
    { key: "sellerName", label: "Seller Name" },
    { key: "sourceName", label: "Source Name" },
    { key: "gradeSize", label: "Grade / Size" },
    { key: "qtyAllotted", label: "Quantity Allotted" },
    { key: "bidPrice", label: "Winning Bid Price Rs/MT" },
    { key: "preview", label: "Preview" },
    { key: "action", label: "Action" }
  ];

  const [visibleCols, setVisibleCols] = useState(
    allTableColumns.reduce((acc, col) => ({ ...acc, [col.key]: true }), {})
  );

  const toggleColumn = (key) => {
    setVisibleCols(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const setAllColumns = (val) => {
    setVisibleCols(allTableColumns.reduce((acc, col) => ({ ...acc, [col.key]: val }), {}));
  };

  const filteredItems = React.useMemo(() => {
    if (!searchTerm) return allItems;
    const lower = searchTerm.toLowerCase();
    return allItems.filter(item => {
      const metaValues = item._meta ? Object.values(item._meta) : [];
      const directValues = Object.values(item);
      return [...metaValues, ...directValues].some(val => 
        val && String(val).toLowerCase().includes(lower)
      );
    });
  }, [allItems, searchTerm]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (columnDropdownRef.current && !columnDropdownRef.current.contains(event.target)) {
        setShowColumnDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleEditClick = (index) => {
    setEditingIndex(index);
  };

  const handleSaveEdit = (updatedData) => {
    const newRow = { ...updatedData };
    // Map flattened edited properties back to _meta
    if (newRow["Name of Bidder"] !== undefined || newRow["Date of Auction"] !== undefined) {
      newRow._meta = { ...newRow._meta };
      if (newRow["Name of Bidder"] !== undefined) newRow._meta["Name of Bidder"] = newRow["Name of Bidder"];
      if (newRow["Date of Auction"] !== undefined) newRow._meta["Date of Auction"] = newRow["Date of Auction"];
    }
    
    onUpdateRow && onUpdateRow(editingIndex, newRow);
    setEditingIndex(null);
  };

  const editModalCols = [
    { key: "Name of Bidder", label: "Name of Bidder" },
    { key: "Date of Auction", label: "Date of Auction" },
    { key: "Seller Name", label: "Seller Name" },
    { key: "Source Name", label: "Source Name" },
    { key: "Grade / Size", label: "Grade / Size" },
    { key: "Quantity Allotted", label: "Quantity Allotted" },
    { key: "Winning Bid Price (Rs/MT)", label: "Winning Bid Price (RS/MT)" }
  ];

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []).filter(f => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"));
    if (files.length > 0 && onAddFiles) onAddFiles(files);
    e.target.value = "";
  };

  const columnsForExport = [
    { key: "bidderName", label: "Name of Bidder" },
    { key: "auctionDate", label: "Date of Auction" },
    { key: "sellerName", label: "Seller Name" },
    { key: "sourceName", label: "Source Name" },
    { key: "gradeSize", label: "Grade / Size" },
    { key: "qtyAllotted", label: "Quantity Allotted" },
    { key: "bidPrice", label: "Winning Bid Price Rs/MT" }
  ];

  const handleExportExcel = () => {
    const formatted = allItems.map(row => ({
      bidderName: row._meta?.['Name of Bidder'] || "",
      auctionDate: row._meta?.['Date of Auction'] || "",
      sellerName: row["Seller Name"] || "",
      sourceName: row["Source Name"] || "",
      gradeSize: row["Grade / Size"] || "",
      qtyAllotted: row["Quantity Allotted"] || "",
      bidPrice: row["Winning Bid Price (Rs/MT)"] || ""
    }));
    exportToExcel(formatted, columnsForExport, fileName || "secl_intimation");
  };

  const handleExportPdf = () => {
    const formatted = allItems.map(row => ({
      bidderName: row._meta?.['Name of Bidder'] || "",
      auctionDate: row._meta?.['Date of Auction'] || "",
      sellerName: row["Seller Name"] || "",
      sourceName: row["Source Name"] || "",
      gradeSize: row["Grade / Size"] || "",
      qtyAllotted: row["Quantity Allotted"] || "",
      bidPrice: row["Winning Bid Price (Rs/MT)"] || ""
    }));
    exportToPDF(formatted, columnsForExport, fileName || "secl_intimation", "SECL Intimation Summary");
  };

  return (
    <section id="results">
      {/* ── Action bar ── */}
      <div className="results-bar">
        <div>
          <div className="results-file" id="resFileName">{fileName}</div>
          <div className="results-hint">SECL Intimation Extracted</div>
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
          <div className="summary-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div className="summary-title">Extracted Items</div>
          
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            {/* SEARCH BAR */}
            <div style={{ position: "relative" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)" }}>
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input 
                type="text" 
                placeholder="Search..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ padding: "6px 12px 6px 30px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "13px", width: "220px", outline: "none", color: "var(--text)" }}
              />
            </div>
            
            {/* COLUMNS TOGGLE DROPDOWN */}
            <div style={{ position: "relative" }} ref={columnDropdownRef}>
              <button 
                className="btn ghost" 
                onClick={() => setShowColumnDropdown(!showColumnDropdown)}
                style={{ display: "inline-flex", alignItems: "center", gap: "8px", border: "1px solid #d1d5db", borderRadius: "6px", padding: "6px 12px", background: "var(--surface, #fff)", color: "var(--text, #333)", fontSize: "14px", fontWeight: "500", cursor: "pointer", transition: "all 0.15s ease", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
                onMouseOver={(e) => { e.currentTarget.style.background = "#f9fafb"; }}
                onMouseOut={(e) => { e.currentTarget.style.background = "var(--surface, #fff)"; }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="12" y1="3" x2="12" y2="21"></line></svg>
                Columns
              </button>
              {showColumnDropdown && (
                <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, width: "220px", background: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)", zIndex: 100, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                  <div style={{ padding: "12px 14px", borderBottom: "1px solid #f3f4f6", fontSize: "13px", fontWeight: "600", color: "#374151", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>Toggle Columns</span>
                  </div>
                  <div style={{ padding: "10px 14px", display: "flex", gap: "12px", borderBottom: "1px solid #f3f4f6", fontSize: "12px", background: "#f9fafb" }}>
                    <button onClick={() => setAllColumns(true)} style={{ color: "#2563eb", background: "none", border: "none", cursor: "pointer", padding: 0, fontWeight: "600" }}>Select All</button>
                    <button onClick={() => setAllColumns(false)} style={{ color: "#6b7280", background: "none", border: "none", cursor: "pointer", padding: 0, fontWeight: "500" }}>Deselect All</button>
                  </div>
                  <div style={{ maxHeight: "220px", overflowY: "auto", padding: "8px 0" }}>
                    {allTableColumns.map(col => (
                      <label key={col.key} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "8px 16px", cursor: "pointer", fontSize: "13px", color: "#4b5563", transition: "background 0.15s", userSelect: "none" }} onMouseOver={(e) => e.currentTarget.style.background = "#f3f4f6"} onMouseOut={(e) => e.currentTarget.style.background = "transparent"}>
                        <input 
                          type="checkbox" 
                          checked={visibleCols[col.key]} 
                          onChange={() => toggleColumn(col.key)} 
                          style={{ width: "16px", height: "16px", cursor: "pointer", accentColor: "#2563eb", margin: 0 }}
                        />
                        {col.label}
                      </label>
                    ))}
                  </div>
                </div>
              )}
              </div>
            </div>
          </div>
          <div className="summary-table-wrap">
            {filteredItems && filteredItems.length > 0 ? (
              <table className="stable">
                <thead>
                  <tr>
                    {visibleCols.srNo && <th style={{ width: "50px", textAlign: "center" }}>S.No.</th>}
                    {visibleCols.bidderName && <th>Name of Bidder</th>}
                    {visibleCols.auctionDate && <th>Date of Auction</th>}
                    {visibleCols.sellerName && <th>Seller Name</th>}
                    {visibleCols.sourceName && <th>Source Name</th>}
                    {visibleCols.gradeSize && <th>Grade / Size</th>}
                    {visibleCols.qtyAllotted && <th>Quantity Allotted</th>}
                    {visibleCols.bidPrice && <th>Winning Bid Price Rs/MT</th>}
                    {visibleCols.preview && <th>Preview</th>}
                    {visibleCols.action && <th>Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((row, i) => {
                    return (
                      <tr key={i}>
                        {visibleCols.srNo && <td style={{ textAlign: "center", fontWeight: "600", color: "var(--muted)", fontSize: "13px" }}>{i + 1}</td>}
                        {visibleCols.bidderName && <td><HighlightText text={row._meta?.['Name of Bidder'] || "—"} highlight={searchTerm} /></td>}
                        {visibleCols.auctionDate && <td><HighlightText text={row._meta?.['Date of Auction'] || "—"} highlight={searchTerm} /></td>}
                        {visibleCols.sellerName && <td><HighlightText text={row["Seller Name"] || "—"} highlight={searchTerm} /></td>}
                        {visibleCols.sourceName && <td><HighlightText text={row["Source Name"] || "—"} highlight={searchTerm} /></td>}
                        {visibleCols.gradeSize && <td><HighlightText text={row["Grade / Size"] || "—"} highlight={searchTerm} /></td>}
                        {visibleCols.qtyAllotted && <td><HighlightText text={row["Quantity Allotted"] != null && row["Quantity Allotted"] !== "" ? String(row["Quantity Allotted"]) : "—"} highlight={searchTerm} /></td>}
                        {visibleCols.bidPrice && <td><HighlightText text={row["Winning Bid Price (Rs/MT)"] != null && row["Winning Bid Price (Rs/MT)"] !== "" ? String(row["Winning Bid Price (Rs/MT)"]) : "—"} highlight={searchTerm} /></td>}
                        {visibleCols.preview && <td>
                          {row.pdfUrl ? (
                            <a href={row.pdfUrl} target="_blank" rel="noopener noreferrer" style={{ color: "var(--primary)", textDecoration: "none", fontWeight: 500, fontSize: "12px" }}>
                              View PDF
                            </a>
                          ) : (
                            <span style={{ color: "var(--muted)" }}>-</span>
                          )}
                        </td>}
                        {visibleCols.action && (
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
                        )}
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
        title="Edit SECL Intimation"
        initialData={editingIndex !== null ? {
          ...allItems[editingIndex],
          "Name of Bidder": allItems[editingIndex]._meta?.["Name of Bidder"] || "",
          "Date of Auction": allItems[editingIndex]._meta?.["Date of Auction"] || "",
        } : null}
        columns={editModalCols}
      />
    </section>
  );
}
