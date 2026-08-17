import { useState } from "react";

const NAV = [
  {
    section: "Main",
    items: [
      { id: "dashboard", icon: "⊞", label: "Dashboard" },
      { id: "payment-advice", icon: "⛃", label: "Payment Advice", badge: "PI" },
      { id: "sales-order", icon: "📄", label: "Sales Order", badge: "DO" },
      { id: "secl-intimation", icon: "📄", label: "SECL Intimation", badge: "SECL" },
    ],
  },
];

export default function Sidebar({ activePage, onNavigate }) {
  const [openSections, setOpenSections] = useState({});

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="brand-icon">⛏</div>
        <div className="brand-text">
          COAL SYSTEM
          <span>Extractor v1.0</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav" aria-label="Main navigation">
        {NAV.map(({ section, items }) => (
          <div key={section}>
            <div className="nav-section-label">{section}</div>
            {items.map((item) => (
              <div
                key={item.id}
                className={`nav-item${activePage === item.id ? " active" : ""}`}
                onClick={() => onNavigate(item.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && onNavigate(item.id)}
                aria-current={activePage === item.id ? "page" : undefined}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
                {item.badge && (
                  <span
                    style={{
                      fontSize: 9,
                      fontFamily: "var(--font-mono)",
                      background: "rgba(232,114,44,0.2)",
                      color: "var(--ember-bright)",
                      padding: "2px 6px",
                      borderRadius: 10,
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </div>
            ))}
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div className="sidebar-footer">
        <div className="user-avatar">U</div>
        <div className="user-info">
          <div className="user-name">User</div>
          <div className="user-role">Operator</div>
        </div>
      </div>
    </aside>
  );
}
