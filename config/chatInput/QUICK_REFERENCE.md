# ChatInput Configuration Quick Reference

Quick lookup guide for common configuration tasks.

## Common Imports

```tsx
// Most common imports
import {
  UI_TEXT,
  INPUT_CONSTRAINTS,
  STYLE_CLASSES,
  formatReplyPreviewText,
  calculateTextareaHeight,
  canSendMessage,
} from '@/config/chatInput';

// Mode-related imports
import {
  CHAT_MODES,
  getModeConfig,
  getEnabledModes,
} from '@/config/chatInput';

// Toolbar imports
import {
  TOOLBAR_STYLES,
  getEnabledToolbarItems,
} from '@/config/chatInput';
```

## Configuration Quick Lookup

### UI Text (German)

| Key | Value | Usage |
|-----|-------|-------|
| `UI_TEXT.placeholder` | "Nachricht eingeben..." | Textarea placeholder |
| `UI_TEXT.transcribing` | "Wird transkribiert..." | Voice transcription indicator |
| `UI_TEXT.uploading` | "Datei wird verarbeitet..." | File upload indicator |
| `UI_TEXT.dropOverlay.title` | "Datei hier ablegen" | Drag & drop overlay title |
| `UI_TEXT.dropOverlay.subtitle` | "Bilder & PDFs werden unterstützt" | Drag & drop overlay subtitle |
| `UI_TEXT.replyPreview.contextImage` | "Kontext - {name}" | Reply preview for images |
| `UI_TEXT.replyPreview.contextFile` | "Kontext - {name}" | Reply preview for files |
| `UI_TEXT.replyPreview.contextFallback` | "Kontext" | Reply preview fallback |
| `UI_TEXT.replyPreview.cancelLabel` | "Abbrechen" | Cancel button label |

### Input Constraints

| Key | Value | Description |
|-----|-------|-------------|
| `INPUT_CONSTRAINTS.maxHeight` | 200 | Max textarea height (px) |
| `INPUT_CONSTRAINTS.fileAccept` | "image/*,.pdf" | File input accept types |
| `INPUT_CONSTRAINTS.allowMultiple` | true | Allow multiple file uploads |

### Chat Modes

| Mode | Icon | Label | Toolbar Icon |
|------|------|-------|--------------|
| `"chat"` | MessageSquare | "Chat-Modus" | Plus |
| `"image"` | ImageIcon | "Erstelle Bilder" | ImageIcon |
| `"video"` | Video | "Erstelle Videos" | Video |

### Style Classes

| Key | Purpose |
|-----|---------|
| `STYLE_CLASSES.container` | Outer container with responsive padding |
| `STYLE_CLASSES.maxWidth` | Max-width wrapper |
| `STYLE_CLASSES.inputWrapper` | Main input wrapper with gradient |
| `STYLE_CLASSES.textarea` | Textarea element styling |
| `STYLE_CLASSES.indicator` | Loading indicator container |
| `STYLE_CLASSES.dragOverlay` | Drag & drop overlay |
| `STYLE_CLASSES.replyPreview` | Reply preview container |

### Toolbar Styles

| Key | Purpose |
|-----|---------|
| `TOOLBAR_STYLES.button` | Toolbar button |
| `TOOLBAR_STYLES.dropdown` | Dropdown container |
| `TOOLBAR_STYLES.dropdownItem` | Dropdown item button |
| `TOOLBAR_STYLES.divider` | Dropdown divider |
| `TOOLBAR_STYLES.icon` | Icon sizing/coloring |
| `TOOLBAR_STYLES.label` | Text label styling |

## Helper Functions Quick Reference

### formatReplyPreviewText
```tsx
formatReplyPreviewText(message: Message): string
```
**Usage**: Format reply preview text based on attachments
```tsx
const previewText = formatReplyPreviewText(replyTo);
```

### calculateTextareaHeight
```tsx
calculateTextareaHeight(scrollHeight: number, maxHeight?: number): number
```
**Usage**: Calculate optimal textarea height
```tsx
const height = calculateTextareaHeight(textarea.scrollHeight);
textarea.style.height = height + "px";
```

### hasImageAttachments
```tsx
hasImageAttachments(attachments: Attachment[]): boolean
```
**Usage**: Check if any attachment is an image
```tsx
if (hasImageAttachments(attachments)) {
  // Show image-specific UI
}
```

