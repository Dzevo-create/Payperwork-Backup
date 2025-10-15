# ChatInput Refactoring Examples

This document shows concrete before/after examples for refactoring ChatInput.tsx to use the new configuration system.

## Example 1: Text Placeholder

### Before
```tsx
<textarea
  placeholder="Nachricht eingeben..."
  className="flex-1 bg-transparent text-sm"
/>
```

### After
```tsx
import { UI_TEXT } from '@/config/chatInput';

<textarea
  placeholder={UI_TEXT.placeholder}
  className="flex-1 bg-transparent text-sm"
/>
```

**Benefits**: Centralized text, easy to change, i18n-ready

---

## Example 2: Loading Indicators

### Before
```tsx
{isTranscribing && (
  <div className="mb-2 flex items-center gap-2 text-sm text-pw-black/60">
    <Loader2 className="w-4 h-4 animate-spin" />
    <span>Wird transkribiert...</span>
  </div>
)}

{isUploading && (
  <div className="mb-2 flex items-center gap-2 text-sm text-pw-black/60">
    <Loader2 className="w-4 h-4 animate-spin" />
    <span>Datei wird verarbeitet...</span>
  </div>
)}
```

### After
```tsx
import { UI_TEXT, STYLE_CLASSES } from '@/config/chatInput';

{isTranscribing && (
  <div className={STYLE_CLASSES.indicator}>
    <Loader2 className="w-4 h-4 animate-spin" />
    <span>{UI_TEXT.transcribing}</span>
  </div>
)}

{isUploading && (
  <div className={STYLE_CLASSES.indicator}>
    <Loader2 className="w-4 h-4 animate-spin" />
    <span>{UI_TEXT.uploading}</span>
  </div>
)}
```

**Benefits**: Consistent styling, centralized text, DRY principle

---

## Example 3: Reply Preview Text

### Before
```tsx
<div className="text-xs text-pw-black/50 truncate">
  {(() => {
    const imageAttachment = replyTo.attachments?.find(att => att.type === "image");
    if (imageAttachment) {
      return `Kontext - ${imageAttachment.name || "Bild"}`;
    }
    const attachment = replyTo.attachments?.[0];
    if (attachment) {
      return `Kontext - ${attachment.name || "Anhang"}`;
    }
    return replyTo.content || "Kontext";
  })()}
</div>
```

### After
```tsx
import { formatReplyPreviewText } from '@/config/chatInput';

<div className="text-xs text-pw-black/50 truncate">
  {formatReplyPreviewText(replyTo)}
</div>
```

**Benefits**: Cleaner code, reusable logic, easier to test

---

## Example 4: Textarea Height Calculation

### Before
```tsx
const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
  setMessage(e.target.value);
  e.target.style.height = "auto";
  e.target.style.height = Math.min(e.target.scrollHeight, 200) + "px";
};

useEffect(() => {
  if (textareaRef.current) {
    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + "px";
  }
}, [message]);

// In transcription callback
textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + "px";
```

### After
```tsx
import { calculateTextareaHeight, INPUT_CONSTRAINTS } from '@/config/chatInput';

const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
  setMessage(e.target.value);
  e.target.style.height = "auto";
  e.target.style.height = calculateTextareaHeight(e.target.scrollHeight) + "px";
};

useEffect(() => {
  if (textareaRef.current) {
    textareaRef.current.style.height = "auto";
    const height = calculateTextareaHeight(textareaRef.current.scrollHeight);
    textareaRef.current.style.height = height + "px";
  }
}, [message]);

// In transcription callback
const height = calculateTextareaHeight(textareaRef.current.scrollHeight);
textareaRef.current.style.height = height + "px";
```

**Benefits**: No magic numbers, consistent behavior, easy to adjust max height

---

## Example 5: File Input Configuration

### Before
```tsx
<input
  ref={fileInputRef}
  type="file"
  accept="image/*,.pdf"
  multiple
  onChange={handleFileChange}
  className="hidden"
/>
```

### After
```tsx
import { INPUT_CONSTRAINTS } from '@/config/chatInput';

<input
  ref={fileInputRef}
  type="file"
  accept={INPUT_CONSTRAINTS.fileAccept}
  multiple={INPUT_CONSTRAINTS.allowMultiple}
  onChange={handleFileChange}
  className="hidden"
/>
```

**Benefits**: Centralized file type configuration, easy to add new types

---

## Example 6: Send Message Validation

### Before
```tsx
const handleSend = () => {
  if (message.trim() || attachments.length > 0) {
    onSendMessage?.(message, attachments);
    setMessage("");
    clearAttachments();
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }
};
```

### After
```tsx
import { canSendMessage } from '@/config/chatInput';

const handleSend = () => {
  if (canSendMessage(message, attachments)) {
    onSendMessage?.(message, attachments);
    setMessage("");
    clearAttachments();
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }
};
```

**Benefits**: Reusable validation logic, consistent rules across components

---

## Example 7: Drag & Drop Overlay

### Before
```tsx
{isDragging && (
  <div className="absolute inset-0 z-50 flex items-center justify-center bg-pw-accent/10 backdrop-blur-sm rounded-2xl border-2 border-dashed border-pw-accent">
    <div className="text-center">
      <Plus className="w-12 h-12 text-pw-accent mx-auto mb-2 animate-bounce" />
      <p className="text-sm font-semibold text-pw-accent">Datei hier ablegen</p>
      <p className="text-xs text-pw-accent/70 mt-1">Bilder & PDFs werden unterstützt</p>
    </div>
  </div>
)}
```

