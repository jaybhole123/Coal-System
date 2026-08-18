import { InfoCard } from "./Cards";
import { display } from "../utils/format";
import { useState, useRef } from "react";
import EditModal from "./EditModal";

export default function SalesOrderResults({ data, fileName, onReset, onAddFiles, onExportJson, onExportCsv, onDeleteRow, onUpdateRow }) {
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

  return (
    <section id="sales-order-results">
      {/* ── Action bar ── */}
      <div className="results-bar">
        <div>
          <div className="results-file">{fileName}</div>
          <div className="results-hint">Sales Order Extracted</div>
        </div>
        <div className="results-actions">
          <input type="file" multiple ref={fileInputRef} onChange={handleFileChange} style={{ display: "none" }} accept=".pdf" />
          <button className="btn" onClick={() => fileInputRef.current?.click()}>
            ADD PDF
          </button>
        </div>
      </div>

      {/* ── Cards and detailed tables removed per user request ── */}

      {/* ── Summary Data Table ── */}
      <div className="table-card" style={{ marginTop: 24 }}>
        <div className="table-header">
          <div className="table-title">Summary Data Table</div>
        </div>
        <div className="table-scroll" style={{ overflowX: "auto" }}>
          <table className="stable" style={{ minWidth: 1200 }}>
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
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {dataArray.map((d, index) => {
                const summaryRow = buildSummaryRow(d);
                return (
                  <tr key={index}>
                    <td>{summaryRow.name}</td>
                    <td>{summaryRow.sales_order_number}</td>
                    <td>{summaryRow.sales_order_valid_from}</td>
                    <td>{summaryRow.sales_order_valid_to}</td>
                    <td>{summaryRow.office_area}</td>
                    <td>{summaryRow.quantity}</td>
                    <td>{summaryRow.mine}</td>
                    <td className="num">{summaryRow.rate_per_te}</td>
                    <td className="num">{summaryRow.amount}</td>
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
