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
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="row-num">1</td>
                <td>{summaryRow.customerCode}</td>
                <td className="text-cell" title={summaryRow.customerName}>
                  {summaryRow.customerName}
                </td>
                <td>{summaryRow.gstin}</td>
                <td className="text-cell" title={summaryRow.areaOffice}>
                  {summaryRow.areaOffice}
                </td>
                <td>{summaryRow.salesDocNo}</td>
                <td>{summaryRow.salesOrderDate}</td>
                <td>{summaryRow.paymentDueDate}</td>
                <td className="text-cell" title={summaryRow.auctionDateRef}>
                  {summaryRow.auctionDateRef}
                </td>
                <td>{summaryRow.materialCode}</td>
                <td className="text-cell" title={summaryRow.description}>
                  {summaryRow.description}
                </td>
                <td>{summaryRow.quantity}</td>
                <td className="amount-cell">{summaryRow.requisitePayment}</td>
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
