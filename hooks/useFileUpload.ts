import { useState, useRef, useEffect } from "react";
import { compressAndConvertToBase64 } from "@/lib/imageCompression";
import { useToast } from "@/hooks/useToast";
import { logger } from '@/lib/logger';
import type { Attachment } from '@/types/chat';

export function useFileUpload() {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const toast = useToast();

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const processFile = async (file: File) => {
    // Create new abort controller for this upload
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    // Upload file
    const formData = new FormData();
    formData.append("file", file);

    const uploadResponse = await fetch("/api/upload", {
      method: "POST",
      body: formData,
      signal,
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
        signal,
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
      if (error instanceof Error && error.name === 'AbortError') {
        logger.debug('File upload aborted');
        return;
      }
      logger.error('File upload error:', error);
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
      if (error instanceof Error && error.name === 'AbortError') {
        logger.debug('File drop upload aborted');
        return;
      }
      logger.error('File upload error:', error);
      toast.error("Datei-Upload fehlgeschlagen. Bitte erneut versuchen.");
    } finally {
      setIsUploading(false);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const updateAttachment = (index: number, updatedData: Partial<Attachment>) => {
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
