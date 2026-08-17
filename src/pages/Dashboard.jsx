export default function Dashboard({ onNavigate }) {
  return (
    <div style={{ maxWidth: 900, margin: "0 auto", paddingTop: 40 }}>
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 32, margin: "0 0 10px 0", color: "var(--text)" }}>
          Welcome to Coal System
        </h1>
        <p style={{ color: "var(--muted)", fontSize: 15, margin: 0 }}>
          Select a tool below to upload and process your PDF documents.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>
        {/* SECL Intimation Tool */}
        <div 
          className="dash-card" 
          style={{ cursor: "pointer", transition: "transform 0.2s, box-shadow 0.2s", padding: 30 }}
          onClick={() => onNavigate("secl-intimation")}
          onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 12px 24px rgba(0,0,0,0.1)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.05)"; }}
        >
          <div style={{ fontSize: 48, marginBottom: 16 }}>📑</div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 24, margin: "0 0 8px 0", color: "var(--ember-bright)" }}>
            SECL Intimation Extractor
          </h2>
          <p style={{ color: "var(--muted)", fontSize: 14, margin: "0 0 20px 0", lineHeight: 1.5 }}>
            Extract auction details, bidder information, and line items from SECL Intimation PDFs.
          </p>
          <button className="btn" style={{ width: "100%", justifyContent: "center" }}>
            Open Tool →
          </button>
        </div>

        {/* Sales Order Tool */}
        <div 
          className="dash-card" 
          style={{ cursor: "pointer", transition: "transform 0.2s, box-shadow 0.2s", padding: 30 }}
          onClick={() => onNavigate("sales-order")}
          onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 12px 24px rgba(0,0,0,0.1)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.05)"; }}
        >
          <div style={{ fontSize: 48, marginBottom: 16 }}>📄</div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 24, margin: "0 0 8px 0", color: "var(--ember-bright)" }}>
            SECL Sales Order Extractor
          </h2>
          <p style={{ color: "var(--muted)", fontSize: 14, margin: "0 0 20px 0", lineHeight: 1.5 }}>
            Parse line items, mine details, contract validity, and requisite payments from SECL Sales Order PDFs.
          </p>
          <button className="btn" style={{ width: "100%", justifyContent: "center" }}>
            Open Tool →
          </button>
        </div>

        {/* Payment Advice Tool */}
        <div 
          className="dash-card" 
          style={{ cursor: "pointer", transition: "transform 0.2s, box-shadow 0.2s", padding: 30 }}
          onClick={() => onNavigate("payment-advice")}
          onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 12px 24px rgba(0,0,0,0.1)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.05)"; }}
        >
          <div style={{ fontSize: 48, marginBottom: 16 }}>⛃</div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 24, margin: "0 0 8px 0", color: "var(--ember-bright)" }}>
            Payment Advice Reader
          </h2>
          <p style={{ color: "var(--muted)", fontSize: 14, margin: "0 0 20px 0", lineHeight: 1.5 }}>
            Extract receiver details, pricing, totals, and bank transfer information from coal Payment Advice (PI) PDFs.
          </p>
          <button className="btn" style={{ width: "100%", justifyContent: "center" }}>
            Open Tool →
          </button>
        </div>

        {/* Invoice Tool */}
        <div 
          className="dash-card" 
          style={{ cursor: "pointer", transition: "transform 0.2s, box-shadow 0.2s", padding: 30 }}
          onClick={() => onNavigate("invoice")}
          onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 12px 24px rgba(0,0,0,0.1)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.05)"; }}
        >
          <div style={{ fontSize: 48, marginBottom: 16 }}>🧾</div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 24, margin: "0 0 8px 0", color: "var(--ember-bright)" }}>
            Invoice PDF Extractor
          </h2>
          <p style={{ color: "var(--muted)", fontSize: 14, margin: "0 0 20px 0", lineHeight: 1.5 }}>
            Extract supplier, buyer details, e-Way Bill info, and line items from Invoice PDFs.
          </p>
          <button className="btn" style={{ width: "100%", justifyContent: "center" }}>
            Open Tool →
          </button>
        </div>
      </div>

      <div style={{ marginTop: 40, padding: 16, background: "rgba(0, 51, 102, 0.05)", borderRadius: "var(--radius)", border: "1px solid rgba(0, 51, 102, 0.1)", display: "flex", gap: 12, alignItems: "center" }}>
        <div style={{ color: "var(--ember)", fontSize: 20 }}>🔒</div>
        <div style={{ color: "var(--muted)", fontSize: 13, lineHeight: 1.4 }}>
          <strong>100% Private &amp; Secure:</strong> All PDF parsing happens locally in your browser. No files are uploaded to any server. Your data remains strictly on your device.
        </div>
      </div>
    </div>
  );
}
