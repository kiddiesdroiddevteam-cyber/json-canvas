import * as pdfjsLib from "pdfjs-dist";
import type { TextItem, TextMarkedContent } from "pdfjs-dist/types/src/display/api";

// Configure worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

function isTextItem(item: TextItem | TextMarkedContent): item is TextItem {
  return "str" in item;
}

interface ContentEntry {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  font: string;
}

interface PageData {
  page: number;
  width: number;
  height: number;
  content: ContentEntry[];
  paragraphs: string[];
}

export interface PdfJsonOutput {
  metadata: {
    filename: string;
    totalPages: number;
    convertedAt: string;
  };
  pages: PageData[];
}

export async function pdfToJson(file: File): Promise<PdfJsonOutput> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const totalPages = pdf.numPages;

  const pages: PageData[] = [];

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1 });
    const textContent = await page.getTextContent();

    const textItems = textContent.items.filter(isTextItem);

    const contentItems: ContentEntry[] = textItems
      .filter((item) => item.str.trim().length > 0)
      .map((item) => ({
        text: item.str,
        x: Math.round(item.transform[4] * 100) / 100,
        y: Math.round((viewport.height - item.transform[5]) * 100) / 100,
        width: Math.round(item.width * 100) / 100,
        height: Math.round(item.height * 100) / 100,
        font: item.fontName,
      }));

    // Build lines by grouping text items by y proximity
    const lines: string[] = [];
    let currentLine = "";
    let lastY = -1;

    textItems.forEach((item) => {
      const y = Math.round(item.transform[5]);
      if (lastY !== -1 && Math.abs(y - lastY) > 5) {
        if (currentLine.trim()) lines.push(currentLine.trim());
        currentLine = item.str;
      } else {
        currentLine += item.str;
      }
      lastY = y;
    });
    if (currentLine.trim()) lines.push(currentLine.trim());

    // Group lines into paragraphs
    const paragraphs: string[] = [];
    let para = "";
    lines.forEach((line) => {
      if (line === "") {
        if (para.trim()) { paragraphs.push(para.trim()); para = ""; }
      } else {
        para += (para ? " " : "") + line;
      }
    });
    if (para.trim()) paragraphs.push(para.trim());

    pages.push({
      page: pageNum,
      width: Math.round(viewport.width),
      height: Math.round(viewport.height),
      content: contentItems,
      paragraphs,
    });
  }

  return {
    metadata: {
      filename: file.name,
      totalPages,
      convertedAt: new Date().toISOString(),
    },
    pages,
  };
}
