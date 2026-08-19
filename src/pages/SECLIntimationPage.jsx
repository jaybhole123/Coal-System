import { useState, useCallback } from "react";
import Dropzone from "../components/Dropzone";
import SECLIntimationResults from "../components/SECLIntimationResults";
import EditModal from "../components/EditModal";
import SECLFormat2Page from "./SECLFormat2Page";
import { extractSECLData, toSECLCSV, COLS } from "../utils/seclParser";
import { downloadBlob } from "../utils/pdfParser";

/**
 * SECLIntimationPage — owns the upload/result state for this page.
 */
export default function SECLIntimationPage({ state, setState }) {
  const [activeTab, setActiveTab] = useState("format1");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { view, loading, loadingName, error, data, fileName } = state;

  const handleManualAdd = (formData) => {
    const newItem = {
      pdfUrl: formData.pdfFile ? URL.createObjectURL(formData.pdfFile) : null,
      pdfName: formData.pdfFile ? formData.pdfFile.name : "Manual Entry",
      meta: {
        "Name of Bidder": formData.bidderName,
        "Date of Auction": formData.auctionDate
      },
      details: {},
      items: [{
        "Seller Name": formData.sellerName,
        "Source Name": formData.sourceName,
        "Grade / Size": formData.gradeSize,
        "Quantity Allotted": formData.qtyAllotted,
        "Winning Bid Price (Rs/MT)": formData.bidPrice
      }]
    };
    setState((s) => ({
      ...s,
      data: s.data && Array.isArray(s.data) ? [...s.data, newItem] : [newItem],
      view: "results",
      fileName: s.fileName || "Manual Entry"
    }));
    setIsModalOpen(false);
  };

  const handleFiles = useCallback(
    async (files) => {
      if (files.length === 0) {
        setState((s) => ({ ...s, error: "Please upload only PDF files." }));
        return;
      }

      setState((s) => ({
        ...s, error: null, loading: true, loadingName: files.length > 1 ? `${files.length} files` : files[0].name,
      }));

      try {
        const results = await Promise.all(
          files.map(async (file) => {
            const data = await extractSECLData(file);
            data.pdfUrl = URL.createObjectURL(file);
            data.pdfName = file.name;
            return data;
          })
        );
        setState((s) => {
          const newData = s.data && Array.isArray(s.data) ? [...s.data, ...results] : results;
          const newFileName = s.fileName ? s.fileName + ", " + (files.length > 1 ? `${files.length} files` : files[0].name) : (files.length > 1 ? `${files.length}_files` : files[0].name);
          return {
            ...s, loading: false, data: newData, fileName: newFileName, view: "results",
          };
        });
      } catch (err) {
        console.error(err);
        setState((s) => ({
          ...s,
          loading: false,
          error:
            "Failed to read PDF. (" +
            (err?.message ?? "unknown error") +
            ")",
        }));
      }
    },
    [setState]
  );

  const handleReset = () =>
    setState((s) => ({ ...s, view: "drop", loading: false, loadingName: "", error: null }));

  const handleExportJson = () => {
    if (!data) return;
    downloadBlob(JSON.stringify(data, null, 2), fileName.replace(/\.pdf$/i, "") + "_secl.json", "application/json");
  };

  const handleSave = () => {
    if (!data) return;
    localStorage.setItem("secl_data", JSON.stringify(data));
    alert("Data saved to LocalStorage successfully!");
  };

  const handleExportCsv = () => {
    if (!data) return;
    const allItems = data.flatMap((d, index) => d.items.map(item => ({ pdfIndex: index + 1, ...d.details, ...item })));
    downloadBlob(toSECLCSV(COLS, allItems), fileName.replace(/\.pdf$/i, "") + "_secl.csv", "text/csv");
  };

  const handleDeleteRow = (index) => {
    setState((s) => {
      const newData = [...s.data];
      let currentIndex = 0;
      for (let i = 0; i < newData.length; i++) {
        const itemsCount = newData[i].items ? newData[i].items.length : 0;
        if (index >= currentIndex && index < currentIndex + itemsCount) {
          const itemIndex = index - currentIndex;
          const newItems = [...newData[i].items];
          newItems.splice(itemIndex, 1);
          newData[i] = { ...newData[i], items: newItems };
          break;
        }
        currentIndex += itemsCount;
      }
      // Check if all items across all PDFs are empty
      const hasAnyItems = newData.some(d => d.items && d.items.length > 0);
      if (!hasAnyItems) {
        return { ...s, view: "drop", data: null, fileName: "" };
      }
      return { ...s, data: newData };
    });
  };

  const handleUpdateRow = (index, updatedRow) => {
    setState((s) => {
      const newData = [...s.data];
      let currentIndex = 0;
      for (let i = 0; i < newData.length; i++) {
        const itemsCount = newData[i].items ? newData[i].items.length : 0;
        if (index >= currentIndex && index < currentIndex + itemsCount) {
          const itemIndex = index - currentIndex;
          const newItems = [...newData[i].items];
          newItems[itemIndex] = updatedRow;
          newData[i] = { ...newData[i], items: newItems };
          break;
        }
        currentIndex += itemsCount;
      }
      return { ...s, data: newData };
    });
  };

  return (
    <div>
      <div style={{ padding: "0 0 20px 0", borderBottom: "1px solid var(--border)", marginBottom: 20 }}>
        <h2 style={{ margin: "0 0 16px 0", fontFamily: "var(--font-display)", fontSize: 24 }}>SECL Extractions</h2>
        <div style={{ display: "flex", gap: "10px" }}>
          <button 
            className={`btn ${activeTab === 'format1' ? '' : 'outline'}`} 
            onClick={() => setActiveTab('format1')}
          >
            Format 1 (Intimation)
          </button>
          <button 
            className={`btn ${activeTab === 'format2' ? '' : 'outline'}`} 
            onClick={() => setActiveTab('format2')}
          >
            Format 2 (Allocation)
          </button>
        </div>
      </div>

      {activeTab === 'format1' && (
        <div>
          {view === "drop" && (
        <>
          <Dropzone
            onFiles={handleFiles}
            loading={loading}
            loadingName={loadingName}
            error={error}
            title="Upload SECL PDF"
            icon="📄"
          />
          <div style={{ textAlign: "center", marginTop: 20 }}>
            <span style={{ color: "var(--muted)", marginRight: 15, fontSize: "14px" }}>Or enter data manually</span>
            <button className="btn outline" onClick={() => setIsModalOpen(true)}>+ Add Form</button>
          </div>
          <div className="summary-section" style={{ marginTop: 40, opacity: 0.6, pointerEvents: "none" }}>
            <div className="summary-header">
              <div className="summary-title">Data Preview (Upload PDF to populate)</div>
            </div>
            <div className="summary-table-wrap">
              <table className="stable">
                <thead>
                  <tr>
                    <th>Name of Bidder</th>
                    <th>Date of Auction</th>
                    <th>Seller Name</th>
                    <th>Source Name</th>
                    <th>Grade / Size</th>
                    <th>Quantity Allotted</th>
                    <th>Winning Bid Price Rs/MT</th>
                    <th>Preview</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan="9" style={{ textAlign: "center", padding: "40px", color: "var(--muted)" }}>
                      Upload a PDF to view extracted data
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
      {view === "results" && data && (
        <SECLIntimationResults
          data={data}
          fileName={fileName}
          onReset={handleReset}
          onAddFiles={handleFiles}
          onExportJson={handleExportJson}
          onExportCsv={handleExportCsv}
          onSave={handleSave}
          onDeleteRow={handleDeleteRow}
          onUpdateRow={handleUpdateRow}
          onAddManual={() => setIsModalOpen(true)}
        />
      )}
        </div>
      )}

      {activeTab === 'format2' && (
        <SECLFormat2Page />
      )}

      {activeTab === 'format1' && (
        <EditModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleManualAdd}
          title="Add Manual Entry"
          initialData={{}}
          columns={[
            { key: "bidderName", label: "Name of Bidder" },
            { key: "auctionDate", label: "Date of Auction (YYYY-MM-DD)" },
            { key: "sellerName", label: "Seller Name" },
            { key: "sourceName", label: "Source Name" },
            { key: "gradeSize", label: "Grade / Size" },
            { key: "qtyAllotted", label: "Quantity Allotted" },
            { key: "bidPrice", label: "Winning Bid Price Rs/MT" }
          ]}
        />
      )}
    </div>
  );
}
