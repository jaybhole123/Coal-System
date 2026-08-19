import React from "react";

export default function RefundLapsePage() {
  return (
    <div className="page-content">
      <div className="topbar" style={{ padding: "0 0 20px 0", borderBottom: "none" }}>
        <h2>Refund / Lapse</h2>
      </div>
      <div className="placeholder-page">
        <svg className="placeholder-icon" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="1 4 1 10 7 10"></polyline>
          <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
        </svg>
        <div className="placeholder-title">Refund & Lapse Processing</div>
        <div className="placeholder-sub">
          This section is currently under development. Refund calculations and lapse details will appear here.
        </div>
      </div>
    </div>
  );
}
