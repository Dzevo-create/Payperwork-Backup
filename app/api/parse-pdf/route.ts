import { NextRequest, NextResponse } from "next/server";
import { PDFExtract } from "pdf.js-extract";
import { apiLogger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Extract text from PDF with structure (like ChatGPT/Claude)
    const pdfExtract = new PDFExtract();
    const data = await pdfExtract.extractBuffer(buffer);

    // Format text with page numbers and structure (ChatGPT-style)
    const pages = data.pages.map((page, index) => {
      const pageNumber = index + 1;
      const pageText = page.content
        .map((item) => item.str)
        .join(" ")
        .trim();

      return {
        pageNumber,
        text: pageText,
      };
    });

    // Create structured text output like ChatGPT
    const structuredText = pages
      .map((page) => `--- Seite ${page.pageNumber} ---\n${page.text}`)
      .join("\n\n");

    // Also provide full text without structure for simple cases
    const fullText = pages.map((page) => page.text).join("\n\n");

    return NextResponse.json({
      text: fullText,
      structuredText,
      pages: data.pages.length,
      pageData: pages,
      metadata: {
        totalPages: data.pages.length,
        fileName: file.name,
      },
    });
  } catch (error) {
    apiLogger.error('PDF parsing error:', error);
    return NextResponse.json(
      { error: "Failed to parse PDF" },
      { status: 500 }
    );
  }
}