### After
```tsx
import { UI_TEXT, STYLE_CLASSES } from '@/config/chatInput';

{isDragging && (
  <div className={STYLE_CLASSES.dragOverlay}>
    <div className="text-center">
      <Plus className="w-12 h-12 text-pw-accent mx-auto mb-2 animate-bounce" />
      <p className="text-sm font-semibold text-pw-accent">
        {UI_TEXT.dropOverlay.title}
      </p>
      <p className="text-xs text-pw-accent/70 mt-1">
        {UI_TEXT.dropOverlay.subtitle}
      </p>
    </div>
  </div>
)}
```

**Benefits**: Centralized text and styling, consistent overlay appearance

---

## Example 8: InputToolbar Mode Icons

### Before
```tsx
<button onClick={onToggleDropdown}>
  {mode === "chat" && <Plus className="w-4 h-4 text-pw-black/60" />}
  {mode === "image" && <ImageIcon className="w-4 h-4 text-pw-black/60" />}
  {mode === "video" && <Video className="w-4 h-4 text-pw-black/60" />}
</button>
```

### After
```tsx
import { getModeConfig, TOOLBAR_STYLES } from '@/config/chatInput';

const ModeIcon = getModeConfig(mode).toolbarIcon;

<button onClick={onToggleDropdown}>
  <ModeIcon className={TOOLBAR_STYLES.icon} />
</button>
```

**Benefits**: Scalable for new modes, consistent icon styling, no conditional rendering

---

## Example 9: Container Styling

### Before
```tsx
<div className="px-3 sm:px-4 md:px-6 py-4 bg-transparent">
  <div className="max-w-3xl mx-auto">
    <div className="flex flex-col gap-2 px-3 py-2 bg-gradient-to-br from-white/80 to-white/70 backdrop-blur-lg border border-pw-black/10 rounded-2xl shadow-lg transition-all focus-within:ring-2 focus-within:ring-pw-accent/50 relative">
      {/* Content */}
    </div>
  </div>
</div>
```

### After
```tsx
import { STYLE_CLASSES } from '@/config/chatInput';

<div className={STYLE_CLASSES.container}>
  <div className={STYLE_CLASSES.maxWidth}>
    <div className={STYLE_CLASSES.inputWrapper}>
      {/* Content */}
    </div>
  </div>
</div>
```

**Benefits**: Reusable styles, easier to maintain, consistent appearance

---

## Example 10: Check for Image Attachments

### Before
```tsx
useEffect(() => {
  const hasImage = attachments.some(att => att.type === "image");
  onImageAttachmentChange?.(hasImage);
}, [attachments, onImageAttachmentChange]);
```

### After
```tsx
import { hasImageAttachments } from '@/config/chatInput';

useEffect(() => {
  onImageAttachmentChange?.(hasImageAttachments(attachments));
}, [attachments, onImageAttachmentChange]);
```

**Benefits**: Reusable helper, consistent attachment checking

---

## Complete Component Import Example

### Recommended imports at top of ChatInput.tsx:

```tsx
import {
  // Constants
  UI_TEXT,
  INPUT_CONSTRAINTS,
  STYLE_CLASSES,

  // Helpers
  formatReplyPreviewText,
  calculateTextareaHeight,
  hasImageAttachments,
  canSendMessage,

  // Types (if needed)
  type ChatMode,
} from '@/config/chatInput';
```

### Recommended imports at top of InputToolbar.tsx:

```tsx
import {
  // Mode config
  CHAT_MODES,
  getModeConfig,

  // Toolbar config
  TOOLBAR_STYLES,

  // Types
  type ChatMode,
} from '@/config/chatInput';
```

---

## Migration Checklist

- [ ] Import required configs and helpers
- [ ] Replace `"Nachricht eingeben..."` with `UI_TEXT.placeholder`
- [ ] Replace `"Wird transkribiert..."` with `UI_TEXT.transcribing`
- [ ] Replace `"Datei wird verarbeitet..."` with `UI_TEXT.uploading`
- [ ] Replace drag overlay text with `UI_TEXT.dropOverlay`
- [ ] Replace `Math.min(scrollHeight, 200)` with `calculateTextareaHeight()`
- [ ] Replace `"image/*,.pdf"` with `INPUT_CONSTRAINTS.fileAccept`
- [ ] Replace `multiple` with `INPUT_CONSTRAINTS.allowMultiple`
- [ ] Replace reply preview logic with `formatReplyPreviewText()`
- [ ] Replace `message.trim() || attachments.length > 0` with `canSendMessage()`
- [ ] Replace inline className strings with `STYLE_CLASSES` constants
- [ ] Update InputToolbar to use `getModeConfig()` for icons
- [ ] Test all functionality after refactoring
- [ ] Run TypeScript compilation check
- [ ] Run existing tests
- [ ] Perform visual regression testing

---

## Benefits Summary

1. **Type Safety**: All configs are type-checked
2. **Maintainability**: Single source of truth
3. **Reusability**: Helpers can be used elsewhere
4. **Testability**: Logic can be unit tested
5. **Consistency**: Same behavior everywhere
6. **Scalability**: Easy to add new modes/features
7. **Internationalization**: Ready for multi-language
8. **Documentation**: Well-documented configs
9. **Performance**: No runtime overhead
10. **Developer Experience**: Better IntelliSense and autocomplete
