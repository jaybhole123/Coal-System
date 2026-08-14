import { useState } from "react";
import { InfoCard, MaterialCard } from "./Cards";
import PricingTable from "./PricingTable";
import { INR, display } from "../utils/format";

/**
 * Full results view — shown after a PDF is successfully parsed.
 *
 * Props:
 *   data        — parsed payment advice object
 *   fileName    — original filename string
 *   onReset     — callback to go back to dropzone
 *   onExportJson / onExportCsv — export callbacks
 */
export default function Results({ data, fileName, onReset, onExportJson, onExportCsv }) {
  const [isEditing, setIsEditing] = useState(false);
  const { contract, colliery, material, receiver, totals } = data;

  // Build the single summary row from parsed data
  const summaryRow = {
    customerCode: display(receiver.customerCode),
    customerName: display(receiver.customerName),
    gstin: display(receiver.gstin),
    areaOffice: display(data.areaOffice),
    salesDocNo: display(contract.salesDocNo),
    salesOrderDate: display(contract.salesOrderDate),
    paymentDueDate: display(contract.paymentDueDate),
    auctionDateRef: display(contract.auctionDateRef),
    materialCode: display(material?.materialCode),
    description: display(material?.description),
    quantity: material ? `${material.quantity ?? "—"} ${material.unit ?? ""}`.trim() : "—",
    requisitePayment: totals.requisitePayment !== null ? `₹ ${INR(totals.requisitePayment)}` : "—",
  };

  return (
    <section id="results">
      {/* ── Action bar ── */}
      <div className="results-bar">
        <div>
          <div className="results-file" id="resFileName">{fileName}</div>
          <div className="results-hint">Extraction complete</div>
        </div>
        <div className="results-actions">
          <button className="btn" id="btnJson" onClick={onExportJson}>
            ↓ Export JSON
          </button>
          <button className="btn" id="btnCsv" onClick={onExportCsv}>
            ↓ Export CSV
          </button>
          <button className="btn ghost" id="btnReset" onClick={onReset}>
            ADD PDF
          </button>
        </div>
      </div>

      {/* ── Cards grid ── */}
      <div className="grid" id="resultsGrid">
        <InfoCard
          title="Receiver (Billed To)"
          fields={[
            ["Customer Code", receiver.customerCode],
            ["Customer Name", receiver.customerName],
            ["GSTIN", receiver.gstin],
          ]}
        />

        <InfoCard
          title="Consignee (Shipped To)"
          fields={[
            ["Customer Code", data.consignee.customerCode],
            ["Customer Name", data.consignee.customerName],
            ["GSTIN", data.consignee.gstin],
          ]}
        />

        <InfoCard
          title="Contract & Auction"
          fields={[
            ["Area Office", data.areaOffice],
            ["Contract Number", contract.contractNumber],
            ["Sales Doc No", contract.salesDocNo],
            ["Sales Order Date", contract.salesOrderDate],
            ["PI Number", contract.piNumber],
            ["PI Date", contract.piDate],
            ["Payment Due Date", contract.paymentDueDate],
            ["Scheme", contract.schemeName],
            ["Bid ID", contract.bidId],
            ["Auction Date & Ref", contract.auctionDateRef],
            ["Contract Sign Date", contract.contractSignDate],
            ["Valid To", contract.validToDate],
            ["Type of Consumer", contract.typeOfConsumer],
            ["Mode of Transport", contract.modeOfTransport],
          ]}
        />

        <InfoCard
          title="Colliery & Grade"
          fields={[
            ["Area", colliery.area],
            ["Colliery", colliery.colliery],
            ["Grade", colliery.grade],
            ["Size", colliery.size],
            ["STC Distance", colliery.stcDistance],
            ["GCV", colliery.gcv],
          ]}
        />

        <MaterialCard material={material} />

        <PricingTable particulars={data.particulars} />
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
              <tr>
                <td className="row-num">1</td>
                <td contentEditable={isEditing} suppressContentEditableWarning style={{ backgroundColor: isEditing ? "var(--hover)" : "transparent", padding: isEditing ? "4px" : "", border: isEditing ? "1px dashed var(--border)" : "none", outline: "none" }}>{summaryRow.customerCode}</td>
                <td className="text-cell" title={summaryRow.customerName} contentEditable={isEditing} suppressContentEditableWarning style={{ backgroundColor: isEditing ? "var(--hover)" : "transparent", padding: isEditing ? "4px" : "", border: isEditing ? "1px dashed var(--border)" : "none", outline: "none" }}>
                  {summaryRow.customerName}
                </td>
                <td contentEditable={isEditing} suppressContentEditableWarning style={{ backgroundColor: isEditing ? "var(--hover)" : "transparent", padding: isEditing ? "4px" : "", border: isEditing ? "1px dashed var(--border)" : "none", outline: "none" }}>{summaryRow.gstin}</td>
                <td className="text-cell" title={summaryRow.areaOffice} contentEditable={isEditing} suppressContentEditableWarning style={{ backgroundColor: isEditing ? "var(--hover)" : "transparent", padding: isEditing ? "4px" : "", border: isEditing ? "1px dashed var(--border)" : "none", outline: "none" }}>
                  {summaryRow.areaOffice}
                </td>
                <td contentEditable={isEditing} suppressContentEditableWarning style={{ backgroundColor: isEditing ? "var(--hover)" : "transparent", padding: isEditing ? "4px" : "", border: isEditing ? "1px dashed var(--border)" : "none", outline: "none" }}>{summaryRow.salesDocNo}</td>
                <td contentEditable={isEditing} suppressContentEditableWarning style={{ backgroundColor: isEditing ? "var(--hover)" : "transparent", padding: isEditing ? "4px" : "", border: isEditing ? "1px dashed var(--border)" : "none", outline: "none" }}>{summaryRow.salesOrderDate}</td>
                <td contentEditable={isEditing} suppressContentEditableWarning style={{ backgroundColor: isEditing ? "var(--hover)" : "transparent", padding: isEditing ? "4px" : "", border: isEditing ? "1px dashed var(--border)" : "none", outline: "none" }}>{summaryRow.paymentDueDate}</td>
                <td className="text-cell" title={summaryRow.auctionDateRef} contentEditable={isEditing} suppressContentEditableWarning style={{ backgroundColor: isEditing ? "var(--hover)" : "transparent", padding: isEditing ? "4px" : "", border: isEditing ? "1px dashed var(--border)" : "none", outline: "none" }}>
                  {summaryRow.auctionDateRef}
                </td>
                <td contentEditable={isEditing} suppressContentEditableWarning style={{ backgroundColor: isEditing ? "var(--hover)" : "transparent", padding: isEditing ? "4px" : "", border: isEditing ? "1px dashed var(--border)" : "none", outline: "none" }}>{summaryRow.materialCode}</td>
                <td className="text-cell" title={summaryRow.description} contentEditable={isEditing} suppressContentEditableWarning style={{ backgroundColor: isEditing ? "var(--hover)" : "transparent", padding: isEditing ? "4px" : "", border: isEditing ? "1px dashed var(--border)" : "none", outline: "none" }}>
                  {summaryRow.description}
                </td>
                <td contentEditable={isEditing} suppressContentEditableWarning style={{ backgroundColor: isEditing ? "var(--hover)" : "transparent", padding: isEditing ? "4px" : "", border: isEditing ? "1px dashed var(--border)" : "none", outline: "none" }}>{summaryRow.quantity}</td>
                <td className="amount-cell" contentEditable={isEditing} suppressContentEditableWarning style={{ backgroundColor: isEditing ? "var(--hover)" : "transparent", padding: isEditing ? "4px" : "", border: isEditing ? "1px dashed var(--border)" : "none", outline: "none" }}>{summaryRow.requisitePayment}</td>
                <td style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                  <button
                    style={{
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "4px",
                      padding: "4px 8px",
                      fontSize: "11px",
                      fontWeight: "500",
                      borderRadius: "4px",
                      border: "1px solid var(--border)",
                      background: isEditing ? "#10b981" : "white",
                      color: isEditing ? "white" : "var(--text)",
                      boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                      transition: "all 0.15s ease",
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.background = isEditing ? "#059669" : "#f4f4f5"; }}
                    onMouseOut={(e) => { e.currentTarget.style.background = isEditing ? "#10b981" : "white"; }}
                    onClick={() => setIsEditing(!isEditing)}
                    title={isEditing ? "Save" : "Edit"}
                  >
                    {isEditing ? (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                        Save
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                        Edit
                      </>
                    )}
                  </button>
                  <button
                    style={{
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "4px",
                      padding: "4px 8px",
                      fontSize: "11px",
                      fontWeight: "500",
                      borderRadius: "4px",
                      border: "1px solid #fee2e2",
                      background: "#fef2f2",
                      color: "#dc2626",
                      boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                      transition: "all 0.15s ease",
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.background = "#fee2e2"; }}
                    onMouseOut={(e) => { e.currentTarget.style.background = "#fef2f2"; }}
                    onClick={() => {
                      if(window.confirm("Are you sure you want to delete this row?")) {
                        onReset(); // For now, delete will just reset the view as there's only 1 row
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
            </tbody>
          </table>
        </div>

        <p
          style={{
            marginTop: 10,
            fontSize: 11.5,
            color: "var(--muted)",
            fontFamily: "var(--font-mono)",
          }}
        >
          {/* 💡 Har nayi PDF upload karne par ek aur row add hogi (upcoming feature).
          Abhi Export CSV / JSON se full data download kar sakte hain. */}
        </p>
      </div>
    </section>
  );
}
