import { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/useToast";
import { logger } from '@/lib/logger';

export function useVoiceRecording() {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const toast = useToast();

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Stop recording and release media stream if still active
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
      }
    };
  }, [isRecording]);

  const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
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
      return data.text;
    } catch (error) {
      logger.error('Transcription error:', error);
      toast.error("Transkription fehlgeschlagen. Bitte erneut versuchen.");
      return "";
    } finally {
      setIsTranscribing(false);
    }
  };

  const startRecording = async (): Promise<void> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
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
        const text = await transcribeAudio(audioBlob);

        // Stop all tracks to release microphone
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((track) => track.stop());
          mediaStreamRef.current = null;
        }

        // Return transcribed text via callback
        if (text && onTranscriptionComplete) {
          onTranscriptionComplete(text);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      logger.error('Error accessing microphone:', error);
      toast.error("Mikrofon-Zugriff fehlgeschlagen. Bitte Berechtigung erteilen.");
    }
  };

  const stopRecording = (): void => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      // MediaStream cleanup happens in onstop handler
    }
  };

  const toggleRecording = (): void => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // Callback for transcription complete
  let onTranscriptionComplete: ((text: string) => void) | null = null;

  const setOnTranscriptionComplete = (callback: (text: string) => void) => {
    onTranscriptionComplete = callback;
  };

  return {
    isRecording,
    isTranscribing,
    startRecording,
    stopRecording,
    toggleRecording,
    setOnTranscriptionComplete,
  };
}
