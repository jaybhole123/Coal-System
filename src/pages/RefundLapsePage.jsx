import React, { useState, useEffect } from "react";
import { supabase } from "../utils/supabase";
import EditModal from "../components/EditModal";

export default function RefundLapsePage() {
  const [data, setData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [toastMessage, setToastMessage] = useState("");

  const handleSaveEdit = async (updatedData) => {
    const item = data[editingIndex];
    if (item && item.id) {
      try {
        const lapsedForDb = updatedData.lapsed_qty ? parseFloat(updatedData.lapsed_qty) : null;
        const doQtyForDb = parseFloat(item.do_qty) || 0;
        const liftedForDb = item.do_qty && item.do_qty !== "-" ? doQtyForDb - (lapsedForDb || 0) : (updatedData.lifted_qty ? parseFloat(updatedData.lifted_qty) : null);

        const updatePayload = {
          lapsed_qty: lapsedForDb,
          lifted_qty: liftedForDb
        };
        const { error: dbError } = await supabase.from('sales_orders').update(updatePayload).eq('id', item.id);
        if (dbError) throw dbError;
        
        // Calculate updated royalty amount for local state
        const lapsed = parseFloat(updatedData.lapsed_qty) || 0;
        const doQty = parseFloat(item.do_qty) || 0;
        const computedLiftedQty = item.do_qty && item.do_qty !== "-" ? (doQty - lapsed) : (updatedData.lifted_qty || "-");

        const royalty = parseFloat(item.royalty_pmt) || parseFloat(updatedData.royalty_pmt) || 0;
        const nemtVal = parseFloat(updatedData.nemt) || parseFloat(item.nemt) || 0;
        const dmfVal = parseFloat(updatedData.dmf) || parseFloat(item.dmf) || 0;
        const calculatedRoyaltyAmt = lapsed > 0 ? ((royalty + nemtVal + dmfVal) * lapsed).toFixed(2) : "-";

        const soValueRate = parseFloat(item.so_value_rate) || parseFloat(updatedData.so_value_rate) || 0;
        const tcsRate = parseFloat(item.tcs) || parseFloat(updatedData.tcs) || 0;
        const calculatedCoalValue = lapsed > 0 ? ((soValueRate - tcsRate) * lapsed).toFixed(2) : "-";

        const emdRate = parseFloat(item.less_emd_rate) || 0;
        const calculatedLessEmd = lapsed > 0 ? (lapsed * emdRate).toFixed(2) : "-";

        // Update local state
        const newData = [...data];
        newData[editingIndex] = { 
          ...item, 
          ...updatedData, 
          lapsed_qty: updatedData.lapsed_qty || "-", 
          lifted_qty: computedLiftedQty,
          royalty_amount: calculatedRoyaltyAmt,
          coal_value: calculatedCoalValue,
          less_emd: calculatedLessEmd
        };
        setData(newData);
        setToastMessage("Data successfully updated!");
        setTimeout(() => setToastMessage(""), 3000);
      } catch (err) {
        console.error("Error updating record:", err);
        alert("Error updating record: " + err.message);
      }
    } else {
        const newData = [...data];
        newData[editingIndex] = { ...item, ...updatedData };
        setData(newData);
    }
    setEditingIndex(null);
  };

  const handleDelete = async (row) => {
    if (window.confirm("Are you sure you want to delete this row?")) {
      try {
        const { error } = await supabase.from('sales_orders').delete().eq('id', row.id);
        if (error) throw error;
        
        setData(prevData => prevData.filter(item => item.id !== row.id));
        
        setToastMessage("Data successfully deleted!");
        setTimeout(() => setToastMessage(""), 3000);
      } catch (err) {
        console.error("Error deleting record:", err);
        alert("Error deleting record: " + err.message);
      }
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const { data: dbData, error } = await supabase
          .from('sales_orders')
          .select('*')
          .order('created_at', { ascending: true });

        if (error) throw error;

        if (dbData) {
          const mappedData = dbData.map((row, index) => {
            const lapsed = parseFloat(row.lapsed_qty) || 0;
            const royalty = parseFloat(row.royalty_pmt) || 0;
            const nemtVal = parseFloat(row.nemt) || 0;
            const dmfVal = parseFloat(row.dmf) || 0;
            const royaltyAmt = lapsed > 0 ? ((royalty + nemtVal + dmfVal) * lapsed).toFixed(2) : "-";
            
            const soValueRate = parseFloat(row.so_value_rate) || 0;
            const tcsRate = parseFloat(row.tcs) || 0;
            const calculatedCoalValue = lapsed > 0 ? ((soValueRate - tcsRate) * lapsed).toFixed(2) : "-";

            const doQty = parseFloat(row.quantity) || 0;
            const computedLiftedQty = row.quantity ? (doQty - lapsed) : (row.lifted_qty || "-");

            const emdRate = parseFloat(row.less_emd) || 0;
            const calculatedLessEmd = lapsed > 0 ? (lapsed * emdRate).toFixed(2) : "-";

            return {
              id: row.id,
              sno: String(index + 1).padStart(2, "0"),
              party_name: row.name || "-",
              nemt: row.nemt != null ? row.nemt : "-",
              dmf: row.dmf != null ? row.dmf : "-",
              mines_name: row.mine || "-",
              do_no: row.sales_order_number || "-",
              do_issue_date: row.sales_order_valid_from || "-",
              do_last_date: row.sales_order_valid_to || "-",
              do_qty: row.quantity || "-",
              lifted_qty: computedLiftedQty,
              lapsed_qty: row.lapsed_qty || "-",
              qty_deduct: "-",
              rate_pmt: row.rate_per_te || "-",
              coal_value: calculatedCoalValue,
              less_emd: calculatedLessEmd,
              less_emd_rate: row.less_emd != null ? row.less_emd : "-",
              refund_amt_of_coal: "-",
              royalty_pmt: row.royalty_pmt != null ? row.royalty_pmt : "-",
              royalty_amount: royaltyAmt,
              tcs: row.tcs || "-",
              so_value_rate: row.so_value_rate || "-",
              pdf_url: row.pdf_url || null
            };
          });
          setData(mappedData);
        }
      } catch (err) {
        console.error("Error fetching sales orders for Refund/Lapse page:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const columns = [
    { key: "sno", label: "S.No." },
    { key: "party_name", label: "PARTY NAME" },
    { key: "mines_name", label: "Mines Name" },
    { key: "do_no", label: "Do No" },
    { key: "do_issue_date", label: "Do Issude Date" },
    { key: "do_last_date", label: "Do Last Date" },
    { key: "do_qty", label: "Do Qty" },
    { key: "lifted_qty", label: "Lifted Qty" },
    { key: "lapsed_qty", label: "Lapsed Qty" },
    { key: "qty_deduct", label: "Qty deduct" },
    { key: "rate_pmt", label: "Rate PMT" },
    { key: "coal_value", label: "COAL VALUE" },
    { key: "less_emd", label: "LESS EMD" },
    { key: "refund_amt_of_coal", label: "REFUND AMT OF COAL" },
    { key: "royalty_pmt", label: "Royalty PMT" },
    { key: "royalty_amount", label: "ROYALTY AMOUNT" },
    { key: "nemt", label: "NEMT" },
    { key: "dmf", label: "DMF" },
    { key: "tcs", label: "TCS" },
    { key: "so_value_rate", label: "SO Value Rate" },
    { key: "preview", label: "Preview" }
  ];

  const summaryColumns = [
    { key: "sno", label: "S.No." },
    { key: "party_name", label: "PARTY NAME" },
    { key: "royalty_pmt", label: "Royalty PMT" },
    { key: "nemt", label: "NEMT" },
    { key: "dmf", label: "DMF" },
    { key: "tcs", label: "TCS" },
    { key: "so_value_rate", label: "SO Value Rate" },
    { key: "less_emd_rate", label: "EMD" }
  ];

  const filteredData = data.filter(row => 
    Object.values(row).some(val => String(val).toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="page-content">
      {toastMessage && (
        <div style={{
          position: "fixed",
          top: "24px",
          right: "24px",
          background: "#16a34a",
          color: "white",
          padding: "12px 24px",
          borderRadius: "6px",
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
          zIndex: 9999,
          fontWeight: 500,
          fontSize: "14px",
          display: "flex",
          alignItems: "center",
          gap: "8px"
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          {toastMessage}
        </div>
      )}

      <div className="topbar" style={{ padding: "0 0 20px 0", borderBottom: "none", display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Refund / Lapse</h2>
        
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
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
          <button className="btn">ADD DATA</button>
        </div>
      </div>
      
      <div className="table-card">
        <div className="table-header">
          <div className="table-title">Refund & Lapse Data</div>
        </div>
        <div className="table-scroll" style={{ overflowX: "auto" }}>
          <table className="stable" style={{ minWidth: "1800px" }}>
            <thead>
              <tr>
                {columns.map(col => (
                  <th key={col.key}>{col.label}</th>
                ))}
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={columns.length + 1} style={{ textAlign: "center", padding: "40px", color: "var(--muted)" }}>
                    Loading data...
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} style={{ textAlign: "center", padding: "40px", color: "var(--muted)" }}>
                    No data available
                  </td>
                </tr>
              ) : (
                filteredData.map((row, i) => (
                  <tr key={i}>
                    {columns.map(col => (
                      <td key={col.key}>
                        {col.key === "preview" ? (
                          row.pdf_url ? (
                            <a href={row.pdf_url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--primary)", textDecoration: "none", fontWeight: 500, fontSize: "12px" }}>
                              View PDF
                            </a>
                          ) : (
                            <span style={{ color: "var(--muted)" }}>-</span>
                          )
                        ) : ["nemt", "dmf", "tcs", "so_value_rate"].includes(col.key) ? (
                          "-"
                        ) : (
                          row[col.key]
                        )}
                      </td>
                    ))}
                    <td>
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
                          onClick={() => setEditingIndex(i)}
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
                          onClick={() => handleDelete(row)}
                          title="Delete"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Summary Table ── */}
      <div className="table-card" style={{ marginTop: 24 }}>
        <div className="table-header">
          <div className="table-title">Tax Summary Data</div>
        </div>
        <div className="table-scroll" style={{ overflowX: "auto" }}>
          <table className="stable">
            <thead>
              <tr>
                {summaryColumns.map(col => (
                  <th key={col.key}>{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={summaryColumns.length} style={{ textAlign: "center", padding: "40px", color: "var(--muted)" }}>
                    Loading data...
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={summaryColumns.length} style={{ textAlign: "center", padding: "40px", color: "var(--muted)" }}>
                    No data available
                  </td>
                </tr>
              ) : (
                filteredData.map((row, i) => (
                  <tr key={i}>
                    {summaryColumns.map(col => (
                      <td key={col.key}>{row[col.key]}</td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <EditModal
        isOpen={editingIndex !== null}
        onClose={() => setEditingIndex(null)}
        onSave={handleSaveEdit}
        title="Edit Refund / Lapse Entry"
        initialData={editingIndex !== null ? {
          ...data[editingIndex],
          lapsed_qty: data[editingIndex].lapsed_qty === "-" ? "" : data[editingIndex].lapsed_qty
        } : null}
        columns={[
          { key: "lapsed_qty", label: "Lapsed Qty" }
        ]}
      />

    </div>
  );
}
