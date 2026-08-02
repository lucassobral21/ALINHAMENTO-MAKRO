export async function exportReportPdf(root: HTMLElement, filename: string): Promise<void> {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);

  const blocks = Array.from(root.querySelectorAll<HTMLElement>("[data-pdf-block]"));
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 10;
  const usableWidth = pageWidth - margin * 2;
  const usableHeight = pageHeight - margin * 2;

  let cursorY = margin;
  let isFirst = true;

  for (const block of blocks) {
    const canvas = await html2canvas(block, {
      scale: 2,
      backgroundColor: "#ffffff",
      useCORS: true,
    });

    let drawWidth = usableWidth;
    let drawHeight = (canvas.height * drawWidth) / canvas.width;

    if (drawHeight > usableHeight) {
      drawHeight = usableHeight;
      drawWidth = (canvas.width * drawHeight) / canvas.height;
    }

    if (!isFirst && cursorY + drawHeight > pageHeight - margin) {
      pdf.addPage();
      cursorY = margin;
    }
    isFirst = false;

    const imgData = canvas.toDataURL("image/png");
    pdf.addImage(imgData, "PNG", margin, cursorY, drawWidth, drawHeight);
    cursorY += drawHeight + 6;
  }

  pdf.save(filename);
}
