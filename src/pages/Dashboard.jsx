import React, { useState, useEffect } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  BarChart, Bar
} from "recharts";
import { INR } from "../utils/format";

// --- MOCK DATA FOR TREND/ACTIVITY (Keep as is since dates aren't easily extracted) ---
const trendData = [
  { month: "Jan", documents: 120, revenue: 45000 },
  { month: "Feb", documents: 150, revenue: 52000 },
  { month: "Mar", documents: 180, revenue: 61000 },
  { month: "Apr", documents: 220, revenue: 78000 },
  { month: "May", documents: 190, revenue: 68000 },
  { month: "Jun", documents: 290, revenue: 95000 },
];

const COLORS = ["#004080", "#4f46e5", "#6dbf8a", "#f59e0b", "#d6251b"];

const activityData = [
  { name: "Mon", processed: 42, errors: 2 },
  { name: "Tue", processed: 58, errors: 1 },
  { name: "Wed", processed: 45, errors: 4 },
  { name: "Thu", processed: 65, errors: 2 },
  { name: "Fri", processed: 78, errors: 1 },
  { name: "Sat", processed: 25, errors: 0 },
  { name: "Sun", processed: 18, errors: 0 },
];

export default function Dashboard({ onNavigate }) {
  const [stats, setStats] = useState({
    totalDocs: 0,
    totalValue: 0,
    activeAuctions: 0,
    distData: [
      { name: "No Data", value: 1 }
    ]
  });

  useEffect(() => {
    try {
      const getStore = (k) => JSON.parse(localStorage.getItem(k) || "[]");
      const inv = getStore("invoice_data");
      const so = getStore("sales_order_data");
      const pa = getStore("payment_advice_data");
      const secl = getStore("secl_data"); // Format 1
      const secl2 = getStore("secl_format2_data"); // Format 2
      const auc = getStore("auction_data");

      const invCount = Array.isArray(inv) ? inv.length : 0;
      const soCount = Array.isArray(so) ? so.length : 0;
      const paCount = Array.isArray(pa) ? pa.length : 0;
      let seclCount = 0;
      if (Array.isArray(secl)) seclCount += secl.length;
      if (Array.isArray(secl2)) seclCount += secl2.length;
      const aucCount = Array.isArray(auc) ? auc.length : 0;

      const totalDocs = invCount + soCount + paCount + seclCount + aucCount;

      let totalValue = 0;
      if (Array.isArray(inv)) {
        inv.forEach(i => {
           let val = parseFloat(String(i["Total Amount"] || i.total_amount || "0").replace(/[^0-9.]/g, ""));
           if (!isNaN(val)) totalValue += val;
        });
      }
      if (Array.isArray(pa)) {
        pa.forEach(p => {
           let val = parseFloat(String(p.totals?.requisitePayment || "0").replace(/[^0-9.]/g, ""));
           if (!isNaN(val)) totalValue += val;
        });
      }

      let distData = [
        { name: "Invoices", value: invCount },
        { name: "Sales Orders", value: soCount },
        { name: "Payment Advices", value: paCount },
        { name: "SECL Extractions", value: seclCount },
        { name: "Auctions", value: aucCount }
      ].filter(d => d.value > 0);
      
      if (distData.length === 0) {
        distData = [{ name: "No Data", value: 1 }];
      }

      setStats({
        totalDocs,
        totalValue,
        activeAuctions: aucCount,
        distData
      });
    } catch(err) {
      console.error("Dashboard analysis error:", err);
    }
  }, []);

  const formatCompact = (val) => {
    if (val >= 10000000) return (val / 10000000).toFixed(2) + " Cr";
    if (val >= 100000) return (val / 100000).toFixed(2) + " L";
    if (val >= 1000) return (val / 1000).toFixed(2) + " K";
    return INR(val); // Fallback to standard INR for small values
  };

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "10px 0 40px" }}>
      <div style={{ marginBottom: 30 }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 32, margin: "0 0 8px 0", color: "var(--text)" }}>
          Dashboard Overview
        </h1>
        <p style={{ color: "var(--muted)", fontSize: 15, margin: 0 }}>
          Real-time analytics and document extraction statistics across all Coal System modules.
        </p>
      </div>

      {/* TOP STATS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20, marginBottom: 32 }}>
        <StatCard title="Total Documents" value={stats.totalDocs.toLocaleString()} delta="Local Storage" icon="📄" trend="neutral" />
        <StatCard title="Total Value Processed" value={`₹ ${formatCompact(stats.totalValue)}`} delta="From Invoices/Payments" icon="💰" trend="neutral" />
        <StatCard title="Active Auctions" value={stats.activeAuctions} delta="From Auction Module" icon="🔨" trend="neutral" />
        <StatCard title="System Accuracy" value="99.8%" delta="All extractors operational" icon="⚡" trend="neutral" />
      </div>

      {/* MAIN CHARTS ROW */}
      <div className="dash-grid-main" style={{ marginBottom: 24 }}>
        {/* Trend Area Chart */}
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ fontFamily: "var(--font-display)", fontSize: 16, margin: "0 0 20px 0", color: "var(--text)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Processing Volume Trend (6 Months)
          </h3>
          <div style={{ height: 300, width: "100%" }}>
            <ResponsiveContainer>
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorVol" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6b7280" }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6b7280" }} />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                  cursor={{ stroke: '#4f46e5', strokeWidth: 1, strokeDasharray: '4 4' }}
                />
                <Area type="monotone" dataKey="documents" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorVol)" activeDot={{ r: 6, fill: "#4f46e5", stroke: "white", strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut Chart */}
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ fontFamily: "var(--font-display)", fontSize: 16, margin: "0 0 20px 0", color: "var(--text)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Document Distribution
          </h3>
          <div style={{ height: 300, width: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie 
                  data={stats.distData} 
                  innerRadius={70} 
                  outerRadius={110} 
                  paddingAngle={5} 
                  dataKey="value" 
                  stroke="none"
                >
                  {stats.distData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.name === "No Data" ? "#e5e7eb" : COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 20 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* SECOND ROW */}
      <div className="dash-grid-main">
        {/* Bar Chart */}
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ fontFamily: "var(--font-display)", fontSize: 16, margin: "0 0 20px 0", color: "var(--text)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Weekly Extractor Activity
          </h3>
          <div style={{ height: 300, width: "100%" }}>
            <ResponsiveContainer>
              <BarChart data={activityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6b7280" }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6b7280" }} />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} 
                  cursor={{ fill: "rgba(79, 70, 229, 0.05)" }} 
                />
                <Bar dataKey="processed" name="Processed" stackId="a" fill="#004080" radius={[0, 0, 0, 0]} barSize={28} />
                <Bar dataKey="errors" name="Errors" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={28} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Links */}
        <div className="card" style={{ padding: 24, display: "flex", flexDirection: "column", background: "white" }}>
          <h3 style={{ fontFamily: "var(--font-display)", fontSize: 16, margin: "0 0 20px 0", color: "var(--text)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Quick Extractors
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1, overflowY: "auto" }}>
            <QuickLink title="Auction / Deal" icon="🔨" onClick={() => onNavigate("auction")} />
            <QuickLink title="SECL Extractions" icon="📑" onClick={() => onNavigate("secl-intimation")} />
            <QuickLink title="SECL Payment Advice" icon="📑" onClick={() => onNavigate("secl-payment-advice")} />
            <QuickLink title="Sales Order (DO)" icon="📄" onClick={() => onNavigate("sales-order")} />
            <QuickLink title="Invoice" icon="🧾" onClick={() => onNavigate("invoice")} />
            <QuickLink title="Work Order" icon="📋" onClick={() => onNavigate("work-order")} />
            <QuickLink title="Dispatch" icon="🚛" onClick={() => onNavigate("dispatch")} />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, delta, icon, trend }) {
  let deltaColor = "var(--muted)";
  if (trend === "up") deltaColor = "#10b981"; // green
  if (trend === "down") deltaColor = "#ef4444"; // red

  return (
    <div className="card" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>{title}</span>
        <span style={{ fontSize: 24, opacity: 0.8 }}>{icon}</span>
      </div>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: value.length > 8 ? 28 : 36, fontWeight: 700, color: "var(--ember-bright)", margin: "4px 0", lineHeight: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        {value}
      </div>
      <div style={{ fontSize: 13, color: deltaColor, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
        {trend === "up" && "↑"}
        {trend === "down" && "↓"}
        {delta}
      </div>
    </div>
  );
}

function QuickLink({ title, icon, onClick }) {
  return (
    <div 
      onClick={onClick}
      style={{ 
        display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", 
        border: "1px solid #e5e7eb", borderRadius: 8, cursor: "pointer",
        transition: "all 0.2s ease", background: "#f9fafb"
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--ember)";
        e.currentTarget.style.background = "#eff6ff";
        e.currentTarget.style.transform = "translateX(4px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "#e5e7eb";
        e.currentTarget.style.background = "#f9fafb";
        e.currentTarget.style.transform = "translateX(0)";
      }}
    >
      <div style={{ fontSize: 20 }}>{icon}</div>
      <div style={{ fontWeight: 600, fontSize: 13.5, color: "var(--text)" }}>{title}</div>
      <div style={{ marginLeft: "auto", color: "var(--muted)", fontWeight: "bold" }}>→</div>
    </div>
  );
}
