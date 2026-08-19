import React, { useState, useRef } from "react";
import "../App.css";

export default function AuctionPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [items, setItems] = useState([{ id: 1 }]);
  const [pdfFile, setPdfFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleAddItem = () => {
    setItems([...items, { id: items.length + 1 }]);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setPdfFile(e.target.files[0]);
    }
  };

  return (
    <div className="page-content">
      <div className="topbar" style={{ padding: "0 0 20px 0", borderBottom: "none" }}>
        <h2>Auction Management</h2>
        <button className="btn" onClick={() => setIsModalOpen(true)}>
          + Add Form
        </button>
      </div>

      <div className="table-card">
        <div className="table-header">
          <div className="table-title">Auction Data Table</div>
        </div>
        <div className="table-scroll" style={{ overflowX: "auto" }}>
          <table className="stable">
            <thead>
              <tr>
                <th>DEAL ID</th>
                <th>BIDDER</th>
                <th>AUCTION SOURCE</th>
                <th>NOTIFICATION DATE</th>
                <th>BID DATE</th>
                <th>COAL COMPANY</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan="7" style={{ textAlign: "center", padding: "40px", color: "var(--muted)" }}>
                  No auction data available. Click "Add Form" to create a new entry.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="auction-modal-overlay">
          <div className="auction-modal">
            {/* Header */}
            <div className="auction-modal-header">
              <div className="auction-badge">PROCESS ACTION</div>
              <h2 className="auction-modal-title">Auction Notification</h2>
              <button className="auction-close-btn" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>

            {/* Body */}
            <div className="auction-modal-body">
              {/* Top Form Fields */}
              <div className="auction-grid-2">
                <div className="auction-form-group">
                  <label className="auction-label">DEAL ID</label>
                  <input type="text" className="auction-input" placeholder="DEAL-2026-747" />
                </div>
                <div className="auction-form-group">
                  <label className="auction-label">BIDDER</label>
                  <input type="text" className="auction-input" />
                </div>
                
                <div className="auction-form-group">
                  <label className="auction-label">AUCTION SOURCE</label>
                  <input type="text" className="auction-input" />
                </div>
                <div className="auction-form-group">
                  <label className="auction-label">NOTIFICATION DATE <span>*</span></label>
                  <input type="date" className="auction-input" />
                </div>
                
                <div className="auction-form-group">
                  <label className="auction-label">BID DATE <span>*</span></label>
                  <input type="date" className="auction-input" />
                </div>
                <div className="auction-form-group">
                  <label className="auction-label">BID CLOSING DATE <span>*</span></label>
                  <input type="date" className="auction-input" />
                </div>
                
                <div className="auction-form-group">
                  <label className="auction-label">COAL COMPANY <span>*</span></label>
                  <input type="text" className="auction-input" />
                </div>
              </div>

              {/* Mine Details Section */}
              <div className="auction-section-title">MINE DETAILS</div>
              
              {items.map((item, index) => (
                <div key={item.id} className="auction-item-card">
                  <div className="auction-item-badge">ITEM {index + 1}</div>
                  <div className="auction-grid-4">
                    <div className="auction-form-group">
                      <label className="auction-label">MINE <span>*</span></label>
                      <input type="text" className="auction-input" />
                    </div>
                    <div className="auction-form-group">
                      <label className="auction-label">COAL GRADE <span>*</span></label>
                      <input type="text" className="auction-input" />
                    </div>
                    <div className="auction-form-group">
                      <label className="auction-label">QUANTITY OFFERED (MT) <span>*</span></label>
                      <input type="number" className="auction-input" />
                    </div>
                    <div className="auction-form-group">
                      <label className="auction-label">BASE PRICE (₹/MT) <span>*</span></label>
                      <input type="number" className="auction-input" />
                    </div>
                  </div>
                </div>
              ))}

              <button className="auction-add-btn" onClick={handleAddItem}>
                <span>+</span> Add Another
              </button>

              {/* Notification Document Section */}
              <div className="auction-section-title">NOTIFICATION DOCUMENT</div>
              <input 
                type="file" 
                accept=".pdf" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                style={{ display: "none" }} 
              />
              <div className="auction-upload-box" onClick={() => fileInputRef.current?.click()}>
                <span style={{ color: pdfFile ? "var(--text)" : "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {pdfFile ? pdfFile.name : "Click to Upload PDF"}
                </span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
              </div>

              {/* Remarks Section */}
              <div className="auction-section-title">REMARKS</div>
              <textarea className="auction-textarea" placeholder="Enter notes for Remarks..."></textarea>
            </div>

            {/* Footer */}
            <div className="auction-modal-footer">
              <button className="auction-btn-cancel" onClick={() => setIsModalOpen(false)}>Cancel</button>
              <button 
                className="auction-btn-save" 
                onClick={() => {
                  const dataToSave = {
                    dealId: "C1456201",
                    items
                  };
                  localStorage.setItem("auction_data", JSON.stringify(dataToSave));
                  alert("Auction Form Data saved to LocalStorage successfully!");
                  setIsModalOpen(false);
                }}
              >
                Save & Transition
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
