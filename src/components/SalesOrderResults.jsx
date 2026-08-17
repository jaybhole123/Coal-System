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

  const buildSummaryRow = (d) => ({
    name: display(d.receiver?.name || d.sold_to_party?.name),
    area: display(d.mine_info?.area),
    sales_order_number: display(d.order_info?.sales_order_number),
    sales_order_date: display(d.order_info?.sales_order_date),
    sales_order_valid_from: display(d.order_info?.sales_order_valid_from),
    sales_order_valid_to: display(d.order_info?.sales_order_valid_to),
    mine: display(d.mine_info?.mine),
    material_description: display(d.line_items?.[0]?.material_description),
    hsn_code: display(d.line_items?.[0]?.hsn_code),
    quantity: display(d.line_items?.[0]?.quantity),
    so_value_grand_total: display(d.totals?.so_value_grand_total),
    rate_per_te: display(d.pricing?.find(p => p.description?.includes("Basic Price"))?.rate_per_te || d.pricing?.[0]?.rate_per_te),
    amount: display(d.pricing?.find(p => p.description?.includes("Basic Price"))?.amount || d.pricing?.[0]?.amount),
  });

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
                <th>Area</th>
                <th>Sales Order Number</th>
                <th>Sales Order Date</th>
                <th>Sales Order Valid From</th>
                <th>Sales Order Valid To</th>
                <th>Mine</th>
                <th>Material Description</th>
                <th>HSN Code</th>
                <th>Quantity</th>
                <th className="num">SO Value(Grand Total)</th>
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
                    <td>{summaryRow.area}</td>
                    <td>{summaryRow.sales_order_number}</td>
                    <td>{summaryRow.sales_order_date}</td>
                    <td>{summaryRow.sales_order_valid_from}</td>
                    <td>{summaryRow.sales_order_valid_to}</td>
                    <td>{summaryRow.mine}</td>
                    <td>{summaryRow.material_description}</td>
                    <td>{summaryRow.hsn_code}</td>
                    <td>{summaryRow.quantity}</td>
                    <td className="num">{summaryRow.so_value_grand_total}</td>
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
          { key: "area", label: "Area" },
          { key: "sales_order_number", label: "Sales Order Number" },
          { key: "sales_order_date", label: "Sales Order Date" },
          { key: "sales_order_valid_from", label: "Sales Order Valid From" },
          { key: "sales_order_valid_to", label: "Sales Order Valid To" },
          { key: "mine", label: "Mine" },
          { key: "material_description", label: "Material Description" },
          { key: "hsn_code", label: "HSN Code" },
          { key: "quantity", label: "Quantity" },
          { key: "so_value_grand_total", label: "SO Value(Grand Total)" },
          { key: "rate_per_te", label: "Rate Per TE(INR)" },
          { key: "amount", label: "Amount(INR)" },
        ]}
      />
    </section>
  );
}
