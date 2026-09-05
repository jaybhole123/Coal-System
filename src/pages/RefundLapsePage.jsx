import React, { useState, useEffect } from "react";
import { supabase } from "../utils/supabase";

export default function RefundLapsePage() {
  const [data, setData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const { data: dbData, error } = await supabase
          .from('sales_orders')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (dbData) {
          const mappedData = dbData.map((row, index) => ({
            sno: String(index + 1).padStart(2, "0"),
            party_name: row.name || "-",
            nemt: "-",
            dmf: "-",
            mines_name: row.mine || "-",
            do_no: row.sales_order_number || "-",
            do_issue_date: row.sales_order_valid_from || "-",
            do_last_date: row.sales_order_valid_to || "-",
            do_qty: row.quantity || "-",
            lifted_qty: "-",
            lapsed_qty: "-",
            qty_deduct: "-",
            rate_pmt: row.rate_per_te || "-",
            coal_value: row.amount || "-",
            less_emd: "-",
            refund_amt_of_coal: "-",
            royalty_pmt: "-",
            royalty_amount: "-"
          }));
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
    { key: "dmf", label: "DMF" }
  ];

  const filteredData = data.filter(row => 
    Object.values(row).some(val => String(val).toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="page-content">
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
                      <td key={col.key}>{row[col.key]}</td>
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
                          onClick={() => console.log("Edit clicked", row)}
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
                          onClick={() => { if(window.confirm("Are you sure you want to delete this row?")) { console.log("Delete clicked", row) } }}
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
    </div>
  );
}
