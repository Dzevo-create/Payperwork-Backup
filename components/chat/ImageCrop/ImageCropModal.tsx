"use client";

import { useState, useRef } from "react";
import ReactCrop, { Crop, PixelCrop } from "react-image-crop";
import { chatLogger } from '@/lib/logger';
import "react-image-crop/dist/ReactCrop.css";
import { X, Check, Download } from "lucide-react";

interface ImageCropModalProps {
  isOpen: boolean;
  imageUrl: string;
  onClose: () => void;
  onCropComplete: (croppedImageUrl: string) => void;
}

export default function ImageCropModal({
  isOpen,
  imageUrl,
  onClose,
  onCropComplete,
}: ImageCropModalProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>({
    unit: "%",
    width: 80,
    height: 80,
    x: 10,
    y: 10,
  });
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);

  const createCroppedImage = async () => {
    const image = imgRef.current;

    if (!image || !completedCrop) {
      alert('Bitte bewege den Crop-Bereich, um ihn zu aktivieren');
      return;
    }

    try {
      const croppedImage = await getCroppedImg(image, completedCrop);
      onCropComplete(croppedImage);
      onClose();
    } catch (error) {
      chatLogger.error('Error cropping image:', error);
      alert('Fehler beim Zuschneiden des Bildes');
    }
  };

  const handleDownload = async () => {
    const image = imgRef.current;
    if (!image || !completedCrop) {
      // If no crop selected, download original image
      try {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `image-${Date.now()}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (error) {
        chatLogger.error('Error downloading original image:', error);
        alert('Download fehlgeschlagen. Bitte versuche es erneut.');
      }
      return;
    }

    try {
      const croppedImage = await getCroppedImg(image, completedCrop);
      const link = document.createElement("a");
      link.href = croppedImage;
      link.download = `cropped-image-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      chatLogger.error('Error downloading cropped image:', error);

      // Fallback: Try to download via fetch if canvas.toBlob fails (CORS issue)
      try {
        chatLogger.info('Attempting fallback download via fetch...');
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `image-${Date.now()}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        alert('Hinweis: Original-Bild wurde heruntergeladen (Crop konnte nicht angewendet werden).');
      } catch (fallbackError) {
        chatLogger.error('Fallback download also failed:', fallbackError);
        alert('Download fehlgeschlagen. Bitte versuche es erneut.');
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-6xl h-[90vh] bg-pw-black/95 backdrop-blur-xl border border-pw-accent/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 bg-pw-black/98 border-b border-pw-accent/30 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Bild zuschneiden</h2>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Crop Area - Perfectly centered with safe spacing */}
        <div className="flex-1 flex items-center justify-center bg-black/90 px-8 py-6 min-h-0 overflow-auto">
          <ReactCrop
            crop={crop}
            onChange={(c, percentCrop) => setCrop(percentCrop)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={undefined}
            style={{ maxWidth: '100%', maxHeight: '100%' }}
          >
            <img
              ref={imgRef}
              src={imageUrl}
              alt="Crop me"
              crossOrigin="anonymous"
              style={{
                maxWidth: '100%',
                maxHeight: 'calc(90vh - 200px)',
                width: 'auto',
                height: 'auto',
                display: 'block'
              }}
              onLoad={() => {
                // Ensure crop is set after image loads
                if (imgRef.current) {
                  const { width, height } = imgRef.current;
                  setCompletedCrop({
                    unit: 'px',
                    x: width * 0.1,
                    y: height * 0.1,
                    width: width * 0.8,
                    height: height * 0.8,
                  });
                }
              }}
            />
          </ReactCrop>
        </div>

        {/* Footer - Controls */}
        <div className="flex-shrink-0 bg-pw-black/98 border-t border-pw-accent/30 px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left side - Download Button */}
            <button
              onClick={handleDownload}
              className="px-5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download
            </button>

            {/* Right side - Cancel and Crop Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={createCroppedImage}
                className="px-5 py-2 bg-pw-accent hover:bg-pw-accent-hover text-pw-black font-semibold rounded-xl transition-colors flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                Zuschneiden
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function to create cropped image
async function getCroppedImg(image: HTMLImageElement, crop: PixelCrop): Promise<string> {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("No 2d context");
  }

  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;

  canvas.width = crop.width;
  canvas.height = crop.height;

  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    crop.width,
    crop.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Canvas is empty"));
        return;
      }
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
    }, "image/jpeg", 0.95);
  });
}
