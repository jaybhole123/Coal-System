import { InfoCard } from "./Cards";
import { display } from "../utils/format";
import { useState, useRef } from "react";
import EditModal from "./EditModal";
import { exportToExcel, exportToPDF } from "../utils/exportHelpers";

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
  onAddManual 
}) {
  const [editingIndex, setEditingIndex] = useState(null);
  const fileInputRef = useRef(null);
  
  const dataArray = Array.isArray(data) ? data : [data];
  const firstData = dataArray[0];
  const { company, sold_to_party, receiver, order_info, mine_info, totals, line_items, pricing, bank_details } = firstData;

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
    };
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

  const columnsForExport = [
    { key: "name", label: "Name" },
    { key: "sales_order_number", label: "Sales Order Number" },
    { key: "sales_order_valid_from", label: "Sales Order Valid From" },
    { key: "sales_order_valid_to", label: "Sales Order Valid To" },
    { key: "office_area", label: "Office Area" },
    { key: "quantity", label: "Quantity" },
    { key: "mine", label: "Mine" },
    { key: "rate_per_te", label: "Rate Per TE(INR)" },
    { key: "amount", label: "Amount(INR)" }
  ];

  const handleExportExcel = () => {
    const formatted = dataArray.map(d => buildSummaryRow(d));
    exportToExcel(formatted, columnsForExport, fileName || "sales_orders");
  };

  const handleExportPdf = () => {
    const formatted = dataArray.map(d => buildSummaryRow(d));
    exportToPDF(formatted, columnsForExport, fileName || "sales_orders", "Sales Orders Summary");
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
            onClick={onSave}
            style={{ 
              borderColor: "var(--primary)", 
              color: "var(--primary)", 
              display: "inline-flex", 
              alignItems: "center", 
              gap: "6px",
              background: "rgba(0, 0, 0, 0.04)"
            }}
          >
            💾 SAVE
          </button>
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
                <th>Left Days</th>
              </tr>
            </thead>
            <tbody>
              {dataArray.map((d, index) => {
                const summaryRow = buildSummaryRow(d);
                return (
                  <tr key={`left-days-${index}`}>
                    <td data-label="Name">{summaryRow.name}</td>
                    <td data-label="Left Days" style={{ color: getDaysLeft(summaryRow.sales_order_valid_to) === "Expired" ? "#dc2626" : "inherit", fontWeight: getDaysLeft(summaryRow.sales_order_valid_to) === "Expired" ? "500" : "normal" }}>
                      {getDaysLeft(summaryRow.sales_order_valid_to)}
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
        <div className="table-header">
          <div className="table-title">Summary Data Table</div>
        </div>
        <div className="table-scroll" style={{ overflowX: "auto" }}>
          <table className="stable">
            <thead>
              <tr>
                <th>Name</th>
                <th>Sales Order Number</th>
                <th>Sales Order Valid From</th>
                <th>Sales Order Valid To</th>
                <th>Office Area</th>
                <th>Quantity</th>
                <th>Mine</th>
                <th className="num">Rate Per TE(INR)</th>
                <th className="num">Amount(INR)</th>
                <th>Left Days</th>
                <th>Preview</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {dataArray.map((d, index) => {
                const summaryRow = buildSummaryRow(d);
                return (
                  <tr key={index}>
                    <td data-label="Name">{summaryRow.name}</td>
                    <td data-label="Sales Order Number">{summaryRow.sales_order_number}</td>
                    <td data-label="Sales Order Valid From">{summaryRow.sales_order_valid_from}</td>
                    <td data-label="Sales Order Valid To">{summaryRow.sales_order_valid_to}</td>
                    <td data-label="Office Area">{summaryRow.office_area}</td>
                    <td data-label="Quantity">{summaryRow.quantity}</td>
                    <td data-label="Mine">{summaryRow.mine}</td>
                    <td data-label="Rate Per TE(INR)" className="num">{summaryRow.rate_per_te}</td>
                    <td data-label="Amount(INR)" className="num">{summaryRow.amount}</td>
                    <td data-label="Left Days" style={{ color: getDaysLeft(summaryRow.sales_order_valid_to) === "Expired" ? "#dc2626" : "inherit", fontWeight: getDaysLeft(summaryRow.sales_order_valid_to) === "Expired" ? "500" : "normal" }}>
                      {getDaysLeft(summaryRow.sales_order_valid_to)}
                    </td>
                    <td data-label="Preview">
                      {d.pdfUrl ? (
                        <a href={d.pdfUrl} target="_blank" rel="noopener noreferrer" style={{ color: "var(--primary)", textDecoration: "none", fontWeight: 500, fontSize: "12px" }}>
                          View PDF
                        </a>
                      ) : (
                        <span style={{ color: "var(--muted)" }}>-</span>
                      )}
                    </td>
                    <td data-label="Action" style={{ display: "flex", gap: "6px", alignItems: "center" }}>
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
                          border: "1px solid #fee2e2", background: "#fef2f2", color: "#dc2626",
                          boxShadow: "0 1px 2px rgba(0,0,0,0.05)", transition: "all 0.15s ease",
                        }}
                        onMouseOver={(e) => { e.currentTarget.style.background = "#fee2e2"; }}
                        onMouseOut={(e) => { e.currentTarget.style.background = "#fef2f2"; }}
                        onClick={() => { if(window.confirm("Are you sure you want to delete this row?")) { onDeleteRow && onDeleteRow(index); } }}
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
