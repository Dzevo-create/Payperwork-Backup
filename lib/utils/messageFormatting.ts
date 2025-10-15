import { Attachment } from "@/types/chat";

/**
 * Format timestamp for message display
 * @param timestamp - Date object to format
 * @returns Formatted time string in HH:MM format (German locale)
 */
export function formatMessageTimestamp(timestamp: Date): string {
  return new Date(timestamp || Date.now()).toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Configuration for image grid layout
 */
export interface GridLayoutConfig {
  containerClass: string;
  imageClass: string;
  customLayout?: '2+1'; // Special layout: 2 images in first row, rest below
}

/**
 * Calculate optimal grid layout for image attachments based on count, aspect ratio, and message role
 * @param numImages - Number of images to display
 * @param aspectRatio - Aspect ratio of images (e.g., "1:1", "16:9", "9:16", "4:3", "3:2", "21:9")
 * @param isUserMessage - Whether this is a user message (affects max-width)
 * @returns Grid layout configuration with CSS classes
 */
export function getImageGridLayout(
  numImages: number,
  aspectRatio: string,
  isUserMessage: boolean
): GridLayoutConfig {
  // Single image - no grid
  if (numImages === 1) {
    return {
      containerClass: "",
      imageClass: isUserMessage
        ? (aspectRatio === "9:16" ? "max-w-[200px]" : "max-w-md")
        : (aspectRatio === "9:16" ? "max-w-sm" : "max-w-3xl")
    };
  }

  // Portrait (9:16) - horizontal layout
  if (aspectRatio === "9:16") {
    return {
      containerClass: `grid gap-2 ${
        numImages === 2 ? "grid-cols-2" :
        numImages === 3 ? "grid-cols-3" :
        "grid-cols-4"
      } ${isUserMessage ? "max-w-md" : "max-w-3xl"}`,
      imageClass: "w-full"
    };
  }

  // Landscape (16:9, 21:9) - vertical/grid layout
  if (aspectRatio === "16:9" || aspectRatio === "21:9") {
    if (numImages === 2) {
      return {
        containerClass: `flex flex-col gap-2 ${isUserMessage ? "max-w-md" : "max-w-3xl"}`,
        imageClass: "w-full"
      };
    }
    if (numImages === 3) {
      return {
        containerClass: `grid gap-2 ${isUserMessage ? "max-w-md" : "max-w-3xl"}`,
        imageClass: "w-full",
        customLayout: "2+1" // 2 in first row, 1 in second
      };
    }
    return {
      containerClass: `grid grid-cols-2 gap-2 ${isUserMessage ? "max-w-md" : "max-w-3xl"}`,
      imageClass: "w-full"
    };
  }

  // Square/Other (1:1, 4:3, 3:2) - horizontal/grid layout
  if (numImages === 2) {
    return {
      containerClass: `grid grid-cols-2 gap-2 ${isUserMessage ? "max-w-md" : "max-w-3xl"}`,
      imageClass: "w-full"
    };
  }
  if (numImages === 3) {
    return {
      containerClass: `grid gap-2 ${isUserMessage ? "max-w-md" : "max-w-3xl"}`,
      imageClass: "w-full",
      customLayout: "2+1" // 2 in first row, 1 in second
    };
  }
  return {
    containerClass: `grid grid-cols-2 gap-2 ${isUserMessage ? "max-w-md" : "max-w-3xl"}`,
    imageClass: "w-full"
  };
}

/**
 * Separate attachments by type (images vs other files)
 * @param attachments - Array of attachments to separate
 * @returns Object with images and otherAttachments arrays
 */
export function separateAttachmentsByType(attachments: Attachment[]) {
  const images = attachments.filter(att => att.type === "image");
  const otherAttachments = attachments.filter(att => att.type !== "image");

  return {
    images,
    otherAttachments
  };
}
