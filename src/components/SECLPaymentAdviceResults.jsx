import React, { useRef, useState, useMemo } from "react";
import * as XLSX from "xlsx";
import EditModal from "./EditModal";
import { exportToPDF } from "../utils/exportHelpers";

export default function SECLPaymentAdviceResults({ data, fileName, onReset, onAddFiles, onSave, onDeleteRow, onUpdateRow, onAddManual }) {
  const fileInputRef = useRef(null);
  const [editingIndex, setEditingIndex] = useState(null);

  const handleEditClick = (index) => setEditingIndex(index);
  const handleSaveEdit = (updatedData) => {
    onUpdateRow && onUpdateRow(editingIndex, updatedData);
    setEditingIndex(null);
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []).filter(f => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"));
    if (files.length > 0 && onAddFiles) onAddFiles(files);
    e.target.value = "";
  };

  // Ensure data is array
  const allItems = Array.isArray(data) ? data : [data];

  // Grouping logic (matching HTML exactly)
  const { groups, order, tQty, tAmt, tGrand, tTcs, tInclTotal } = useMemo(() => {
    const groups = {};
    const order = [];
    let tQty = 0, tAmt = 0, tGrand = 0, tTcs = 0, tInclTotal = 0;

    allItems.forEach((rec, index) => {
      // Add a stable index property for Edit/Delete ops if not already present
      const r = { ...rec, _originalIndex: index };
      
      const cn = r.customerName || "Unknown";
      if (!groups[cn]) {
        groups[cn] = { name: cn, rows: [], qty: 0, req: 0, grand: 0, invoices: 0, tcs: 0, inclTotal: 0 };
        order.push(cn);
      }
      const g = groups[cn];
      g.rows.push(r);
      g.invoices++;
      
      if (r.quantity) { g.qty += r.quantity; tQty += r.quantity; }
      if (r.requisitePayment) { g.req += r.requisitePayment; tAmt += r.requisitePayment; }
      if (r.grandTotal) { g.grand += r.grandTotal; tGrand += r.grandTotal; }
      if (r.tcsAmount) { g.tcs += r.tcsAmount; tTcs += r.tcsAmount; }
      if (r.inclTotal !== null && r.inclTotal !== undefined) { 
        g.inclTotal += r.inclTotal; 
        tInclTotal += r.inclTotal; 
      }
    });
    
    return { groups, order, tQty, tAmt, tGrand, tTcs, tInclTotal };
  }, [allItems]);

  // Excel Export matching the HTML logic
  const handleExportExcel = () => {
    if (!allItems.length) {
      alert("No data to export.");
      return;
    }
    const headers = ['S.No', 'Mines Name', 'Customer Name', 'Quantity (MT)', 'Requisite Payment (INR)', 'Grand Total incl. EMD', 'Auction Date', 'Due Date', 'Bid Price PMT', 'Including 50 PMT', 'Including 50 Total', 'TCS'];
    const exportData = [];
    let exSno = 0;

    order.forEach(cn => {
      const g = groups[cn];
      g.rows.forEach(r => {
        exSno++;
        const safeNum = (v) => (v === null || v === undefined || isNaN(v)) ? 'Not Found' : Number(Number(v).toFixed(2));
        const inclTotalEx = (r.inclTotal !== null && r.inclTotal !== undefined) ? r.inclTotal : null;
        
        exportData.push([
          exSno,
          r.minesName,
          r.customerName,
          r.quantity !== null ? r.quantity : 'Not Found',
          r.requisitePayment !== null ? r.requisitePayment : 'Not Found',
          r.grandTotal !== null ? r.grandTotal : 'Not Found',
          r.auctionDate || 'Not Found',
          r.dueDate,
          r.bidPrice !== null ? r.bidPrice : 'Not Found',
          safeNum(r.incl50),
          inclTotalEx !== null ? Number(inclTotalEx.toFixed(2)) : 'Not Found',
          r.tcsAmount || 0
        ]);
      });
      // Party subtotal row
      exportData.push([
        '',
        '↳ ' + g.name + ' (' + g.invoices + ' invoices)',
        '',
        g.qty,
        '₹' + g.req.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        '₹' + g.grand.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        '', '', '', '',
        '₹' + g.inclTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        g.tcs ? '₹' + g.tcs.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'
      ]);
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...exportData]);
    ws['!cols'] = [6, 22, 28, 14, 26, 20, 14, 18, 14, 18, 18, 16].map(w => ({ wch: w }));
    XLSX.utils.book_append_sheet(wb, ws, 'Payment Advice');
    
    const cleanName = (fileName || "secl_payment_advice").replace(/\.[^/.]+$/, "");
    XLSX.writeFile(wb, `${cleanName}.xlsx`);
  };

  const handleExportPdf = () => {
    exportToPDF(allItems, EDIT_COLS, fileName || "secl_payment_advice", "SECL Payment Advice Summary");
  };

  const rd2 = (v) => (v === null || v === undefined || isNaN(v)) ? null : Math.round(v * 100) / 100;
  const formatN = (v) => (v === null || v === undefined || isNaN(v)) ? "Not Found" : v.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const formatINR = (v) => (v === null || v === undefined || isNaN(v)) ? "Not Found" : `₹${v.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const EDIT_COLS = [
    { key: "minesName", label: "Mines Name" },
    { key: "customerName", label: "Customer Name" },
    { key: "quantity", label: "Quantity (MT)" },
    { key: "requisitePayment", label: "Requisite Payment" },
    { key: "grandTotal", label: "Grand Total" },
    { key: "auctionDate", label: "Auction Date" },
    { key: "dueDate", label: "Due Date" },
    { key: "bidPrice", label: "Bid Price" },
    { key: "incl50", label: "Including 50 PMT" },
    { key: "inclTotal", label: "Including 50 Total" },
    { key: "tcsAmount", label: "TCS Amount" }
  ];

  return (
    <section id="results">
      {/* ACTION BAR */}
      <div className="results-bar">
        <div>
          <div className="results-file" id="resFileName">{fileName}</div>
          <div className="results-hint">SECL Payment Advice Analyzer</div>
        </div>
        <div className="results-actions" style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>

          <button className="btn ghost" onClick={handleExportExcel} style={{ borderColor: "#107c41", color: "#107c41", display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(16, 124, 65, 0.04)" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="8" y1="13" x2="16" y2="13"></line><line x1="8" y1="17" x2="16" y2="17"></line></svg>
            EXCEL
          </button>
          <button className="btn ghost" onClick={handleExportPdf} style={{ borderColor: "#d6251b", color: "#d6251b", display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(214, 37, 27, 0.04)" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><path d="M9 15h1a2 2 0 0 0 0-4H9v4Z"></path></svg>
            PDF
          </button>
          <input type="file" multiple ref={fileInputRef} onChange={handleFileChange} style={{ display: "none" }} accept=".pdf" />
          <button className="btn outline" onClick={onAddManual}>+ MANUAL ENTRY</button>
          <button className="btn" onClick={() => fileInputRef.current?.click()}>ADD PDF</button>
        </div>
      </div>

      <div className="results-content">
        {/* PARTY CARDS */}
        {order.length > 0 && (
          <div className="party-cards show" style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "20px" }}>
            {order.map(cn => {
              const g = groups[cn];
              return (
                <div key={cn} className="party-card" style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "12px", padding: "16px 20px", minWidth: "240px", flex: 1 }}>
                  <div className="pc-name" style={{ fontSize: "15px", fontWeight: 700, color: "var(--text)", marginBottom: "10px", letterSpacing: "0.3px" }}>{g.name}</div>
                  <div className="pc-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "14px", marginBottom: "5px", fontWeight: 600 }}>
                    <span className="pc-label" style={{ color: "var(--muted)" }}>Invoices</span>
                    <span className="pc-val green" style={{ color: "#3fb950" }}>{g.invoices}</span>
                  </div>
                  <div className="pc-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "14px", marginBottom: "5px", fontWeight: 600 }}>
                    <span className="pc-label" style={{ color: "var(--muted)" }}>Total Qty (MT)</span>
                    <span className="pc-val gold" style={{ color: "#e3b341" }}>{g.qty.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="pc-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "14px", marginBottom: "5px", fontWeight: 600 }}>
                    <span className="pc-label" style={{ color: "var(--muted)" }}>Requisite Payment</span>
                    <span className="pc-val gold" style={{ color: "#e3b341" }}>₹{g.req.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TABLE */}
        <div className="summary-section" style={{ marginTop: 0 }}>
          <div className="summary-header">
            <div className="summary-title">Extracted Payment Records</div>
          </div>
          <div className="summary-table-wrap">
            {allItems.length > 0 ? (
              <table className="stable secl-table">
                <thead>
                  <tr>
                    <th className="r">S.No</th>
                    <th>Mines Name</th>
                    <th>Customer Name</th>
                    <th className="r">Quantity (MT)</th>
                    <th className="r">Amount<br /><small style={{ fontWeight: 400, textTransform: "none" }}>(Requisite Payment)</small></th>
                    <th className="r">Grand Total<br /><small style={{ fontWeight: 400, textTransform: "none" }}>PMT (÷Qty)</small></th>
                    <th>Auction Date</th>
                    <th>Due Date</th>
                    <th className="r">Bid Price<br /><small style={{ fontWeight: 400, textTransform: "none" }}>PMT (Basic)</small></th>
                    <th className="r">Including 50<br /><small style={{ fontWeight: 400, textTransform: "none" }}>PMT Rate</small></th>
                    <th>Preview</th>
                    <th style={{ width: "60px", textAlign: "center" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    let displaySno = 0;
                    const rows = [];
                    order.forEach(cn => {
                      const g = groups[cn];
                      g.rows.forEach(r => {
                        displaySno++;
                        rows.push(
                          <tr key={`row-${r._originalIndex}`}>
                            <td className="sno" data-label="S.No">{String(displaySno).padStart(2, '0')}</td>
                            <td className="mines" data-label="Mines Name">
                              {r.minesName}
                              {r.isManual && <span className="manual-badge" style={{ display: "inline-block", padding: "1px 5px", background: "rgba(31,111,235,0.15)", color: "var(--primary)", borderRadius: "3px", fontSize: "9px", fontFamily: "var(--font-mono)", fontWeight: 600, verticalAlign: "middle", marginLeft: "4px" }}>MANUAL</span>}
                            </td>
                            <td className="mines" style={{ fontWeight: 400 }} data-label="Customer Name">{r.customerName}</td>
                            <td className="r" data-label="Quantity">{r.quantity !== null ? r.quantity.toLocaleString('en-IN') : <span className="val-nf" style={{ color: "var(--danger)" }}>Not Found</span>}</td>
                            <td className="r" data-label="Requisite Payment">
                              <span style={{ color: "#e3b341", fontWeight: 600 }}>{formatINR(r.requisitePayment)}</span>
                            </td>
                            <td className="r" data-label="Grand Total PMT">
                              <span style={{ color: "var(--primary)" }}>{formatN(rd2(r.grandPMT))}</span>
                            </td>
                            <td className="date" data-label="Auction Date">{r.auctionDate || "—"}</td>
                            <td className="date" data-label="Due Date">{r.dueDate}</td>
                            <td className="r" data-label="Bid Price PMT">{formatN(r.bidPrice !== null ? rd2(r.bidPrice) : null)}</td>
                            <td className="r" data-label="Incl 50 PMT">
                              <span style={{ color: "#3fb950", fontWeight: 600 }}>{formatN(rd2(r.incl50))}</span>
                            </td>
                            <td data-label="Preview">
                              {r.pdfUrl ? (
                                <a href={r.pdfUrl} target="_blank" rel="noopener noreferrer" style={{ color: "var(--primary)", textDecoration: "none", fontWeight: 500, fontSize: "12px" }}>
                                  View PDF
                                </a>
                              ) : (
                                <span style={{ color: "var(--muted)" }}>-</span>
                              )}
                            </td>
                            <td data-label="Action">
                              <div style={{ display: "flex", gap: "6px", alignItems: "center", justifyContent: "flex-end" }}>
                                <button
                                  style={{ cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", padding: "4px 8px", fontSize: "11px", fontWeight: "500", borderRadius: "4px", border: "1px solid #dcfce7", background: "#f0fdf4", color: "#16a34a", boxShadow: "0 1px 2px rgba(0,0,0,0.05)", transition: "all 0.15s ease" }}
                                  onMouseOver={(e) => { e.currentTarget.style.background = "#dcfce7"; }}
                                  onMouseOut={(e) => { e.currentTarget.style.background = "#f0fdf4"; }}
                                  onClick={() => handleEditClick(r._originalIndex)}
                                  title="Edit"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                  Edit
                                </button>
                                <button
                                  style={{ cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", padding: "4px 8px", fontSize: "11px", fontWeight: "500", borderRadius: "4px", border: "1px solid #fee2e2", background: "#fef2f2", color: "#dc2626", boxShadow: "0 1px 2px rgba(0,0,0,0.05)", transition: "all 0.15s ease" }}
                                  onMouseOver={(e) => { e.currentTarget.style.background = "#fee2e2"; }}
                                  onMouseOut={(e) => { e.currentTarget.style.background = "#fef2f2"; }}
                                  onClick={() => { if(window.confirm("Are you sure you want to delete this row?")) { onDeleteRow && onDeleteRow(r._originalIndex); } }}
                                  title="Delete"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      });

                      // Party subtotal row
                      rows.push(
                        <tr key={`sub-${cn}`} className="party-sub-row" style={{ background: "rgba(88,166,255,0.06)", borderTop: "1px solid rgba(88,166,255,0.2)", borderBottom: "2px solid rgba(88,166,255,0.25)" }}>
                          <td colSpan="3" style={{ color: "var(--primary)", fontFamily: "var(--font-mono)", fontSize: "12px", padding: "10px 14px" }}>
                            <span style={{ color: "var(--primary)", marginRight: "4px" }}>↳</span>
                            {g.name} — {g.invoices} invoice{g.invoices > 1 ? 's' : ''}
                          </td>
                          <td className="r" data-label="Total Qty" style={{ color: "var(--primary)", fontFamily: "var(--font-mono)", fontSize: "12px", padding: "10px 14px", fontWeight: 600 }}>{g.qty.toLocaleString('en-IN')}</td>
                          <td className="r" data-label="Total Payment" style={{ color: "#e3b341", fontFamily: "var(--font-mono)", fontSize: "12px", padding: "10px 14px", fontWeight: 600 }}>₹{g.req.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          <td colSpan="6"></td>
                          <td></td>
                        </tr>
                      );
                    });
                    
                    // Grand Total Row
                    rows.push(
                      <tr key="totals" className="totals-row" style={{ background: "var(--panel)", borderTop: "2px solid var(--border)" }}>
                        <td colSpan="3" style={{ padding: "12px 14px", fontSize: "12px", color: "var(--muted)", fontWeight: 600 }}>
                          TOTAL &nbsp;·&nbsp; {allItems.length} record{allItems.length > 1 ? 's' : ''}
                        </td>
                        <td className="r" data-label="Total Qty" style={{ color: "#3fb950", fontFamily: "var(--font-mono)", fontWeight: 600, padding: "12px 14px" }}>{tQty.toLocaleString('en-IN')}</td>
                        <td className="r" data-label="Total Payment" style={{ color: "#e3b341", fontFamily: "var(--font-mono)", fontWeight: 600, padding: "12px 14px" }}>₹{tAmt.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td colSpan="6"></td>
                        <td></td>
                      </tr>
                    );
                    
                    return rows;
                  })()}
                </tbody>
              </table>
            ) : (
              <div style={{ padding: 20, textAlign: "center", color: "var(--text-muted)" }}>
                No records found.
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
        title="Edit Record"
        initialData={editingIndex !== null ? allItems[editingIndex] : null}
        columns={EDIT_COLS}
      />
    </section>
  );
}
