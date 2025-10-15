# ChatInput Configuration

Centralized configuration for the ChatInput component and related UI elements.

## Structure

```
config/chatInput/
├── index.ts          # Barrel exports
├── types.ts          # TypeScript type definitions
├── modes.ts          # Chat mode configurations (chat, image, video)
├── constants.ts      # UI text, constraints, and styling
├── toolbar.ts        # Toolbar button configurations
├── helpers.ts        # Helper functions
└── README.md         # This file
```

## Usage

### Importing Configurations

```tsx
import {
  CHAT_MODES,
  UI_TEXT,
  INPUT_CONSTRAINTS,
  getModeConfig,
  formatReplyPreviewText,
} from '@/config/chatInput';
```

### Chat Modes

```tsx
// Get mode configuration
const chatMode = getModeConfig('chat');
console.log(chatMode.label); // "Chat-Modus"
console.log(chatMode.icon); // MessageSquare component

// Get all enabled modes
const enabledModes = getEnabledModes();

// Check if mode is enabled
if (isModeEnabled('video')) {
  // Video mode is available
}
```

### UI Text

```tsx
// Use localized text
<textarea placeholder={UI_TEXT.placeholder} />

// Format reply preview
const previewText = formatReplyPreviewText(replyToMessage);
```

### Input Constraints

```tsx
// Use constraints
<textarea
  style={{ maxHeight: `${INPUT_CONSTRAINTS.maxHeight}px` }}
/>

<input
  type="file"
  accept={INPUT_CONSTRAINTS.fileAccept}
  multiple={INPUT_CONSTRAINTS.allowMultiple}
/>
```

### Helper Functions

```tsx
// Check if message can be sent
if (canSendMessage(message, attachments)) {
  onSendMessage(message, attachments);
}

// Calculate textarea height
const height = calculateTextareaHeight(textarea.scrollHeight);

// Check for images
if (hasImageAttachments(attachments)) {
  // Show image-specific UI
}
```

## Configuration Files

### types.ts

Defines all TypeScript types used in the configuration:
- `ChatMode`: Union type for mode identifiers
- `ChatModeConfig`: Configuration for a single mode
- `UITextConfig`: UI text structure
- `InputConstraintsConfig`: Input field constraints
- `UIBehaviorConfig`: UI behavior settings

### modes.ts

Defines available chat modes:
- `CHAT_MODES`: Mode configurations with icons and labels
- `DEFAULT_CHAT_MODE`: Default mode ("chat")
- Helper functions: `getModeConfig()`, `getEnabledModes()`, `isModeEnabled()`

### constants.ts

Defines constants and configuration values:
- `UI_TEXT`: German localized text
- `INPUT_CONSTRAINTS`: Textarea and file input constraints
- `UI_BEHAVIOR`: UI behavior flags
- `STYLE_CLASSES`: CSS class names
- `KEYBOARD_SHORTCUTS`: Keyboard shortcut definitions
- `ANIMATION_DURATIONS`: Animation timing values

### toolbar.ts

Defines toolbar configuration:
- `TOOLBAR_ITEMS`: Toolbar dropdown items
- `TOOLBAR_STYLES`: Toolbar styling classes
- Helper functions: `getEnabledToolbarItems()`

### helpers.ts

Provides utility functions:
- `formatReplyPreviewText()`: Format reply preview text
- `calculateTextareaHeight()`: Calculate textarea height
- `hasImageAttachments()`: Check for image attachments
- `canSendMessage()`: Validate if message can be sent
- `getFileAcceptAttribute()`: Generate file input accept string

## Adding New Modes

To add a new chat mode:

1. Update `types.ts` to add the new mode to `ChatMode` type
2. Add mode configuration to `CHAT_MODES` in `modes.ts`
3. Update InputToolbar.tsx to handle the new mode icon
4. Add any mode-specific constants to `constants.ts`

Example:

```tsx
// types.ts
export type ChatMode = "chat" | "image" | "video" | "audio";

// modes.ts
export const CHAT_MODES = {
  // ... existing modes
  audio: {
    mode: "audio",
    icon: Mic,
    label: "Erstelle Audio",
    toolbarIcon: Mic,
    enabled: true,
  },
} as const satisfies Record<ChatMode, ChatModeConfig>;
```

## Customization

### Changing UI Text

Edit `UI_TEXT` in `constants.ts`:

```tsx
export const UI_TEXT: UITextConfig = {
  placeholder: "Your custom placeholder...",
  // ... other text
};
```

### Adjusting Constraints

Edit `INPUT_CONSTRAINTS` in `constants.ts`:

```tsx
export const INPUT_CONSTRAINTS: InputConstraintsConfig = {
  maxHeight: 300, // Increase max height
  fileAccept: "image/*,.pdf,.docx", // Add .docx support
  allowMultiple: true,
};
```

### Modifying Styles

Edit `STYLE_CLASSES` in `constants.ts`:

```tsx
export const STYLE_CLASSES = {
  container: "your-custom-classes",
  // ... other classes
};
```

## Best Practices

1. **Type Safety**: All configurations use `as const` for literal type inference
2. **Centralization**: Keep all hardcoded values in config files
3. **Helper Functions**: Use helpers for common operations
4. **Documentation**: Add JSDoc comments for all exports
5. **Consistency**: Follow naming conventions (UPPER_CASE for constants)

## Related Files

- `/components/chat/Chat/ChatInput.tsx` - Main component
- `/components/chat/Chat/InputToolbar.tsx` - Toolbar component
- `/components/chat/Chat/InputActions.tsx` - Action buttons component
- `/types/chat.ts` - Core chat types
