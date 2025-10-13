import { useState, useRef } from "react";
import { compressAndConvertToBase64 } from "@/lib/imageCompression";
import { useToast } from "@/hooks/useToast";

export function useFileUpload() {
  const [attachments, setAttachments] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const processFile = async (file: File) => {
    // Upload file
    const formData = new FormData();
    formData.append("file", file);

    const uploadResponse = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!uploadResponse.ok) {
      throw new Error("Upload failed");
    }

    const uploadData = await uploadResponse.json();

    // If image, compress and convert to base64 for OpenAI Vision API
    if (uploadData.type === "image") {
      uploadData.base64 = await compressAndConvertToBase64(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
      });
      // Store original image URL for re-cropping
      uploadData.originalUrl = uploadData.url;
      uploadData.originalBase64 = uploadData.base64;
    }

    // If PDF, parse it to extract text (ChatGPT/Claude-style)
    if (uploadData.type === "pdf") {
      const pdfFormData = new FormData();
      pdfFormData.append("file", file);

      const parseResponse = await fetch("/api/parse-pdf", {
        method: "POST",
        body: pdfFormData,
      });

      if (parseResponse.ok) {
        const pdfData = await parseResponse.json();
        // Store all PDF data like ChatGPT
        uploadData.pdfText = pdfData.text;
        uploadData.structuredText = pdfData.structuredText;
        uploadData.pages = pdfData.pages;
        uploadData.pageData = pdfData.pageData;
        uploadData.metadata = pdfData.metadata;
      }
    }

    return uploadData;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);

    try {
      for (const file of Array.from(files)) {
        const uploadData = await processFile(file);
        setAttachments((prev) => [...prev, uploadData]);
      }
    } catch (error) {
      console.error("File upload error:", error);
      toast.error("Datei-Upload fehlgeschlagen. Bitte erneut versuchen.");
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDrop = async (files: File[]) => {
    if (files.length === 0) return;

    setIsUploading(true);

    try {
      for (const file of files) {
        const uploadData = await processFile(file);
        setAttachments((prev) => [...prev, uploadData]);
      }
    } catch (error) {
      console.error("File upload error:", error);
      toast.error("Datei-Upload fehlgeschlagen. Bitte erneut versuchen.");
    } finally {
      setIsUploading(false);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const updateAttachment = (index: number, updatedData: any) => {
    setAttachments((prev) =>
      prev.map((att, i) => (i === index ? { ...att, ...updatedData } : att))
    );
  };

  const clearAttachments = () => {
    setAttachments([]);
  };

  return {
    attachments,
    isUploading,
    fileInputRef,
    handleFileClick,
    handleFileChange,
    handleDrop,
    removeAttachment,
    updateAttachment,
    clearAttachments,
  };
}
