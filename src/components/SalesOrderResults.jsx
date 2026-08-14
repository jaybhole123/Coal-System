import { InfoCard } from "./Cards";
import { display } from "../utils/format";

export default function SalesOrderResults({ data, fileName, onReset, onExportJson, onExportCsv }) {
  const { company, sold_to_party, receiver, order_info, mine_info, totals, line_items, pricing, bank_details } = data;

  return (
    <section id="sales-order-results">
      {/* ── Action bar ── */}
      <div className="results-bar">
        <div>
          <div className="results-file">{fileName}</div>
          <div className="results-hint">Sales Order Extracted</div>
        </div>
        <div className="results-actions">
          <button className="btn" onClick={onExportJson}>
            ↓ Export JSON
          </button>
          <button className="btn" onClick={onExportCsv}>
            ↓ Export CSV
          </button>
          <button className="btn ghost" onClick={onReset}>
        ADD PDF
          </button>
        </div>
      </div>

      {/* ── Cards grid ── */}
      <div className="grid">
        <InfoCard
          title="Company Info"
          fields={[
            ["Name", company.name],
            ["GST", company.gst],
            ["Office Area", company.office_area],
          ]}
        />
        
        <InfoCard
          title="Sold To Party"
          fields={[
            ["Code", sold_to_party.code],
            ["Name", sold_to_party.name],
            ["Address", sold_to_party.address],
          ]}
        />

        <InfoCard
          title="Receiver (Billed To)"
          fields={[
            ["Customer Code", receiver.customer_code],
            ["Name", receiver.name],
            ["District", receiver.district],
            ["State", receiver.state],
            ["GSTIN", receiver.gstin],
          ]}
        />

        <InfoCard
          title="Order & Contract Info"
          fields={[
            ["Sales Order No", order_info.sales_order_number],
            ["Order Date", order_info.sales_order_date],
            ["Contract No", order_info.contract_number],
            ["Valid From", order_info.sales_order_valid_from],
            ["Valid To", order_info.sales_order_valid_to],
            ["Month", order_info.month],
            ["Scheme", order_info.scheme_name],
            ["Auction Date", order_info.auction_date],
            ["Transport Mode", order_info.mode_of_transport],
            ["Consumer Type", order_info.type_of_consumer],
            ["Destination", order_info.destination],
          ]}
        />

        <InfoCard
          title="Mine Info"
          fields={[
            ["Area", mine_info.area],
            ["Mine Code", mine_info.mine],
            ["Grade Desc", mine_info.grade_desc],
            ["Size", mine_info.size],
            ["Commodity", mine_info.commodity],
            ["STC Distance", mine_info.stc_distance],
            ["ZTCS Applicable", mine_info.ztcs_applicable],
            ["Qty (Words)", mine_info.quantity_words],
          ]}
        />

        <InfoCard
          title="Totals"
          fields={[
            ["Grand Total", totals.so_value_grand_total],
            ["Requisite Payment", totals.requisite_payment],
            ["Total Amount", totals.total_amount],
            ["GST to Deposit", totals.gst_to_deposit],
          ]}
        />
      </div>

      <div style={{ marginTop: 24, padding: "20px 22px", background: "var(--panel)", border: "1px solid var(--line)", borderRadius: "var(--radius)" }}>
        <h3 style={{ fontFamily: "var(--font-display)", fontSize: 13, textTransform: "uppercase", color: "var(--ember-bright)", marginTop: 0, paddingBottom: 10, borderBottom: "1px solid var(--line)" }}>
          Line Items
        </h3>
        <div style={{ overflowX: "auto" }}>
          <table className="ptable">
            <thead>
              <tr>
                <th>Item</th>
                <th>Mine</th>
                <th>Material</th>
                <th>Description</th>
                <th>HSN</th>
                <th>Unit</th>
                <th className="num">Quantity</th>
              </tr>
            </thead>
            <tbody>
              {line_items.map((item, i) => (
                <tr key={i}>
                  <td>{display(item.line_item)}</td>
                  <td>{display(item.mine)}</td>
                  <td>{display(item.material)}</td>
                  <td>{display(item.material_description)}</td>
                  <td>{display(item.hsn_code)}</td>
                  <td>{display(item.unit)}</td>
                  <td className="num">{display(item.quantity)}</td>
                </tr>
              ))}
              {line_items.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center", color: "var(--muted)" }}>No Line Items Found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ marginTop: 24, padding: "20px 22px", background: "var(--panel)", border: "1px solid var(--line)", borderRadius: "var(--radius)" }}>
        <h3 style={{ fontFamily: "var(--font-display)", fontSize: 13, textTransform: "uppercase", color: "var(--ember-bright)", marginTop: 0, paddingBottom: 10, borderBottom: "1px solid var(--line)" }}>
          Pricing Particulars
        </h3>
        <table className="ptable">
          <thead>
            <tr>
              <th>Description</th>
              <th className="num">Rate per TE (INR)</th>
              <th className="num">Amount (INR)</th>
            </tr>
          </thead>
          <tbody>
            {pricing.map((p, i) => (
              <tr key={i}>
                <td>{display(p.description)}</td>
                <td className="num">{display(p.rate_per_te)}</td>
                <td className="num">{display(p.amount)}</td>
              </tr>
            ))}
            {pricing.length === 0 && (
              <tr>
                <td colSpan="3" style={{ textAlign: "center", color: "var(--muted)" }}>No Pricing Found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 24, padding: "20px 22px", background: "var(--panel)", border: "1px solid var(--line)", borderRadius: "var(--radius)" }}>
        <h3 style={{ fontFamily: "var(--font-display)", fontSize: 13, textTransform: "uppercase", color: "var(--ember-bright)", marginTop: 0, paddingBottom: 10, borderBottom: "1px solid var(--line)" }}>
          Bank Details
        </h3>
        <table className="ptable">
          <thead>
            <tr>
              <th>Type</th>
              <th>UTR</th>
              <th>Date of Payment</th>
              <th>Document No.</th>
              <th>Bank Name</th>
              <th className="num">Amount</th>
            </tr>
          </thead>
          <tbody>
            {bank_details.map((b, i) => (
              <tr key={i}>
                <td>{display(b.type)}</td>
                <td>{display(b.utr)}</td>
                <td>{display(b.date_of_payment)}</td>
                <td>{display(b.document_no)}</td>
                <td>{display(b.bank_name)}</td>
                <td className="num">{display(b.amount)}</td>
              </tr>
            ))}
            {bank_details.length === 0 && (
              <tr>
                <td colSpan="6" style={{ textAlign: "center", color: "var(--muted)" }}>No Bank Details Found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

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
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{display(receiver.name || sold_to_party.name)}</td>
                <td>{display(mine_info.area)}</td>
                <td>{display(order_info.sales_order_number)}</td>
                <td>{display(order_info.sales_order_date)}</td>
                <td>{display(order_info.sales_order_valid_from)}</td>
                <td>{display(order_info.sales_order_valid_to)}</td>
                <td>{display(mine_info.mine)}</td>
                <td>{display(line_items[0]?.material_description)}</td>
                <td>{display(line_items[0]?.hsn_code)}</td>
                <td>{display(line_items[0]?.quantity)}</td>
                <td className="num">{display(totals.so_value_grand_total)}</td>
                <td className="num">{display(pricing.find(p => p.description?.includes("Basic Price"))?.rate_per_te || pricing[0]?.rate_per_te)}</td>
                <td className="num">{display(pricing.find(p => p.description?.includes("Basic Price"))?.amount || pricing[0]?.amount)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
