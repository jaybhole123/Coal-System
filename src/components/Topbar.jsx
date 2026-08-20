const PAGE_META = {
  dashboard: { title: "Dashboard", breadcrumb: "Overview" },
  "payment-advice": { title: "Payment Advice Reader", breadcrumb: "PDF Processing" },
  "sales-order": { title: "Sales Order Extractor", breadcrumb: "PDF Processing" },
  invoice: { title: "Invoice PDF Extractor", breadcrumb: "PDF Processing" },
  "upload-history": { title: "Upload History", breadcrumb: "PDF Processing" },
  reports: { title: "Reports", breadcrumb: "Analytics" },
  settings: { title: "Settings", breadcrumb: "System" },
};

export default function Topbar({ activePage, onMenuClick }) {
  const meta = PAGE_META[activePage] ?? { title: activePage, breadcrumb: "" };

  return (
    <header className="topbar">
      <div className="topbar-left" style={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
        <button className="burger-btn" onClick={onMenuClick} aria-label="Menu" style={{ marginRight: "12px", background: "none", border: "none", cursor: "pointer", display: "none" }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
        <div>
          <div className="topbar-title">{meta.title}</div>
          {meta.breadcrumb && (
            <div className="topbar-breadcrumb">{meta.breadcrumb}</div>
          )}
        </div>
      </div>
      <div className="topbar-right">
        <span className="topbar-badge">⛏ Coal ERP</span>
        <button className="notif-btn" aria-label="Notifications" title="Notifications">
          🔔
        </button>
      </div>
    </header>
  );
}
