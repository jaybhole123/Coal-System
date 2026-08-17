import { useState, useRef } from "react";
import { InfoCard, MaterialCard } from "./Cards";
import PricingTable from "./PricingTable";
import { INR, display } from "../utils/format";
import EditModal from "./EditModal";

/**
 * Full results view — shown after a PDF is successfully parsed.
 *
 * Props:
 *   data        — parsed payment advice object
 *   fileName    — original filename string
 *   onReset     — callback to go back to dropzone
 *   onExportJson / onExportCsv — export callbacks
 */
export default function Results({ data, fileName, onReset, onAddFiles, onExportJson, onExportCsv, onDeleteRow, onUpdateRow }) {
  const [editingIndex, setEditingIndex] = useState(null);
  const fileInputRef = useRef(null);
  
  const dataArray = Array.isArray(data) ? data : [data];
  const firstData = dataArray[0];

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
    customerCode: display(d.receiver?.customerCode),
    customerName: display(d.receiver?.customerName),
    gstin: display(d.receiver?.gstin),
    areaOffice: display(d.areaOffice),
    salesDocNo: display(d.contract?.salesDocNo),
    salesOrderDate: display(d.contract?.salesOrderDate),
    paymentDueDate: display(d.contract?.paymentDueDate),
    auctionDateRef: display(d.contract?.auctionDateRef),
    materialCode: display(d.material?.materialCode),
    description: display(d.material?.description),
    quantity: d.material ? `${d.material.quantity ?? "—"} ${d.material.unit ?? ""}`.trim() : "—",
    requisitePayment: d.totals?.requisitePayment !== null && d.totals?.requisitePayment !== undefined ? `₹ ${INR(d.totals.requisitePayment)}` : "—",
  });

  return (
    <section id="results">
      {/* ── Action bar ── */}
      <div className="results-bar">
        <div>
          <div className="results-file" id="resFileName">{fileName}</div>
          <div className="results-hint">Extraction complete</div>
        </div>
        <div className="results-actions">
          <input type="file" multiple ref={fileInputRef} onChange={handleFileChange} style={{ display: "none" }} accept=".pdf" />
          <button className="btn" onClick={() => fileInputRef.current?.click()}>
            ADD PDF
          </button>
        </div>
      </div>

      {/* ════════════════════════════════════════════
          FULL DATA CARDS (Per PDF)
      ════════════════════════════════════════════ */}
      <div className="results-content">
        {dataArray.map((d, index) => (
          <div key={index} style={{ marginBottom: 32 }}>
            <h3 style={{ fontSize: 16, marginBottom: 12, color: "var(--text)" }}>
              File {index + 1} Extracted Data
            </h3>
            <div className="grid">
              <InfoCard
                title="Receiver Details"
                fields={[
                  ["Customer Code", d.receiver?.customerCode],
                  ["Customer Name", d.receiver?.customerName],
                  ["GSTIN", d.receiver?.gstin],
                  ["Area Office", d.areaOffice],
                ]}
              />
              <InfoCard
                title="Consignee Details"
                fields={[
                  ["Customer Code", d.consignee?.customerCode],
                  ["Customer Name", d.consignee?.customerName],
                  ["GSTIN", d.consignee?.gstin],
                ]}
              />
              <InfoCard
                title="Contract & Order Details"
                fields={[
                  ["Contract Number", d.contract?.contractNumber],
                  ["Sales Doc No", d.contract?.salesDocNo],
                  ["Sales Order Date", d.contract?.salesOrderDate],
                  ["PI Number", d.contract?.piNumber],
                  ["PI Date", d.contract?.piDate],
                  ["Payment Due Date", d.contract?.paymentDueDate],
                  ["Scheme", d.contract?.schemeName],
                  ["Bid ID", d.contract?.bidId],
                  ["Auction Date & Ref", d.contract?.auctionDateRef],
                  ["Contract Sign Date", d.contract?.contractSignDate],
                  ["Valid To", d.contract?.validToDate],
                  ["Type of Consumer", d.contract?.typeOfConsumer],
                  ["Mode of Transport", d.contract?.modeOfTransport],
                ]}
              />
              <InfoCard
                title="Colliery & Grade"
                fields={[
                  ["Area", d.colliery?.area],
                  ["Colliery", d.colliery?.colliery],
                  ["Grade", d.colliery?.grade],
                  ["Size", d.colliery?.size],
                  ["STC Distance", d.colliery?.stcDistance],
                  ["GCV", d.colliery?.gcv],
                ]}
              />
              <MaterialCard material={d.material} />
              {d.particulars && d.particulars.length > 0 && <PricingTable particulars={d.particulars} />}
              {/* Payment Totals hidden per user request */}
            </div>
          </div>
        ))}
      </div>

      {/* ════════════════════════════════════════════
          SUMMARY DATA TABLE
      ════════════════════════════════════════════ */}
      <div className="summary-section">
        <div className="summary-header">
          <div className="summary-title">Document Summary Table</div>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color: "var(--muted)",
              letterSpacing: "0.04em",
            }}
          >
            All key fields — 1 row per PDF
          </span>
        </div>

        <div className="summary-table-wrap">
          <table className="stable" id="summaryTable">
            <thead>
              <tr>
                <th>#</th>
                <th>Customer Code</th>
                <th>Customer Name</th>
                <th>GSTIN</th>
                <th>Area Office</th>
                <th>Sales Doc No</th>
                <th>Sales Order Date</th>
                <th>Payment Due Date</th>
                <th>Auction Date &amp; Ref</th>
                <th>Mat. Code</th>
                <th>Description</th>
                <th>Quantity</th>
                <th className="num-h">Requisite Payment (INR)</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {dataArray.map((d, index) => {
                const summaryRow = buildSummaryRow(d);
                return (
                  <tr key={index}>
                    <td className="row-num">{index + 1}</td>
                    <td>{summaryRow.customerCode}</td>
                    <td className="text-cell" title={summaryRow.customerName}>{summaryRow.customerName}</td>
                    <td>{summaryRow.gstin}</td>
                    <td className="text-cell" title={summaryRow.areaOffice}>{summaryRow.areaOffice}</td>
                    <td>{summaryRow.salesDocNo}</td>
                    <td>{summaryRow.salesOrderDate}</td>
                    <td>{summaryRow.paymentDueDate}</td>
                    <td className="text-cell" title={summaryRow.auctionDateRef}>{summaryRow.auctionDateRef}</td>
                    <td>{summaryRow.materialCode}</td>
                    <td className="text-cell" title={summaryRow.description}>{summaryRow.description}</td>
                    <td>{summaryRow.quantity}</td>
                    <td className="amount-cell">{summaryRow.requisitePayment}</td>
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
                        onClick={() => {
                          if(window.confirm("Are you sure you want to delete this row?")) {
                            onDeleteRow && onDeleteRow(index);
                          }
                        }}
                        title="Delete"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 6h18"></path>
                          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                          <line x1="10" y1="11" x2="10" y2="17"></line>
                          <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                        Delete
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
        title="Edit Payment Advice"
        initialData={editingIndex !== null ? buildSummaryRow(dataArray[editingIndex]) : null}
        columns={[
          { key: "customerCode", label: "Customer Code" },
          { key: "customerName", label: "Customer Name" },
          { key: "gstin", label: "GSTIN" },
          { key: "areaOffice", label: "Area Office" },
          { key: "salesDocNo", label: "Sales Doc No" },
          { key: "salesOrderDate", label: "Sales Order Date" },
          { key: "paymentDueDate", label: "Payment Due Date" },
          { key: "auctionDateRef", label: "Auction Date & Ref" },
          { key: "materialCode", label: "Material Code" },
          { key: "description", label: "Description" },
          { key: "quantity", label: "Quantity" },
          { key: "requisitePayment", label: "Requisite Payment (INR)" },
        ]}
      />
    </section>
  );
}
