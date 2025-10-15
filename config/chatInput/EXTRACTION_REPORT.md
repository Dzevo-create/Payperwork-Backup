# ChatInput Configuration Extraction Report

## Summary

Successfully extracted all hardcoded configurations from ChatInput.tsx and InputToolbar.tsx into a centralized, type-safe configuration system.

## Created Configuration Files

### 1. `/config/chatInput/types.ts` (1,590 bytes)
**Purpose**: TypeScript type definitions for all configuration structures

**Exports**:
- `ChatMode`: Union type for mode identifiers
- `ChatModeConfig`: Configuration interface for chat modes
- `UITextConfig`: Interface for UI text strings
- `InputConstraintsConfig`: Interface for input constraints
- `UIBehaviorConfig`: Interface for UI behavior settings

### 2. `/config/chatInput/modes.ts` (1,292 bytes)
**Purpose**: Chat mode configurations (chat, image, video)

**Exports**:
- `CHAT_MODES`: Record of all available modes with icons and labels
- `DEFAULT_CHAT_MODE`: Default mode constant ("chat")
- `getModeConfig()`: Get configuration for a specific mode
- `getEnabledModes()`: Get all enabled modes
- `isModeEnabled()`: Check if a mode is enabled

**Extracted from**:
- InputToolbar.tsx lines 4, 7-8, 33-35, 41-83
- ChatInput.tsx lines 20-21, 37, 145-148

### 3. `/config/chatInput/constants.ts` (2,445 bytes)
**Purpose**: All hardcoded constants, text strings, and styling

**Exports**:
- `UI_TEXT`: German localized strings
  - Placeholder text: "Nachricht eingeben..."
  - Transcribing text: "Wird transkribiert..."
  - Uploading text: "Datei wird verarbeitet..."
  - Drag & drop overlay text
  - Reply preview text templates
- `INPUT_CONSTRAINTS`: Input field constraints
  - Max height: 200px
  - File accept: "image/*,.pdf"
  - Allow multiple: true
- `UI_BEHAVIOR`: UI behavior flags
- `STYLE_CLASSES`: CSS class name constants
- `KEYBOARD_SHORTCUTS`: Keyboard shortcut definitions
- `ANIMATION_DURATIONS`: Animation timing values

**Extracted from**:
- ChatInput.tsx lines 89, 121, 141, 220-353
- InputToolbar.tsx lines 30, 39

### 4. `/config/chatInput/toolbar.ts` (2,255 bytes)
**Purpose**: Toolbar button and dropdown configurations

**Exports**:
- `ToolbarActionType`: Union type for toolbar actions
- `ToolbarItem`: Union type for toolbar items
- `TOOLBAR_ITEMS`: Array of toolbar dropdown items
- `TOOLBAR_STYLES`: Styling constants for toolbar elements
- `getEnabledToolbarItems()`: Get enabled toolbar items

**Extracted from**:
- InputToolbar.tsx lines 4, 25-88

### 5. `/config/chatInput/helpers.ts` (2,335 bytes)
**Purpose**: Utility functions for common operations

**Exports**:
- `formatReplyPreviewText()`: Format reply preview text based on attachments
- `calculateTextareaHeight()`: Calculate optimal textarea height
- `hasImageAttachments()`: Check if attachments contain images
- `canSendMessage()`: Validate if message can be sent
- `getFileAcceptAttribute()`: Generate file input accept string

**Extracted from**:
- ChatInput.tsx lines 89, 96-98, 101, 121, 141, 255-268

### 6. `/config/chatInput/index.ts` (1,308 bytes)
**Purpose**: Barrel exports for clean imports

**Provides**: Single entry point for all configuration imports

### 7. `/config/chatInput/README.md` (5,045 bytes)
**Purpose**: Comprehensive documentation

**Contains**:
- Structure overview
- Usage examples
- Configuration file descriptions
- Customization guide
- Best practices
- Related files reference

## What Was Extracted

### Mode Configurations
- Chat mode: MessageSquare icon, "Chat-Modus" label, Plus toolbar icon
- Image mode: ImageIcon icon, "Erstelle Bilder" label
- Video mode: Video icon, "Erstelle Videos" label
- Default mode: "chat"

### UI Text (German Localization)
- Input placeholder: "Nachricht eingeben..."
- Transcribing indicator: "Wird transkribiert..."
- Uploading indicator: "Datei wird verarbeitet..."
- Drag overlay title: "Datei hier ablegen"
- Drag overlay subtitle: "Bilder & PDFs werden unterstützt"
- Reply preview templates with context labels

### Input Constraints
- Maximum textarea height: 200px
- Minimum textarea height: 20px (in STYLE_CLASSES)
- File accept types: "image/*,.pdf"
- Multiple file upload: enabled
- Auto-resize behavior: enabled

### Styling Constants
- Container classes with responsive padding
- Input wrapper with gradient background and blur effects
- Textarea styling with transparent background
- Indicator styling for loading states
- Drag overlay with accent colors
- Reply preview with gradient background

### Keyboard Shortcuts
- Enter (without Shift): Send message
- Shift+Enter: New line

### Toolbar Configuration
- File upload button with FileText icon
- Mode buttons with respective icons
- Dropdown styling and positioning
- Divider between sections

## Refactoring Recommendations for ChatInput.tsx

### High Priority

1. **Replace inline text with UI_TEXT constants**
   ```tsx
   // Before
   <textarea placeholder="Nachricht eingeben..." />

   // After
   import { UI_TEXT } from '@/config/chatInput';
   <textarea placeholder={UI_TEXT.placeholder} />
   ```

