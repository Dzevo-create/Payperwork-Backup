# Shared Components

Wiederverwendbare UI-Komponenten für Settings und Dropdowns.

## Components

### SettingsDropdown

Ein generisches, vollständig typisiertes Dropdown für Einstellungen mit Keyboard-Navigation und Accessibility-Features.

#### Features

- ✅ **Generische TypeScript Types** (`<T extends string>`)
- ✅ **Click Outside Detection** mit useEffect
- ✅ **Keyboard Navigation** (Arrow Up/Down, Enter, Escape, Tab)
- ✅ **Smooth Animations** mit Tailwind transitions
- ✅ **Full Accessibility** (ARIA attributes)
- ✅ **Fokus-Management** mit automatischem Scroll
- ✅ **Dark Theme Ready** mit Tailwind CSS
- ✅ **Responsive Design**

#### Props

```typescript
interface SettingsDropdownProps<T extends string> {
  label: string;                    // Label für das Dropdown
  value: T;                          // Aktueller Wert
  options: ReadonlyArray<DropdownOption<T>>; // Options Array
  onChange: (value: T) => void;      // Change Handler
  disabled?: boolean;                // Disabled State (default: false)
  icon?: React.ComponentType;        // Optional Icon (Lucide)
  dropdownWidth?: string;            // Tailwind width class (default: "w-56")
  showCheckmark?: boolean;           // Checkmark anzeigen (default: true)
  placement?: "top" | "bottom";      // Dropdown Position (default: "top")
}

interface DropdownOption<T extends string> {
  value: T;       // Wert der Option
  label: string;  // Anzeige-Label
  icon?: string;  // Optional Emoji/Icon
}
```

#### Usage Example

```typescript
import { SettingsDropdown } from "@/components/shared";
import { Palette } from "lucide-react";

// 1. Define your type
type StyleType = "photorealistic" | "cinematic" | "artistic";

// 2. Define options
const STYLE_OPTIONS = [
  { value: "photorealistic" as const, label: "Photorealistic", icon: "📷" },
  { value: "cinematic" as const, label: "Cinematic", icon: "🎬" },
  { value: "artistic" as const, label: "Artistic", icon: "🎨" },
] as const;

// 3. Use in component
function MyComponent() {
  const [style, setStyle] = useState<StyleType>("photorealistic");

  return (
    <SettingsDropdown
      label="Style"
      value={style}
      options={STYLE_OPTIONS}
      onChange={setStyle}
      icon={Palette}
      dropdownWidth="w-48"
      placement="bottom"
    />
  );
}
```

---

### SettingsCard

Ein erweiterbares/zusammenklappbares Card für Settings mit smooth Animationen.

#### Features

- ✅ **Controlled & Uncontrolled Mode**
- ✅ **Smooth Height Animations** mit ResizeObserver
- ✅ **Optional Collapsible**
- ✅ **Icon Support**
- ✅ **Accessibility** (ARIA attributes)

#### Props

```typescript
interface SettingsCardProps {
  title: string;                      // Card Titel
  icon?: React.ComponentType;         // Optional Icon
  isOpen?: boolean;                   // Controlled: Open State
  onToggle?: () => void;              // Controlled: Toggle Handler
  children: React.ReactNode;          // Card Content
  defaultOpen?: boolean;              // Uncontrolled: Initial State (default: true)
  collapsible?: boolean;              // Kann zusammengeklappt werden (default: true)
  className?: string;                 // Additional CSS classes
}
```

#### Usage Example

```typescript
import { SettingsCard } from "@/components/shared";
import { Palette } from "lucide-react";

// Uncontrolled Mode (einfach)
function MyComponent() {
  return (
    <SettingsCard
      title="Image Settings"
      icon={Palette}
      defaultOpen={true}
    >
      <div>Settings Content Here</div>
    </SettingsCard>
  );
}

// Controlled Mode (mit State)
function MyComponentControlled() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <SettingsCard
      title="Advanced Settings"
      icon={Palette}
      isOpen={isOpen}
      onToggle={() => setIsOpen(!isOpen)}
    >
      <div>Settings Content Here</div>
    </SettingsCard>
  );
}

// Non-collapsible (immer offen)
function MyComponentStatic() {
  return (
    <SettingsCard
      title="Static Settings"
      collapsible={false}
    >
      <div>Always visible content</div>
    </SettingsCard>
  );
}
```

---

### SettingsGroup

Helper Component für gruppierte Settings innerhalb einer SettingsCard.

#### Props

```typescript
interface SettingsGroupProps {
  label: string;           // Group Label
  description?: string;    // Optional Beschreibung
  children: React.ReactNode;
  className?: string;
}
```

#### Usage Example

```typescript
import { SettingsCard, SettingsGroup, SettingsDropdown } from "@/components/shared";

function MySettings() {
  return (
    <SettingsCard title="Image Settings">
      <SettingsGroup
        label="Style"
        description="Choose the visual style for your images"
      >
        <SettingsDropdown {...styleProps} />
      </SettingsGroup>

      <SettingsGroup label="Quality">
        <SettingsDropdown {...qualityProps} />
      </SettingsGroup>
    </SettingsCard>
  );
}
```

---

### SettingsRow

Helper Component für Row-Layout (Label links, Control rechts).

#### Props

```typescript
interface SettingsRowProps {
  children: React.ReactNode;
  className?: string;
}
```

#### Usage Example

