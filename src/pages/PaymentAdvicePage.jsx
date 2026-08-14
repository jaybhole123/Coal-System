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

  const handleFile = useCallback(
    async (file) => {
      if (
        file.type !== "application/pdf" &&
        !file.name.toLowerCase().endsWith(".pdf")
      ) {
        setState((s) => ({ ...s, error: "Sirf PDF file upload karein." }));
        return;
      }

      setState((s) => ({
        ...s, error: null, loading: true, loadingName: file.name,
      }));

      try {
        const rows = await extractRows(file);
        const parsed = parsePaymentAdvice(rows);
        setState((s) => ({
          ...s, loading: false, data: parsed, fileName: file.name, view: "results",
        }));
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
          onFile={handleFile}
          loading={loading}
          loadingName={loadingName}
          error={error}
        />
      )}
      {view === "results" && data && (
        <Results
          data={data}
          fileName={fileName}
          onReset={handleReset}
          onExportJson={handleExportJson}
          onExportCsv={handleExportCsv}
        />
      )}
    </div>
  );
}