### canSendMessage
```tsx
canSendMessage(message: string, attachments: Attachment[]): boolean
```
**Usage**: Validate if message can be sent
```tsx
if (canSendMessage(message, attachments)) {
  onSendMessage(message, attachments);
}
```

### getModeConfig
```tsx
getModeConfig(mode: ChatMode): ChatModeConfig
```
**Usage**: Get configuration for a mode
```tsx
const config = getModeConfig('chat');
const Icon = config.icon;
```

### getEnabledModes
```tsx
getEnabledModes(): ChatModeConfig[]
```
**Usage**: Get all enabled modes
```tsx
const modes = getEnabledModes();
modes.forEach(mode => {
  // Render mode button
});
```

### isModeEnabled
```tsx
isModeEnabled(mode: ChatMode): boolean
```
**Usage**: Check if a mode is enabled
```tsx
if (isModeEnabled('video')) {
  // Render video option
}
```

### getEnabledToolbarItems
```tsx
getEnabledToolbarItems(): ToolbarItem[]
```
**Usage**: Get enabled toolbar items
```tsx
const items = getEnabledToolbarItems();
```

## Common Patterns

### Display Mode Icon
```tsx
const ModeIcon = getModeConfig(mode).toolbarIcon;
<ModeIcon className={TOOLBAR_STYLES.icon} />
```

### Display Mode Label
```tsx
const modeLabel = getModeConfig(mode).label;
<span>{modeLabel}</span>
```

### Auto-resize Textarea
```tsx
const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
  e.target.style.height = "auto";
  e.target.style.height = calculateTextareaHeight(e.target.scrollHeight) + "px";
};
```

### Validate and Send
```tsx
const handleSend = () => {
  if (canSendMessage(message, attachments)) {
    onSendMessage(message, attachments);
  }
};
```

### Format Reply Preview
```tsx
<div className="text-xs text-pw-black/50 truncate">
  {formatReplyPreviewText(replyTo)}
</div>
```

### Check for Images
```tsx
useEffect(() => {
  const hasImages = hasImageAttachments(attachments);
  onImageAttachmentChange?.(hasImages);
}, [attachments]);
```

## Adding New Content

### Add New Mode
1. Update `ChatMode` type in `types.ts`
2. Add mode config to `CHAT_MODES` in `modes.ts`
3. Handle in component render logic

### Add New UI Text
1. Update `UITextConfig` interface in `types.ts`
2. Add text to `UI_TEXT` in `constants.ts`
3. Use in component: `{UI_TEXT.yourNewText}`

### Add New Helper
1. Add function to `helpers.ts`
2. Export from `index.ts`
3. Import and use in component

### Add New Constraint
1. Update `InputConstraintsConfig` in `types.ts`
2. Add constraint to `INPUT_CONSTRAINTS` in `constants.ts`
3. Use in component

## File Locations

```
config/chatInput/
├── index.ts              # Import from here
├── types.ts              # Type definitions
├── modes.ts              # Mode configs
├── constants.ts          # Constants & text
├── toolbar.ts            # Toolbar configs
├── helpers.ts            # Helper functions
├── README.md             # Full documentation
├── EXTRACTION_REPORT.md  # Analysis report
├── REFACTORING_EXAMPLES.md  # Before/after examples
└── QUICK_REFERENCE.md    # This file
```

## TypeScript Types

```tsx
// Mode type
type ChatMode = "chat" | "image" | "video";

// Mode config
interface ChatModeConfig {
  mode: ChatMode;
  icon: LucideIcon;
  label: string;
  toolbarIcon: LucideIcon;
  enabled: boolean;
}

// Toolbar item types
type ToolbarActionType = "mode" | "file" | "divider";
type ToolbarItem = ModeToolbarItem | FileToolbarItem | DividerToolbarItem;
```

## Related Configurations

- `/config/imageSettings/` - Image generation settings
- `/config/videoSettings/` - Video generation settings
- `/types/chat.ts` - Core chat types

## Support

For detailed documentation, see:
- [README.md](./README.md) - Full documentation
- [EXTRACTION_REPORT.md](./EXTRACTION_REPORT.md) - Analysis and recommendations
- [REFACTORING_EXAMPLES.md](./REFACTORING_EXAMPLES.md) - Before/after examples