2. **Use INPUT_CONSTRAINTS for file input**
   ```tsx
   // Before
   <input type="file" accept="image/*,.pdf" multiple />

   // After
   import { INPUT_CONSTRAINTS } from '@/config/chatInput';
   <input
     type="file"
     accept={INPUT_CONSTRAINTS.fileAccept}
     multiple={INPUT_CONSTRAINTS.allowMultiple}
   />
   ```

3. **Replace magic numbers with constants**
   ```tsx
   // Before
   textareaRef.current.style.height = Math.min(scrollHeight, 200) + "px";

   // After
   import { calculateTextareaHeight } from '@/config/chatInput';
   textareaRef.current.style.height = calculateTextareaHeight(scrollHeight) + "px";
   ```

4. **Use formatReplyPreviewText helper**
   ```tsx
   // Before (lines 255-268)
   {(() => {
     const imageAttachment = replyTo.attachments?.find(att => att.type === "image");
     if (imageAttachment) {
       return `Kontext - ${imageAttachment.name || "Bild"}`;
     }
     // ... more logic
   })()}

   // After
   import { formatReplyPreviewText } from '@/config/chatInput';
   {formatReplyPreviewText(replyTo)}
   ```

5. **Use canSendMessage helper**
   ```tsx
   // Before (line 101)
   if (message.trim() || attachments.length > 0) {

   // After
   import { canSendMessage } from '@/config/chatInput';
   if (canSendMessage(message, attachments)) {
   ```

### Medium Priority

6. **Extract CSS classes to STYLE_CLASSES**
   ```tsx
   // Before
   <div className="px-3 sm:px-4 md:px-6 py-4 bg-transparent">

   // After
   import { STYLE_CLASSES } from '@/config/chatInput';
   <div className={STYLE_CLASSES.container}>
   ```

7. **Use getModeConfig for mode-specific logic**
   ```tsx
   // In InputToolbar.tsx
   import { getModeConfig } from '@/config/chatInput';
   const modeConfig = getModeConfig(mode);
   <modeConfig.toolbarIcon className="w-4 h-4 text-pw-black/60" />
   ```

### Low Priority

8. **Consider extracting keyboard event handlers**
   - Create a keyboard handler utility using KEYBOARD_SHORTCUTS
   - Centralize Enter/Shift+Enter logic

9. **Extract drag & drop configuration**
   - Create dedicated drag-drop config if reused elsewhere
   - Include accepted file types and behavior flags

10. **Add feature flags for modes**
    - Already supported via `enabled` property in CHAT_MODES
    - Can be used to toggle features dynamically

## Benefits of This Refactoring

### Type Safety
- All configurations use `as const` for literal type inference
- TypeScript will catch typos and invalid values
- IntelliSense provides autocomplete for all config values

### Maintainability
- Single source of truth for all constants
- Easy to find and update values
- No more hunting through components for hardcoded strings

### Internationalization Ready
- All text is centralized in UI_TEXT
- Easy to add multi-language support
- Can create UI_TEXT_DE, UI_TEXT_EN, etc.

### Testability
- Helper functions can be unit tested
- Configuration can be mocked for testing
- Easier to test different mode configurations

### Reusability
- Configurations can be reused in other components
- Helper functions avoid code duplication
- Consistent behavior across the application

### Scalability
- Easy to add new modes
- Simple to enable/disable features
- Clear structure for future enhancements

## Migration Path

### Phase 1: Import Configurations (No Breaking Changes)
1. Import config in ChatInput.tsx
2. Import config in InputToolbar.tsx
3. Keep existing code working

### Phase 2: Replace High-Priority Items
1. Replace inline text with UI_TEXT
2. Replace magic numbers with constants
3. Use helper functions

### Phase 3: Replace Styling
1. Replace className strings with STYLE_CLASSES
2. Test visual consistency

### Phase 4: Cleanup
1. Remove inline constants
2. Remove duplicate logic
3. Add tests for helper functions

## Testing Recommendations

### Unit Tests
- Test helper functions in isolation
- Test getModeConfig with all modes
- Test canSendMessage with edge cases
- Test formatReplyPreviewText with different message types

### Integration Tests
- Test ChatInput with different modes
- Test file upload with different types
- Test keyboard shortcuts
- Test drag & drop behavior

### Visual Regression Tests
- Test styling consistency
- Test responsive behavior
- Test dropdown positioning

## Future Enhancements

1. **Multi-language Support**
   - Create language-specific UI_TEXT configs
   - Add language switcher utility
   - Support dynamic text loading

2. **Theme Support**
   - Extract color values from STYLE_CLASSES
   - Create theme config system
   - Support light/dark modes

3. **Feature Flags**
   - Add feature flag system
   - Enable/disable modes dynamically
   - A/B testing support

4. **Analytics Integration**
   - Add tracking IDs to mode configs
   - Track mode usage
   - Monitor feature adoption

5. **Accessibility**
   - Add ARIA labels to config
   - Keyboard shortcut descriptions
   - Screen reader text

## Related Configuration Files

- `/config/imageSettings/` - Image generation settings
- `/config/videoSettings/` - Video generation settings
- `/types/chat.ts` - Core chat types

## Conclusion

This extraction creates a solid foundation for the ChatInput component configuration. The structure is:
- Type-safe and well-documented
- Easy to maintain and extend
- Ready for internationalization
- Testable and reusable

The refactoring recommendations provide a clear path to migrate the existing component to use these configurations without breaking changes.
