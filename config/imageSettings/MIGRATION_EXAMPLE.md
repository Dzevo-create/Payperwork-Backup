# Migration Example: ImageSettings.tsx

So wird die `ImageSettings.tsx` Component aktualisiert, um die neuen Config Files zu verwenden.

## Vorher (Hardcoded in Component)

```typescript
// components/chat/Chat/ImageSettings.tsx

const PRESET_OPTIONS = [
  { value: "none", label: "Keine Vorgabe", icon: "✨" },
  { value: "cinematic", label: "Cinematic", icon: "🎬" },
  // ...
];

const STYLE_OPTIONS = [
  { value: undefined, label: "Auto (Enhancer wählt)" },
  { value: "photorealistic", label: "Photorealistic" },
  // ...
];

// ... weitere hardcoded Arrays
```

## Nachher (Config Import)

```typescript
// components/chat/Chat/ImageSettings.tsx

"use client";

import { Palette, Sun, Zap, RectangleHorizontal, Sparkles, ChevronDown, Copy } from "lucide-react";
import { useState, useRef, useEffect } from "react";

// ✅ Import Config statt hardcoded Arrays
import {
  PRESET_OPTIONS,
  IMAGE_STYLES,
  LIGHTING_OPTIONS,
  QUALITY_OPTIONS,
  ASPECT_RATIOS as ASPECT_RATIO_OPTIONS,
  NUM_IMAGES_OPTIONS,
  getPresetDefaults,
  type ImageSettingsType,
  type ImageSettingsProps,
  type DropdownType,
} from '@/config/imageSettings';

export default function ImageSettings({ settings, onSettingsChange }: ImageSettingsProps) {
  const [openDropdown, setOpenDropdown] = useState<DropdownType>(null);
  const dropdownRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (openDropdown && !Object.values(dropdownRefs.current).some(ref => ref?.contains(e.target as Node))) {
        setOpenDropdown(null);
      }
    };

    if (openDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openDropdown]);

  const handlePresetChange = (presetId: string) => {
    // ✅ Nutze getPresetDefaults Helper statt PRESET_DEFAULTS
    const presetDefaults = getPresetDefaults(presetId as any) || {};
    onSettingsChange({
      ...settings,
      preset: presetId,
      ...presetDefaults,
    });
    setOpenDropdown(null);
  };

  const getCurrentLabel = (type: string) => {
    switch (type) {
      case "preset":
        const preset = PRESET_OPTIONS.find(p => p.value === (settings.preset || "none"));
        return preset?.icon || "✨";
      case "style":
        if (!settings.style) return "Auto";
        const style = IMAGE_STYLES.find(s => s.value === settings.style);
        return style?.label.split(" ")[0] || "Auto";
      case "lighting":
        if (!settings.lighting) return "Auto";
        const lighting = LIGHTING_OPTIONS.find(l => l.value === settings.lighting);
        return lighting?.label.split(" ")[0] || "Auto";
      case "quality":
        return settings.quality === "ultra" ? "Ultra" : settings.quality === "high" ? "High" : "Std";
      case "aspect":
        return settings.aspectRatio;
      case "numImages":
        return `${settings.numImages}x`;
      default:
        return "";
    }
  };

  return (
    <div className="flex items-center justify-end gap-1.5 flex-wrap">
      {/* Preset Card */}
      <div className="relative" ref={el => dropdownRefs.current["preset"] = el}>
        <button
          onClick={() => setOpenDropdown(openDropdown === "preset" ? null : "preset")}
          className={`group flex items-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-br from-white/80 to-white/70 backdrop-blur-sm rounded-lg border hover:shadow transition-all cursor-pointer ${
            openDropdown === "preset" ? "border-pw-accent/20 shadow-sm" : "border-pw-black/10"
          }`}
        >
          <Sparkles className={`w-3.5 h-3.5 transition-colors ${openDropdown === "preset" ? "text-pw-accent" : "text-pw-black/40"}`} />
          <span className="text-xs font-medium text-pw-black/70">{getCurrentLabel("preset")}</span>
          <ChevronDown className={`w-3 h-3 text-pw-black/40 transition-transform duration-200 ${openDropdown === "preset" ? "rotate-180" : ""}`} />
        </button>

        {openDropdown === "preset" && (
          <div className="absolute bottom-full mb-2 right-0 w-56 bg-white/95 backdrop-blur-xl rounded-xl shadow-xl border border-pw-black/10 py-1 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
            {PRESET_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => handlePresetChange(option.value)}
                className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                  (settings.preset || "none") === option.value
                    ? "bg-pw-accent text-white font-medium"
                    : "text-pw-black/70 hover:bg-pw-black/5"
                }`}
              >
                <span className="flex items-center gap-2">
                  {(settings.preset || "none") === option.value && <span className="text-xs">✓</span>}
                  <span>{option.icon}</span>
                  {option.label}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Style Card */}
      <div className="relative" ref={el => dropdownRefs.current["style"] = el}>
        <button
          onClick={() => setOpenDropdown(openDropdown === "style" ? null : "style")}
          className={`group flex items-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-br from-white/80 to-white/70 backdrop-blur-sm rounded-lg border hover:shadow transition-all cursor-pointer ${
            openDropdown === "style" ? "border-pw-accent/20 shadow-sm" : "border-pw-black/10"
          }`}
        >
          <Palette className={`w-3.5 h-3.5 transition-colors ${openDropdown === "style" ? "text-pw-accent" : "text-pw-black/40"}`} />
          <span className="text-xs font-medium text-pw-black/70">{getCurrentLabel("style")}</span>
          <ChevronDown className={`w-3 h-3 text-pw-black/40 transition-transform duration-200 ${openDropdown === "style" ? "rotate-180" : ""}`} />
        </button>

        {openDropdown === "style" && (
          <div className="absolute bottom-full mb-2 right-0 w-56 bg-white/95 backdrop-blur-xl rounded-xl shadow-xl border border-pw-black/10 py-1 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
            {IMAGE_STYLES.map((option) => (
              <button
                key={option.value || "auto"}
                onClick={() => {
                  onSettingsChange({ ...settings, style: option.value as any });
                  setOpenDropdown(null);
                }}
                className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                  settings.style === option.value
                    ? "bg-pw-accent text-white font-medium"
                    : "text-pw-black/70 hover:bg-pw-black/5"
                }`}
              >
                <span className="flex items-center gap-2">
                  {settings.style === option.value && <span className="text-xs">✓</span>}
                  {option.label}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lighting Card */}
      {/* ... analog zu Style Card ... */}

      {/* Quality Card */}
      {/* ... analog zu Style Card ... */}

      {/* Aspect Ratio Card */}
      {/* ... analog zu Style Card ... */}

      {/* Number of Images Card */}
      {/* ... analog zu Style Card ... */}
    </div>
  );
}
```

## Änderungen im Detail

### 1. Imports

```typescript
// ❌ Vorher: Keine Imports, alles hardcoded
const PRESET_OPTIONS = [/* ... */];

// ✅ Nachher: Import aus Config
import {
  PRESET_OPTIONS,
  IMAGE_STYLES,
  // ...
} from '@/config/imageSettings';
```

### 2. Types

```typescript
// ❌ Vorher: Lokale Interface Definition
export interface ImageSettingsType {
  preset?: string;
  style?: "photorealistic" | "cinematic" | /* ... */;
  // ...
}

// ✅ Nachher: Import aus Config
import type { ImageSettingsType, ImageSettingsProps } from '@/config/imageSettings';
```

### 3. Preset Defaults

```typescript
// ❌ Vorher: PRESET_DEFAULTS Object direkt in Component
const PRESET_DEFAULTS: { [key: string]: Partial<ImageSettingsType> } = {
  cinematic: {
    style: "cinematic",
    lighting: "dramatic",
    // ...
  },
  // ...
};

const presetDefaults = PRESET_DEFAULTS[presetId] || {};

// ✅ Nachher: getPresetDefaults Helper
import { getPresetDefaults } from '@/config/imageSettings';

const presetDefaults = getPresetDefaults(presetId as any) || {};
```

### 4. Array Names

Einige Arrays haben neue Namen für Konsistenz:

```typescript
// Vorher → Nachher
STYLE_OPTIONS → IMAGE_STYLES
LIGHTING_OPTIONS → LIGHTING_OPTIONS (unverändert)
QUALITY_OPTIONS → QUALITY_OPTIONS (unverändert)
ASPECT_RATIO_OPTIONS → ASPECT_RATIOS (oder alias verwenden)
NUM_IMAGES_OPTIONS → NUM_IMAGES_OPTIONS (unverändert)
```

### 5. Labels optimiert

Die Labels wurden auf Deutsch übersetzt und erweitert:

```typescript
// Vorher
{ value: "natural", label: "Natural" }

// Nachher
{ value: "natural", label: "Natürliches Licht" }
```

## Verwendung in anderen Components

### In ChatInput oder anderen Components:

```typescript
import {
  DEFAULT_IMAGE_SETTINGS,
  type ImageSettingsType
} from '@/config/imageSettings';

// Default Settings verwenden
const [imageSettings, setImageSettings] = useState<ImageSettingsType>(DEFAULT_IMAGE_SETTINGS);

// Settings updaten
setImageSettings({
  ...imageSettings,
  quality: 'ultra',
  aspectRatio: '16:9'
});
```

### Helper Functions verwenden:

```typescript
import {
  getQualityLabelShort,
  getStyleLabelShort,
  isPortraitRatio
} from '@/config/imageSettings';

// Kompakte Labels für UI
const qualityLabel = getQualityLabelShort(settings.quality); // "Ultra"
const styleLabel = getStyleLabelShort(settings.style); // "Foto"

// Orientation check
if (isPortraitRatio(settings.aspectRatio)) {
  console.log('Using portrait orientation');
}
```

## Vorteile der Migration

1. **Single Source of Truth**: Alle Konfigurationen an einem Ort
2. **Type Safety**: Vollständige TypeScript-Unterstützung
3. **Wiederverwendbarkeit**: Config kann überall importiert werden
4. **Wartbarkeit**: Änderungen nur an einem Ort notwendig
5. **Erweiterbarkeit**: Neue Optionen leicht hinzufügbar
6. **Dokumentation**: Zentrale README mit allen Optionen
7. **Helper Functions**: Praktische Hilfsfunktionen für häufige Aufgaben
8. **Deutsche Labels**: Bessere UX für deutschsprachige Nutzer

## Nächste Schritte

1. ✅ Config Files erstellt
2. ✅ Helper Functions implementiert
3. ✅ Types definiert
4. ✅ README geschrieben
5. ⏳ ImageSettings.tsx aktualisieren (mit obigem Code)
6. ⏳ Andere Components aktualisieren (ChatInput, etc.)
7. ⏳ Tests schreiben
8. ⏳ Alte hardcoded Arrays entfernen
