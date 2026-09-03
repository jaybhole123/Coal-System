import { InfoCard } from "./Cards";
import { display } from "../utils/format";
import { useState, useRef, useEffect, useMemo } from "react";
import EditModal from "./EditModal";
import { exportToExcel, exportToPDF } from "../utils/exportHelpers";
import HighlightText from "./HighlightText";

export default function SalesOrderResults({ 
  data, 
  fileName, 
  failedFiles = [],
  onReset, 
  onAddFiles, 
  onExportJson, 
  onExportCsv, 
  onSave, 
  onDeleteRow, 
  onUpdateRow, 
  onAddManual,
  currentPage = 1,
  totalCount = 0,
  pageSize = 10,
  isFetching = false,
  onPageChange
}) {
  const [editingIndex, setEditingIndex] = useState(null);
  const fileInputRef = useRef(null);

  const [searchTerm, setSearchTerm] = useState("");

  // --- COLUMN TOGGLE LOGIC ---
  const [showColumnDropdown, setShowColumnDropdown] = useState(false);
  const columnDropdownRef = useRef(null);

  const allTableColumns = [
    { key: "sno", label: "S.No" },
    { key: "name", label: "Name" },
    { key: "sales_order_number", label: "Sales Order Number" },
    { key: "sales_order_valid_from", label: "Sales Order Valid From" },
    { key: "sales_order_valid_to", label: "Sales Order Valid To" },
    { key: "office_area", label: "Office Area" },
    { key: "quantity", label: "Quantity" },
    { key: "rate_per_te", label: "Rate Per TE(INR)" },
    { key: "amount", label: "Amount(INR)" },
    { key: "left_days", label: "Left Days" },
    { key: "submitted_date", label: "Submitted Date" },
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

  useEffect(() => {
    function handleClickOutside(event) {
      if (columnDropdownRef.current && !columnDropdownRef.current.contains(event.target)) {
        setShowColumnDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  
  const dataArray = Array.isArray(data) ? data : [data];
  
  const buildSummaryRow = (d) => {
    const reqPay = d.pricing?.find(p => p.description?.toLowerCase().includes("requisite payment"));
    return {
      name: display(d.sold_to_party?.name || d.receiver?.name),
      sales_order_number: display(d.order_info?.sales_order_number),
      sales_order_valid_from: display(d.order_info?.sales_order_valid_from),
      sales_order_valid_to: display(d.order_info?.sales_order_valid_to),
      office_area: display(d.company?.office_area || d.mine_info?.area),
      quantity: display(d.line_items?.[0]?.quantity || d.mine_info?.quantity_words),
      mine: display(d.mine_info?.mine || d.line_items?.[0]?.mine),
      rate_per_te: display(reqPay?.rate_per_te || d.pricing?.[0]?.rate_per_te),
      amount: display(reqPay?.amount || d.totals?.requisite_payment || d.pricing?.[0]?.amount),
      submitted_date: d.created_at ? new Date(d.created_at).toLocaleDateString() : "-",
    };
  };

  const filteredData = useMemo(() => {
    if (!searchTerm) return dataArray.map((raw, idx) => ({ raw, summary: buildSummaryRow(raw), idx }));
    const lower = searchTerm.toLowerCase();
    return dataArray
      .map((raw, idx) => ({ raw, summary: buildSummaryRow(raw), idx }))
      .filter(({ summary }) => Object.values(summary).some(val => String(val).toLowerCase().includes(lower)));
  }, [dataArray, searchTerm]);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []).filter(f => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"));
    if (files.length > 0 && onAddFiles) onAddFiles(files);
    e.target.value = "";
  };

  const handleEditClick = (index) => {
    setEditingIndex(index);
  };

  const handleSaveEdit = (updatedData) => {
    onUpdateRow && onUpdateRow(editingIndex, updatedData);
    setEditingIndex(null);
  };

  const getDaysLeft = (validToDateStr) => {
    if (!validToDateStr || validToDateStr === "-") return "-";
    const validTo = new Date(validToDateStr);
    if (isNaN(validTo)) return "-";
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    validTo.setHours(0, 0, 0, 0);
    
    const diffTime = validTo - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return "Expired";
    return `${diffDays} days left`;
  };

  const getExpiredDays = (validToDateStr) => {
    if (!validToDateStr || validToDateStr === "-") return null;
    const validTo = new Date(validToDateStr);
    if (isNaN(validTo)) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    validTo.setHours(0, 0, 0, 0);

    const diffTime = today - validTo;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays > 0 ? diffDays : null;
  };

  const columnsForExport = [
    { key: "name", label: "Name" },
    { key: "sales_order_number", label: "Sales Order Number" },
    { key: "sales_order_valid_from", label: "Sales Order Valid From" },
    { key: "sales_order_valid_to", label: "Sales Order Valid To" },
    { key: "left_days", label: "Left Days" },
    { key: "submitted_date", label: "Submitted Date" },
    { key: "office_area", label: "Office Area" },
    { key: "quantity", label: "Quantity" },
    { key: "mine", label: "Mine" },
    { key: "rate_per_te", label: "Rate Per TE(INR)" },
    { key: "amount", label: "Amount(INR)" }
  ];

  const handleExportExcel = () => {
    const formatted = dataArray.map(d => {
      const row = buildSummaryRow(d);
      return { ...row, left_days: getDaysLeft(row.sales_order_valid_to) };
    });
    exportToExcel(formatted, columnsForExport, fileName || "sales_orders");
  };

  const handleExportPdf = () => {
    const formatted = dataArray.map(d => {
      const row = buildSummaryRow(d);
      return { ...row, left_days: getDaysLeft(row.sales_order_valid_to) };
    });

    const extraColumns = [
      { key: "name", label: "Name" },
      { key: "sales_order_number", label: "Sales Order Number" },
      { key: "left_days", label: "Left Days" },
      { key: "days_since_expired", label: "Days Since Expired" }
    ];

    const extraData = dataArray.map(d => {
      const summaryRow = buildSummaryRow(d);
      const expiredDays = getExpiredDays(summaryRow.sales_order_valid_to);
      return {
        name: summaryRow.name,
        sales_order_number: summaryRow.sales_order_number,
        left_days: getDaysLeft(summaryRow.sales_order_valid_to),
        days_since_expired: expiredDays !== null ? `${expiredDays} days ago` : "Valid"
      };
    });

    const extraTables = [{
      title: "Left Days Summary",
      columns: extraColumns,
      data: extraData
    }];

    exportToPDF(formatted, columnsForExport, fileName || "sales_orders", "Sales Orders Summary", extraTables);
  };

  return (
    <section id="sales-order-results">
      {failedFiles && failedFiles.length > 0 && (
        <div style={{
          padding: "12px 16px",
          marginBottom: "20px",
          backgroundColor: "rgba(220, 53, 69, 0.1)",
          borderLeft: "4px solid #dc3545",
          borderRadius: "4px",
          color: "#dc3545",
          fontSize: "14px",
          lineHeight: "1.5"
        }}>
          <strong>⚠️ {failedFiles.length} file(s) failed to process:</strong>
          <ul style={{ margin: "8px 0 0", paddingLeft: "20px" }}>
            {failedFiles.map((name, idx) => (
              <li key={idx}>{name}</li>
            ))}
          </ul>
        </div>
      )}
      
      {/* ── Action bar ── */}
      <div className="results-bar">
        <div>
          <div className="results-file">{fileName}</div>
          <div className="results-hint">Sales Order Extracted</div>
        </div>
        <div className="results-actions">

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

      {/* ── Cards and detailed tables removed per user request ── */}

      {/* ── Left Days Summary Table ── */}
      <div className="table-card" style={{ marginTop: 24 }}>
        <div className="table-header">
          <div className="table-title">Left Days Summary</div>
        </div>
        <div className="table-scroll" style={{ overflowX: "auto" }}>
          <table className="stable">
            <thead>
              <tr>
                <th>Name</th>
                <th>Sales Order Number</th>
                <th>Left Days</th>
                <th>Days Since Expired</th>
              </tr>
            </thead>
            <tbody>
              {dataArray.map((d, index) => {
                const summaryRow = buildSummaryRow(d);
                return (
                  <tr key={`left-days-${index}`}>
                    <td data-label="Name" style={{ fontWeight: "600", color: "var(--text)" }}>{summaryRow.name}</td>
                    <td data-label="Sales Order Number">{summaryRow.sales_order_number}</td>
                    <td data-label="Left Days" style={{ color: getDaysLeft(summaryRow.sales_order_valid_to) === "Expired" ? "#dc2626" : "inherit", fontWeight: getDaysLeft(summaryRow.sales_order_valid_to) === "Expired" ? "500" : "normal" }}>
                      {getDaysLeft(summaryRow.sales_order_valid_to)}
                    </td>
                    <td data-label="Days Since Expired">
                      {(() => {
                        const expiredDays = getExpiredDays(summaryRow.sales_order_valid_to);
                        if (expiredDays === null) return (
                          <span style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            background: "rgba(34, 197, 94, 0.1)",
                            color: "#16a34a",
                            fontWeight: "600",
                            fontSize: "12px",
                            padding: "3px 10px",
                            borderRadius: "999px",
                            border: "1px solid rgba(34, 197, 94, 0.2)"
                          }}>
                            Valid
                          </span>
                        );
                        return (
                          <span style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            background: "rgba(220, 38, 38, 0.08)",
                            color: "#b91c1c",
                            fontWeight: "600",
                            fontSize: "12px",
                            padding: "3px 10px",
                            borderRadius: "999px",
                            border: "1px solid rgba(220, 38, 38, 0.2)"
                          }}>
                            ⏱ {expiredDays} {expiredDays === 1 ? "day" : "days"} ago
                          </span>
                        );
                      })()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Summary Data Table ── */}
      <div className="table-card" style={{ marginTop: 24 }}>
        <div className="table-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div className="table-title">Summary Data Table</div>
          
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
                style={{ padding: "6px 12px 6px 30px", border: "1px solid var(--line)", borderRadius: "6px", fontSize: "13px", width: "220px", outline: "none", color: "var(--text)", background: "transparent" }}
              />
            </div>

            {/* COLUMNS TOGGLE DROPDOWN */}
            <div style={{ position: "relative" }} ref={columnDropdownRef}>
              <button 
                className="btn ghost" 
                onClick={() => setShowColumnDropdown(!showColumnDropdown)}
                style={{ display: "inline-flex", alignItems: "center", gap: "8px", borderRadius: "6px", padding: "6px 12px", fontSize: "14px", fontWeight: "500", cursor: "pointer", transition: "all 0.15s ease" }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="12" y1="3" x2="12" y2="21"></line></svg>
                Columns
              </button>
              {showColumnDropdown && (
                <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, width: "220px", background: "var(--panel)", border: "1px solid var(--line)", borderRadius: "8px", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)", zIndex: 100, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                  <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--line)", fontSize: "13px", fontWeight: "600", color: "var(--text)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>Toggle Columns</span>
                  </div>
                  <div style={{ padding: "10px 14px", display: "flex", gap: "12px", borderBottom: "1px solid var(--line)", fontSize: "12px", background: "rgba(0,0,0,0.02)" }}>
                    <button onClick={() => setAllColumns(true)} style={{ color: "var(--primary, #2563eb)", background: "none", border: "none", cursor: "pointer", padding: 0, fontWeight: "600" }}>Select All</button>
                    <button onClick={() => setAllColumns(false)} style={{ color: "var(--muted)", background: "none", border: "none", cursor: "pointer", padding: 0, fontWeight: "500" }}>Deselect All</button>
                  </div>
                  <div style={{ maxHeight: "220px", overflowY: "auto", padding: "8px 0" }}>
                    {allTableColumns.map(col => (
                      <label key={col.key} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 14px", cursor: "pointer", transition: "background 0.15s ease", color: "var(--text)" }} onMouseOver={e => e.currentTarget.style.background="rgba(0,0,0,0.04)"} onMouseOut={e => e.currentTarget.style.background="transparent"}>
                        <input 
                          type="checkbox" 
                          checked={visibleCols[col.key] || false}
                          onChange={() => toggleColumn(col.key)}
                          style={{ cursor: "pointer", width: "16px", height: "16px", accentColor: "var(--primary, #2563eb)", margin: 0 }}
                        />
                        <span style={{ fontSize: "13px", userSelect: "none" }}>{col.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="table-scroll" style={{ overflowX: "auto" }}>
          <table className="stable">
            <thead>
              <tr>
                {visibleCols.sno && <th style={{ width: "52px", textAlign: "center" }}>S.No</th>}
                {visibleCols.name && <th>Name</th>}
                {visibleCols.sales_order_number && <th>Sales Order Number</th>}
                {visibleCols.sales_order_valid_from && <th>Sales Order Valid From</th>}
                {visibleCols.sales_order_valid_to && <th>Sales Order Valid To</th>}
                {visibleCols.office_area && <th>Office Area</th>}
                {visibleCols.quantity && <th>Quantity</th>}
                {visibleCols.mine && <th>Mine</th>}
                {visibleCols.rate_per_te && <th className="num">Rate Per TE(INR)</th>}
                {visibleCols.amount && <th className="num">Amount(INR)</th>}
                {visibleCols.left_days && <th>Left Days</th>}
                {visibleCols.submitted_date && <th>Submitted Date</th>}
                {visibleCols.preview && <th>Preview</th>}
                {visibleCols.action && <th>Action</th>}
              </tr>
            </thead>
            <tbody>
              {filteredData.map(({ raw: d, summary: summaryRow, idx: index }, rowNum) => {
                return (
                  <tr key={index}>
                    {visibleCols.sno && <td data-label="S.No" style={{ textAlign: "center", color: "var(--muted)", fontFamily: "var(--font-mono, monospace)", fontSize: "12px", fontWeight: 600 }}>{String((currentPage - 1) * pageSize + rowNum + 1).padStart(2, "0")}</td>}
                    {visibleCols.name && <td data-label="Name" style={{ fontWeight: "600", color: "var(--text)" }}><HighlightText text={summaryRow.name} highlight={searchTerm} /></td>}
                    {visibleCols.sales_order_number && <td data-label="Sales Order Number"><HighlightText text={summaryRow.sales_order_number} highlight={searchTerm} /></td>}
                    {visibleCols.sales_order_valid_from && <td data-label="Sales Order Valid From"><HighlightText text={summaryRow.sales_order_valid_from} highlight={searchTerm} /></td>}
                    {visibleCols.sales_order_valid_to && <td data-label="Sales Order Valid To"><HighlightText text={summaryRow.sales_order_valid_to} highlight={searchTerm} /></td>}
                    {visibleCols.office_area && <td data-label="Office Area"><HighlightText text={summaryRow.office_area} highlight={searchTerm} /></td>}
                    {visibleCols.quantity && <td data-label="Quantity"><HighlightText text={summaryRow.quantity} highlight={searchTerm} /></td>}
                    {visibleCols.mine && <td data-label="Mine"><HighlightText text={summaryRow.mine} highlight={searchTerm} /></td>}
                    {visibleCols.rate_per_te && <td data-label="Rate Per TE(INR)" className="num"><HighlightText text={summaryRow.rate_per_te} highlight={searchTerm} /></td>}
                    {visibleCols.amount && <td data-label="Amount(INR)" className="num"><HighlightText text={summaryRow.amount} highlight={searchTerm} /></td>}
                    {visibleCols.left_days && <td data-label="Left Days" style={{ color: getDaysLeft(summaryRow.sales_order_valid_to) === "Expired" ? "#dc2626" : "inherit", fontWeight: getDaysLeft(summaryRow.sales_order_valid_to) === "Expired" ? "500" : "normal" }}>
                      {getDaysLeft(summaryRow.sales_order_valid_to)}
                    </td>}
                    {visibleCols.submitted_date && <td data-label="Submitted Date"><HighlightText text={summaryRow.submitted_date} highlight={searchTerm} /></td>}
                    {visibleCols.preview && <td data-label="Preview">
                      {d.pdfUrl ? (
                        <a href={d.pdfUrl} target="_blank" rel="noopener noreferrer" style={{ color: "var(--primary)", textDecoration: "none", fontWeight: 500, fontSize: "12px" }}>
                          View PDF
                        </a>
                      ) : (
                        <span style={{ color: "var(--muted)" }}>-</span>
                      )}
                    </td>}
                    {visibleCols.action && <td data-label="Action">
                      <div style={{ display: "flex", gap: "6px", alignItems: "center", justifyContent: "flex-end" }}>
                      <button
                          style={{
                            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px",
                            padding: "4px 8px", fontSize: "11px", fontWeight: "500", borderRadius: "4px",
                            border: "1px solid rgba(22, 163, 74, 0.3)", background: "transparent",
                            color: "#16a34a", boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                            transition: "all 0.15s ease",
                          }}
                          onMouseOver={(e) => { e.currentTarget.style.background = "rgba(22, 163, 74, 0.1)"; }}
                          onMouseOut={(e) => { e.currentTarget.style.background = "transparent"; }}
                          onClick={() => handleEditClick(index)}
                        title="Edit"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        Edit
                      </button>
                      <button
                        style={{
                          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px",
                          padding: "4px 8px", fontSize: "11px", fontWeight: "500", borderRadius: "4px",
                          border: "1px solid rgba(220, 38, 38, 0.3)", background: "transparent", color: "#dc2626",
                          boxShadow: "0 1px 2px rgba(0,0,0,0.05)", transition: "all 0.15s ease",
                        }}
                        onMouseOver={(e) => { e.currentTarget.style.background = "rgba(220, 38, 38, 0.1)"; }}
                        onMouseOut={(e) => { e.currentTarget.style.background = "transparent"; }}
                        onClick={() => { if(window.confirm("Are you sure you want to delete this row?")) { onDeleteRow && onDeleteRow(index); } }}
                        title="Delete"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>Delete
                      </button>
                      </div>
                    </td>}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* PAGINATION CONTROLS */}
        {onPageChange && totalCount > pageSize && (() => {
          const totalPages = Math.ceil(totalCount / pageSize);
          const pages = [];
          const startPage = Math.max(1, currentPage - 2);
          const endPage = Math.min(totalPages, currentPage + 2);
          for (let p = startPage; p <= endPage; p++) pages.push(p);
          return (
            <div style={{ padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--line)", background: "var(--panel)" }}>
              <div style={{ fontSize: "13px", color: "var(--muted)" }}>
                {isFetching ? "Loading..." : `Showing ${(currentPage - 1) * pageSize + 1}–${Math.min(currentPage * pageSize, totalCount)} of ${totalCount} records`}
              </div>
              <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage <= 1 || isFetching}
                  style={{ padding: "5px 10px", borderRadius: "5px", border: "1px solid var(--line)", background: currentPage <= 1 ? "#f3f4f6" : "white", cursor: currentPage <= 1 ? "not-allowed" : "pointer", color: currentPage <= 1 ? "#9ca3af" : "var(--text)", fontSize: "13px", fontWeight: "500" }}
                >← Prev</button>
                {startPage > 1 && <span style={{ padding: "0 4px", color: "var(--muted)" }}>...</span>}
                {pages.map(p => (
                  <button key={p} onClick={() => onPageChange(p)} disabled={isFetching}
                    style={{ padding: "5px 10px", borderRadius: "5px", border: `1px solid ${p === currentPage ? "var(--primary)" : "var(--line)"}`, background: p === currentPage ? "var(--primary)" : "white", color: p === currentPage ? "white" : "var(--text)", fontWeight: p === currentPage ? "700" : "400", cursor: "pointer", fontSize: "13px", minWidth: "34px" }}
                  >{p}</button>
                ))}
                {endPage < totalPages && <span style={{ padding: "0 4px", color: "var(--muted)" }}>...</span>}
                <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage >= totalPages || isFetching}
                  style={{ padding: "5px 10px", borderRadius: "5px", border: "1px solid var(--line)", background: currentPage >= totalPages ? "#f3f4f6" : "white", cursor: currentPage >= totalPages ? "not-allowed" : "pointer", color: currentPage >= totalPages ? "#9ca3af" : "var(--text)", fontSize: "13px", fontWeight: "500" }}
                >Next →</button>
              </div>
            </div>
          );
        })()}

        <div style={{ padding: "16px 20px", display: "flex", justifyContent: "flex-end", borderTop: "1px solid var(--line)", background: "var(--panel)", borderBottomLeftRadius: "var(--radius)", borderBottomRightRadius: "var(--radius)" }}>
          <button className="btn" onClick={onSave} style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "var(--ember-bright)", color: "white", padding: "8px 24px", fontSize: "14px", fontWeight: "600", border: "none", borderRadius: "6px", cursor: "pointer", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
            SAVE DATA
          </button>
        </div>
      </div>

      <EditModal
        isOpen={editingIndex !== null}
        onClose={() => setEditingIndex(null)}
        onSave={handleSaveEdit}
        title="Edit Sales Order"
        initialData={editingIndex !== null ? buildSummaryRow(dataArray[editingIndex]) : null}
        columns={[
          { key: "name", label: "Name" },
          { key: "sales_order_number", label: "Sales Order Number" },
          { key: "sales_order_valid_from", label: "Sales Order Valid From" },
          { key: "sales_order_valid_to", label: "Sales Order Valid To" },
          { key: "office_area", label: "Office Area" },
          { key: "quantity", label: "Quantity" },
          { key: "mine", label: "Mine" },
          { key: "rate_per_te", label: "Rate Per TE(INR)" },
          { key: "amount", label: "Amount(INR)" },
        ]}
      />
    </section>
  );
}
