const PAGE_META = {
  dashboard: { title: "Dashboard", breadcrumb: "Overview" },
  "payment-advice": { title: "Payment Advice Reader", breadcrumb: "PDF Processing" },
  "sales-order": { title: "Sales Order Extractor", breadcrumb: "PDF Processing" },
  "upload-history": { title: "Upload History", breadcrumb: "PDF Processing" },
  reports: { title: "Reports", breadcrumb: "Analytics" },
  settings: { title: "Settings", breadcrumb: "System" },
};

export default function Topbar({ activePage }) {
  const meta = PAGE_META[activePage] ?? { title: activePage, breadcrumb: "" };

  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="topbar-title">{meta.title}</div>
        {meta.breadcrumb && (
          <div className="topbar-breadcrumb">{meta.breadcrumb}</div>
        )}
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
