// src/services/pptExport.ts

export type ExportOptions = {
  companyName?: string;
  logoUrl?: string;
  primaryColor?: string;
  accentColor?: string;
  requestName?: string;
  templateName?: string;
};

const defaultOptions: Required<ExportOptions> = {
  companyName: "C5i",
  logoUrl: "",
  primaryColor: "0D1B2A",
  accentColor: "4FA8D5",
  requestName: "Executive report",
  templateName: "Uploaded template",
};

export async function exportReportToPpt(
  reportData: any, 
  options?: ExportOptions
) {
  const opts = { ...defaultOptions, ...options };

  try {
    const response = await fetch("http://localhost:8000/api/generate-ppt", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(reportData),
    });

    // IMPROVED ERROR CAPTURE: Read exactly what Python is complaining about
    if (!response.ok) {
      const errorDetail = await response.text();
      throw new Error(`Backend Error ${response.status}: ${errorDetail}`);
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    
const dateStr = new Date().toISOString().replace(/[:.]/g, "-").split("T").join("_").slice(0, 16);
    link.download = `C5i_NA_Report_${dateStr}.pptx`;
    
    document.body.appendChild(link);
    link.click();
    
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
    
  } catch (error) {
    console.error("Error exporting to PPT via Backend:", error);
    // This will pop up an alert showing the exact Python validation error
    alert(error instanceof Error ? error.message : "Failed to connect to backend.");
    throw error;
  }
}