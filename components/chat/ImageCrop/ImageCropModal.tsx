"use client";

import { useState, useRef } from "react";
import ReactCrop, { Crop, PixelCrop } from "react-image-crop";
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
    width: 50,
    height: 50,
    x: 25,
    y: 25,
  });
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);

  const createCroppedImage = async () => {
    const image = imgRef.current;
    if (!image || !completedCrop) return;

    try {
      const croppedImage = await getCroppedImg(image, completedCrop);
      onCropComplete(croppedImage);
      onClose();
    } catch (error) {
      console.error("Error cropping image:", error);
    }
  };

  const handleDownload = async () => {
    const image = imgRef.current;
    if (!image || !completedCrop) {
      // If no crop selected, download original image
      const link = document.createElement("a");
      link.href = imageUrl;
      link.download = `image-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
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
      console.error("Error downloading image:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-5xl h-[85vh] bg-pw-black/95 backdrop-blur-xl border border-pw-accent/30 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 bg-pw-black/98 border-b border-pw-accent/30 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Bild zuschneiden</h2>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Crop Area */}
        <div className="absolute inset-0 mt-[73px] mb-[73px] flex items-center justify-center overflow-auto bg-black/90 p-4">
          <ReactCrop
            crop={crop}
            onChange={(c) => setCrop(c)}
            onComplete={(c) => setCompletedCrop(c)}
            className="max-w-full max-h-full"
          >
            <img
              ref={imgRef}
              src={imageUrl}
              alt="Crop me"
              className="max-w-full max-h-full object-contain"
              style={{ maxHeight: "calc(85vh - 146px)" }}
            />
          </ReactCrop>
        </div>

        {/* Footer - Controls */}
        <div className="absolute bottom-0 left-0 right-0 z-10 bg-pw-black/98 border-t border-pw-accent/30 px-6 py-4">
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
