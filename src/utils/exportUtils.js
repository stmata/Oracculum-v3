export const exportDataAs = (format, data) => {
  switch (format.toLowerCase()) {
    case "json":
      downloadFile(JSON.stringify(data, null, 2), "export.json", "application/json");
      break;
    case "csv":
      exportAsCSV(data);
      break;
    case "xls":
      exportAsExcel(data);
      break;
    case "pdf":
      console.warn("PDF export not implemented yet");
      break;
    default:
      console.warn("Unsupported format:", format);
  }
};

const downloadFile = (content, filename, type) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const exportAsCSV = (data) => {
  if (!Array.isArray(data) || data.length === 0) return;
  const keys = Object.keys(data[0]);
  const csvRows = [
    keys.join(","),
    ...data.map((row) => keys.map((key) => JSON.stringify(row[key] ?? "")).join(",")),
  ];
  downloadFile(csvRows.join("\n"), "export.csv", "text/csv");
};

const exportAsExcel = (data) => {
  import("xlsx").then((xlsx) => {
    const worksheet = xlsx.utils.json_to_sheet(data);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    const excelBuffer = xlsx.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "export.xlsx";
    a.click();
    URL.revokeObjectURL(url);
  });
};
