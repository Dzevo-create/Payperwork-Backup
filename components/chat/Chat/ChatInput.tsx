"use client";

import { useState, useRef } from "react";
import { Paperclip, Mic, Send, Square, Loader2, X, FileText, Image as ImageIcon } from "lucide-react";

interface ChatInputProps {
  onSendMessage?: (message: string, attachments?: any[]) => void;
  isGenerating?: boolean;
  onStopGeneration?: () => void;
}

export function ChatInput({ onSendMessage, isGenerating, onStopGeneration }: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const handleSend = () => {
    if (message.trim() || attachments.length > 0) {
      onSendMessage?.(message, attachments);
      setMessage("");
      setAttachments([]);
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    // Auto-resize textarea
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 200) + "px";
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        await transcribeAudio(audioBlob);

        // Stop all tracks to release microphone
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Mikrofon-Zugriff fehlgeschlagen. Bitte Berechtigung erteilen.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    setIsTranscribing(true);

    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");

      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Transcription failed");
      }

      const data = await response.json();
      setMessage(data.text);

      // Focus textarea and auto-resize
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + "px";
      }
    } catch (error) {
      console.error("Transcription error:", error);
      alert("Transkription fehlgeschlagen. Bitte erneut versuchen.");
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleMicClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);

    try {
      for (const file of Array.from(files)) {
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

        // If image, convert to base64 for OpenAI Vision API
        if (uploadData.type === "image") {
          const reader = new FileReader();
          const base64Promise = new Promise<string>((resolve) => {
            reader.onloadend = () => {
              resolve(reader.result as string);
            };
            reader.readAsDataURL(file);
          });
          uploadData.base64 = await base64Promise;
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

        setAttachments((prev) => [...prev, uploadData]);
      }
    } catch (error) {
      console.error("File upload error:", error);
      alert("Datei-Upload fehlgeschlagen. Bitte erneut versuchen.");
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="p-4 bg-transparent">
      <div className="max-w-3xl mx-auto">
        {/* Transcribing Indicator */}
        {isTranscribing && (
          <div className="mb-2 flex items-center gap-2 text-sm text-pw-black/60">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Wird transkribiert...</span>
          </div>
        )}

        {/* Uploading Indicator */}
        {isUploading && (
          <div className="mb-2 flex items-center gap-2 text-sm text-pw-black/60">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Datei wird verarbeitet...</span>
          </div>
        )}

        <div className="flex flex-col gap-2 px-3 py-2 bg-gradient-to-br from-white/80 to-white/70 backdrop-blur-lg border border-pw-black/10 rounded-2xl shadow-lg transition-all focus-within:ring-2 focus-within:ring-pw-accent/50">
          {/* Main Input Row */}
          <div className="flex items-end gap-2">
          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Attach Button */}
          <button
            onClick={handleFileClick}
            disabled={isUploading}
            className="flex-shrink-0 p-1.5 hover:bg-pw-black/5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Attach file"
          >
            <Paperclip className="w-4 h-4 text-pw-black/60" />
          </button>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Nachricht eingeben..."
            className="flex-1 bg-transparent text-sm text-pw-black placeholder:text-pw-black/40 resize-none outline-none min-h-[20px] max-h-[150px] py-1.5"
            rows={1}
          />

          {/* Mic Button */}
          <button
            onClick={handleMicClick}
            disabled={isTranscribing}
            className={`flex-shrink-0 p-1.5 rounded-lg transition-all ${
              isRecording
                ? "bg-red-500 hover:bg-red-600 animate-pulse"
                : isTranscribing
                ? "bg-pw-black/10 cursor-wait"
                : "hover:bg-pw-black/5"
            }`}
            aria-label={isRecording ? "Aufnahme stoppen" : "Spracheingabe"}
          >
            {isRecording ? (
              <Square className="w-4 h-4 text-white" />
            ) : (
              <Mic className={`w-4 h-4 ${isTranscribing ? "text-pw-black/40" : "text-pw-black/60"}`} />
            )}
          </button>

          {/* Send/Stop Button */}
          {isGenerating ? (
            <button
              onClick={onStopGeneration}
              className="flex-shrink-0 p-2 bg-red-500 hover:bg-red-600 rounded-lg transition-all hover:scale-105"
              aria-label="Stop generation"
            >
              <Square className="w-4 h-4 text-white fill-white" />
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!message.trim() && attachments.length === 0}
              className="flex-shrink-0 p-2 bg-pw-accent hover:bg-pw-accent/90 disabled:bg-pw-black/10 disabled:cursor-not-allowed rounded-lg transition-all hover:scale-105 disabled:hover:scale-100"
              aria-label="Send message"
            >
              <Send className="w-4 h-4 text-pw-black" />
            </button>
          )}
          </div>

          {/* Attachments Thumbnails - Below Text Input */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2 border-t border-pw-black/5">
              {attachments.map((att, index) => (
                <div
                  key={index}
                  className="relative group"
                >
                  {att.type === "image" ? (
                    // Image Thumbnail
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-pw-black/10">
                      <img
                        src={att.url}
                        alt={att.name}
                        className="w-full h-full object-cover"
                      />
                      {/* X Button - Top Right */}
                      <button
                        onClick={() => removeAttachment(index)}
                        className="absolute top-0.5 right-0.5 p-0.5 bg-red-500 hover:bg-red-600 rounded-full transition-colors shadow-sm"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  ) : (
                    // PDF Thumbnail
                    <div className="relative w-16 h-16 rounded-lg border border-pw-black/10 bg-pw-black/5 flex flex-col items-center justify-center">
                      <FileText className="w-6 h-6 text-pw-black/60" />
                      <span className="text-[8px] text-pw-black/50 mt-0.5">PDF</span>
                      {/* X Button - Top Right */}
                      <button
                        onClick={() => removeAttachment(index)}
                        className="absolute top-0.5 right-0.5 p-0.5 bg-red-500 hover:bg-red-600 rounded-full transition-colors shadow-sm"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