```typescript
import { SettingsCard, SettingsRow } from "@/components/shared";

function MySettings() {
  return (
    <SettingsCard title="Settings">
      <SettingsRow>
        <span className="text-sm">Enable Feature</span>
        <input type="checkbox" />
      </SettingsRow>

      <SettingsRow>
        <span className="text-sm">Select Option</span>
        <SettingsDropdown {...props} />
      </SettingsRow>
    </SettingsCard>
  );
}
```

---

## Vollständiges Beispiel: Image Settings Refactor

So würdest du die bestehenden ImageSettings refactoren:

```typescript
"use client";

import { useState } from "react";
import { Palette, Sun, Zap, RectangleHorizontal, Sparkles, Copy } from "lucide-react";
import {
  SettingsDropdown,
  type DropdownOption,
} from "@/components/shared";

// Types
type PresetType = "none" | "cinematic" | "portrait" | "landscape";
type StyleType = "photorealistic" | "cinematic" | "artistic" | "anime" | "3d_render" | undefined;
type LightingType = "natural" | "studio" | "dramatic" | "golden_hour" | "neon" | "soft" | undefined;
type QualityType = "standard" | "high" | "ultra";
type AspectRatioType = "1:1" | "16:9" | "9:16" | "4:3" | "3:2" | "21:9";
type NumImagesType = 1 | 2 | 3 | 4;

// Options
const PRESET_OPTIONS: DropdownOption<PresetType>[] = [
  { value: "none", label: "Keine Vorgabe", icon: "✨" },
  { value: "cinematic", label: "Cinematic", icon: "🎬" },
  { value: "portrait", label: "Portrait", icon: "📸" },
  { value: "landscape", label: "Landscape", icon: "🏞️" },
];

const STYLE_OPTIONS: DropdownOption<StyleType>[] = [
  { value: undefined, label: "Auto (Enhancer wählt)" },
  { value: "photorealistic", label: "Photorealistic" },
  { value: "cinematic", label: "Cinematic" },
  { value: "artistic", label: "Artistic" },
];

// ... mehr Options

export default function ImageSettings({ settings, onSettingsChange }) {
  return (
    <div className="flex items-center justify-end gap-1.5 flex-wrap">
      <SettingsDropdown
        label="Preset"
        value={settings.preset || "none"}
        options={PRESET_OPTIONS}
        onChange={(value) => handlePresetChange(value)}
        icon={Sparkles}
      />

      <SettingsDropdown
        label="Style"
        value={settings.style}
        options={STYLE_OPTIONS}
        onChange={(value) => onSettingsChange({ ...settings, style: value })}
        icon={Palette}
      />

      <SettingsDropdown
        label="Lighting"
        value={settings.lighting}
        options={LIGHTING_OPTIONS}
        onChange={(value) => onSettingsChange({ ...settings, lighting: value })}
        icon={Sun}
      />

      <SettingsDropdown
        label="Quality"
        value={settings.quality}
        options={QUALITY_OPTIONS}
        onChange={(value) => onSettingsChange({ ...settings, quality: value })}
        icon={Zap}
        dropdownWidth="w-44"
      />

      <SettingsDropdown
        label="Aspect"
        value={settings.aspectRatio}
        options={ASPECT_RATIO_OPTIONS}
        onChange={(value) => onSettingsChange({ ...settings, aspectRatio: value })}
        icon={RectangleHorizontal}
      />

      <SettingsDropdown
        label="Amount"
        value={settings.numImages}
        options={NUM_IMAGES_OPTIONS}
        onChange={(value) => onSettingsChange({ ...settings, numImages: value })}
        icon={Copy}
        dropdownWidth="w-44"
      />
    </div>
  );
}
```

## Keyboard Shortcuts

### SettingsDropdown

- **Space/Enter**: Dropdown öffnen
- **Arrow Down**: Nächste Option
- **Arrow Up**: Vorherige Option
- **Enter**: Option auswählen
- **Escape**: Dropdown schließen
- **Tab**: Dropdown schließen und zum nächsten Element

## Accessibility

Beide Components sind vollständig accessible:

- ✅ ARIA attributes (role, aria-expanded, aria-selected, etc.)
- ✅ Keyboard Navigation
- ✅ Focus Management
- ✅ Screen Reader Support
- ✅ Disabled States

## Styling

Die Components nutzen das bestehende Tailwind Theme:

- `pw-accent`: Accent Color für aktive States
- `pw-black`: Text Color
- Glassmorphism mit `backdrop-blur`
- Gradient Backgrounds
- Smooth Transitions

## Migration Guide

### Vorher (alt)

```typescript
<div className="relative" ref={el => dropdownRefs.current["style"] = el}>
  <button onClick={() => setOpenDropdown(openDropdown === "style" ? null : "style")} {...}>
    <Palette className="..." />
    <span>{getCurrentLabel("style")}</span>
    <ChevronDown className="..." />
  </button>

  {openDropdown === "style" && (
    <div className="absolute ...">
      {STYLE_OPTIONS.map((option) => (
        <button key={option.value} onClick={() => {...}} {...}>
          {option.label}
        </button>
      ))}
    </div>
  )}
</div>
```

### Nachher (neu)

```typescript
<SettingsDropdown
  label="Style"
  value={settings.style}
  options={STYLE_OPTIONS}
  onChange={(value) => onSettingsChange({ ...settings, style: value })}
  icon={Palette}
/>
```

**Reduktion: Von ~40 Zeilen auf 6 Zeilen pro Dropdown!**
