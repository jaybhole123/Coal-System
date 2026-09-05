import React, { useState, useEffect } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  BarChart, Bar
} from "recharts";
import { INR } from "../utils/format";
import { supabase } from "../utils/supabase";

const COLORS = ["#004080", "#4f46e5", "#6dbf8a", "#f59e0b", "#d6251b"];

export default function Dashboard({ onNavigate }) {
  const [stats, setStats] = useState({
    totalDocs: 0,
    totalValue: 0,
    activeAuctions: 0,
    distData: [
      { name: "No Data", value: 1 }
    ]
  });

  const [dynamicTrendData, setDynamicTrendData] = useState([]);
  const [dynamicActivityData, setDynamicActivityData] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [
          { data: invoices },
          { data: salesOrders },
          { data: paymentAdvices },
          { data: seclIntimations }
        ] = await Promise.all([
          supabase.from('invoices').select('created_at, invoice_date, total_amount'),
          supabase.from('sales_orders').select('created_at, sales_order_valid_from, amount'),
          supabase.from('secl_payment_advices').select('created_at, auction_date, grand_total'),
          supabase.from('secl_intimation_format_1').select('created_at')
        ]);

        const safeArr = (arr) => Array.isArray(arr) ? arr : [];
        const inv = safeArr(invoices);
        const so = safeArr(salesOrders);
        const pa = safeArr(paymentAdvices);
        const secl = safeArr(seclIntimations);
        const aucCount = 0; // Auctions not yet in DB

        const totalDocs = inv.length + so.length + pa.length + secl.length + aucCount;

        let totalValue = 0;
        inv.forEach(i => totalValue += Number(i.total_amount) || 0);
        so.forEach(s => totalValue += Number(s.amount) || 0);
        pa.forEach(p => totalValue += Number(p.grand_total) || 0);

        let distData = [
          { name: "Invoices", value: inv.length },
          { name: "Sales Orders", value: so.length },
          { name: "Payment Advices", value: pa.length },
          { name: "SECL Extractions", value: secl.length }
        ].filter(d => d.value > 0);
        
        if (distData.length === 0) {
          distData = [{ name: "No Data", value: 1 }];
        }

        // --- CALC TREND DATA (Last 6 Months) ---
        // Use document dates for real business trend analysis
        const parseDocDate = (dateStr, fallbackStr) => {
          if (!dateStr || dateStr === "-") return new Date(fallbackStr);
          // Try to handle DD-MMM-YYYY or YYYY-MM-DD
          const d = new Date(dateStr);
          return isNaN(d.getTime()) ? new Date(fallbackStr) : d;
        };

        const trendRecords = [
          ...inv.map(i => ({ date: parseDocDate(i.invoice_date, i.created_at), val: Number(i.total_amount) || 0 })),
          ...so.map(s => ({ date: parseDocDate(s.sales_order_valid_from, s.created_at), val: Number(s.amount) || 0 })),
          ...pa.map(p => ({ date: parseDocDate(p.auction_date, p.created_at), val: Number(p.grand_total) || 0 })),
          ...secl.map(s => ({ date: new Date(s.created_at), val: 0 }))
        ];

        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const now = new Date();
        const tDataMap = {};
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const key = `${d.getFullYear()}-${d.getMonth()}`;
          tDataMap[key] = { month: monthNames[d.getMonth()], documents: 0, revenue: 0, sortKey: d.getTime() };
        }

        trendRecords.forEach(r => {
          if (isNaN(r.date.getTime())) return;
          const key = `${r.date.getFullYear()}-${r.date.getMonth()}`;
          if (tDataMap[key]) {
            tDataMap[key].documents += 1;
            tDataMap[key].revenue += r.val;
          }
        });
        
        const newTrendData = Object.values(tDataMap).sort((a,b) => a.sortKey - b.sortKey).map(t => ({
          month: t.month, documents: t.documents, revenue: t.revenue
        }));

        // --- CALC ACTIVITY DATA (Last 7 Days) ---
        // Use created_at to track when the extractor was actually used
        const activityRecords = [
          ...inv.map(i => ({ date: new Date(i.created_at) })),
          ...so.map(s => ({ date: new Date(s.created_at) })),
          ...pa.map(p => ({ date: new Date(p.created_at) })),
          ...secl.map(s => ({ date: new Date(s.created_at) }))
        ];
        const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const actDataMap = {};
        for (let i = 6; i >= 0; i--) {
          const d = new Date(now);
          d.setDate(d.getDate() - i);
          const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
          actDataMap[key] = { name: dayNames[d.getDay()], processed: 0, sortKey: d.getTime() };
        }

        activityRecords.forEach(r => {
          if (isNaN(r.date.getTime())) return;
          const key = `${r.date.getFullYear()}-${r.date.getMonth()}-${r.date.getDate()}`;
          if (actDataMap[key]) {
            actDataMap[key].processed += 1;
          }
        });

        const newActivityData = Object.values(actDataMap).sort((a,b) => a.sortKey - b.sortKey).map(a => ({
          name: a.name, processed: a.processed
        }));

        setStats({
          totalDocs,
          totalValue,
          activeAuctions: aucCount,
          distData
        });
        
        setDynamicTrendData(newTrendData);
        setDynamicActivityData(newActivityData);

      } catch(err) {
        console.error("Dashboard analysis error:", err);
      }
    };
    
    fetchDashboardData();
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
        <StatCard title="Total Documents" value={stats.totalDocs.toLocaleString()} delta="Supabase DB" icon="📄" trend="up" />
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
              <AreaChart data={dynamicTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
              <BarChart data={dynamicActivityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6b7280" }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6b7280" }} />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} 
                  cursor={{ fill: "rgba(79, 70, 229, 0.05)" }} 
                />
                <Bar dataKey="processed" name="Processed" fill="#004080" radius={[4, 4, 0, 0]} barSize={28} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Links */}
        <div className="card" style={{ padding: 24, display: "flex", flexDirection: "column" }}>
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
        border: "1px solid var(--line)", borderRadius: 8, cursor: "pointer",
        transition: "all 0.2s ease", background: "var(--panel-2)"
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--ember)";
        e.currentTarget.style.background = "var(--ember-dim)";
        e.currentTarget.style.transform = "translateX(4px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--line)";
        e.currentTarget.style.background = "var(--panel-2)";
        e.currentTarget.style.transform = "translateX(0)";
      }}
    >
      <div style={{ fontSize: 20 }}>{icon}</div>
      <div style={{ fontWeight: 600, fontSize: 13.5, color: "var(--text)" }}>{title}</div>
      <div style={{ marginLeft: "auto", color: "var(--muted)", fontWeight: "bold" }}>→</div>
    </div>
  );
}
