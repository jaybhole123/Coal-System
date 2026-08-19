import { useState, useEffect } from "react";

export default function EditModal({ isOpen, onClose, onSave, title = "Edit Record", columns, initialData }) {
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    onSave(formData);
  };

  return (
    <div className="modal-overlay" style={styles.overlay}>
      <div className="modal-content" style={styles.content}>
        <div style={styles.header}>
          <h2 style={styles.title}>{title}</h2>
          <button style={styles.closeBtn} onClick={onClose}>&times;</button>
        </div>
        
        <div style={styles.body}>
          <div style={styles.grid}>
            {columns.map((col) => {
              const fieldKey = col.key || col.label;
              return (
                <div key={fieldKey} style={styles.formGroup}>
                  <label style={styles.label}>{col.label}</label>
                  <input
                    type="text"
                    value={formData[fieldKey] || ""}
                    onChange={(e) => handleChange(fieldKey, e.target.value)}
                    style={styles.input}
                  />
                </div>
              );
            })}
            <div style={{ ...styles.formGroup, gridColumn: "1 / -1", marginTop: "10px" }}>
              <label style={styles.label}>ATTACH PDF (OPTIONAL)</label>
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    handleChange("pdfFile", file);
                  }
                }}
                style={{ ...styles.input, padding: "8px", background: "var(--bg)" }}
              />
              {formData.pdfUrl && !formData.pdfFile && (
                <div style={{ fontSize: "12px", color: "var(--primary)", marginTop: "4px" }}>
                  A PDF is already attached. Upload a new one to replace it.
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={styles.footer}>
          <button className="btn ghost" onClick={onClose} style={{ marginRight: 8 }}>Cancel</button>
          <button className="btn" onClick={handleSave}>Save Changes</button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0, 20, 40, 0.5)",
    display: "flex", justifyContent: "center", alignItems: "center",
    zIndex: 1000, backdropFilter: "blur(3px)"
  },
  content: {
    backgroundColor: "var(--bg)",
    borderRadius: "8px", width: "90%", maxWidth: "800px",
    maxHeight: "90vh", display: "flex", flexDirection: "column",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.3)",
    border: "1px solid var(--line)"
  },
  header: {
    padding: "20px 24px", borderBottom: "1px solid var(--line)",
    display: "flex", justifyContent: "space-between", alignItems: "center",
    backgroundColor: "var(--panel)",
    borderTopLeftRadius: "8px", borderTopRightRadius: "8px"
  },
  title: { 
    margin: 0, fontSize: "16px", color: "var(--ember-bright)", 
    fontFamily: "var(--font-display)", textTransform: "uppercase",
    letterSpacing: "0.05em", fontWeight: "700"
  },
  closeBtn: {
    background: "none", border: "none", fontSize: "24px", cursor: "pointer",
    color: "var(--muted)", padding: 0, lineHeight: 1, transition: "color 0.2s"
  },
  body: {
    padding: "24px", overflowY: "auto", flex: 1,
    background: "var(--bg)"
  },
  grid: {
    display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px"
  },
  formGroup: { display: "flex", flexDirection: "column", gap: "6px" },
  label: { 
    fontSize: "12px", fontWeight: "600", color: "var(--muted)",
    textTransform: "uppercase", letterSpacing: "0.04em",
    fontFamily: "var(--font-body)"
  },
  input: {
    padding: "10px 12px", borderRadius: "4px", border: "1px solid var(--line)",
    fontSize: "14px", color: "var(--text)", outline: "none", background: "var(--bg)",
    fontFamily: "var(--font-mono)",
    transition: "border-color 0.2s, box-shadow 0.2s"
  },
  footer: {
    padding: "16px 24px", borderTop: "1px solid var(--line)",
    display: "flex", justifyContent: "flex-end", backgroundColor: "var(--panel)",
    borderBottomLeftRadius: "8px", borderBottomRightRadius: "8px"
  }
};
