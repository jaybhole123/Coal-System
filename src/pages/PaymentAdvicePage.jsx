import { useCallback } from "react";
import Dropzone from "../components/Dropzone";
import Results from "../components/Results";
import { extractRows, parsePaymentAdvice, toCSV, downloadBlob } from "../utils/pdfParser";

/**
 * PaymentAdvicePage — owns the upload/result state for this page.
 * Props: state & setState passed from App so navigating away and back preserves data.
 */
export default function PaymentAdvicePage({ state, setState }) {
  const { view, loading, loadingName, error, data, fileName } = state;

  const handleFiles = useCallback(
    async (files) => {
      if (files.length === 0) {
        setState((s) => ({ ...s, error: "Sirf PDF file upload karein." }));
        return;
      }

      setState((s) => ({
        ...s, error: null, loading: true, loadingName: files.length > 1 ? `${files.length} files` : files[0].name,
      }));

      try {
        const results = await Promise.all(
          files.map(async (file) => {
            const rows = await extractRows(file);
            return parsePaymentAdvice(rows);
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
            "PDF read nahi ho payi. File corrupt, password-protected, ya format alag hai. (" +
            (err?.message ?? "unknown error") +
            ")",
        }));
      }
    },
    [setState]
  );

  const handleReset = () =>
    setState({ view: "drop", loading: false, loadingName: "", error: null, data: null, fileName: "" });

  const handleExportJson = () => {
    if (!data) return;
    downloadBlob(JSON.stringify(data, null, 2), fileName.replace(/\.pdf$/i, "") + ".json", "application/json");
  };

  const handleExportCsv = () => {
    if (!data) return;
    downloadBlob(toCSV(data), fileName.replace(/\.pdf$/i, "") + ".csv", "text/csv");
  };

  return (
    <div>
      {view === "drop" && (
        <Dropzone
          onFiles={handleFiles}
          loading={loading}
          loadingName={loadingName}
          error={error}
          title="Upload Payment Advice PDF"
          icon="⛃"
        />
      )}
      {view === "results" && data && (
        <Results
          data={data}
          fileName={fileName}
          onReset={handleReset}
          onAddFiles={handleFiles}
          onExportJson={handleExportJson}
          onExportCsv={handleExportCsv}
        />
      )}
    </div>
  );
}
