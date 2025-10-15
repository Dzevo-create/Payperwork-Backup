# Image Settings Configuration

Zentrale Konfiguration für alle Bildgenerierungs-Einstellungen der Anwendung.

## Struktur

```
config/imageSettings/
├── index.ts          # Haupt-Export-Datei
├── types.ts          # TypeScript Type Definitions
├── presets.ts        # Vordefinierte Presets (Cinematic, Portrait, etc.)
├── styles.ts         # Bildstile (Photorealistic, Artistic, etc.)
├── lighting.ts       # Beleuchtungsoptionen (Natural, Studio, etc.)
├── aspectRatios.ts   # Seitenverhältnisse (1:1, 16:9, etc.)
├── quality.ts        # Qualitätsstufen (Standard, High, Ultra)
├── numImages.ts      # Anzahl der zu generierenden Bilder (1-4)
└── README.md         # Diese Datei
```

## Verwendung

### Basic Import

```typescript
import {
  IMAGE_PRESETS,
  IMAGE_STYLES,
  LIGHTING_OPTIONS,
  ASPECT_RATIOS,
  QUALITY_OPTIONS,
  NUM_IMAGES_OPTIONS,
  DEFAULT_IMAGE_SETTINGS
} from '@/config/imageSettings';
```

### Types Import

```typescript
import type {
  ImageSettingsType,
  ImageSettingsProps,
  ImageStyleValue,
  LightingValue,
  AspectRatioValue,
  QualityValue,
  NumImagesValue
} from '@/config/imageSettings';
```

### Verwendungsbeispiele

#### 1. Preset anwenden

```typescript
import { IMAGE_PRESETS, getPresetDefaults } from '@/config/imageSettings';

// Preset auswählen
const presetKey = 'cinematic';
const defaults = getPresetDefaults(presetKey);

// Settings aktualisieren
setSettings({
  ...settings,
  preset: presetKey,
  ...defaults
});
```

#### 2. Dropdown-Optionen rendern

```typescript
import { IMAGE_STYLES } from '@/config/imageSettings';

// Style-Dropdown
{IMAGE_STYLES.map((style) => (
  <option key={style.value || 'auto'} value={style.value}>
    {style.label}
  </option>
))}
```

#### 3. Label abrufen

```typescript
import {
  getStyleLabel,
  getLightingLabel,
  getQualityLabel,
  getAspectRatioLabel
} from '@/config/imageSettings';

// Kurze Labels für kompakte UI
const styleLabel = getStyleLabelShort(settings.style); // "Foto"
const qualityLabel = getQualityLabelShort(settings.quality); // "Ultra"
```

#### 4. Aspect Ratio Helpers

```typescript
import {
  isPortraitRatio,
  isLandscapeRatio,
  isSquareRatio,
  getAspectRatioDimensions
} from '@/config/imageSettings';

if (isPortraitRatio(settings.aspectRatio)) {
  console.log('Portrait orientation');
}

const { width, height } = getAspectRatioDimensions(settings.aspectRatio);
```

## Konfigurationsdetails

### Presets

| Preset | Style | Lighting | Quality | Aspect Ratio |
|--------|-------|----------|---------|--------------|
| Keine Vorgabe | Auto | Auto | - | - |
| Cinematic 🎬 | Cinematic | Dramatic | Ultra | 21:9 |
| Portrait 📸 | Photorealistic | Soft | Ultra | 3:2 |
| Landscape 🏞️ | Photorealistic | Natural | Ultra | 16:9 |
| Product 📦 | Photorealistic | Studio | Ultra | 1:1 |
| Artistic 🎨 | Artistic | Dramatic | High | 16:9 |
| Night Scene 🌃 | Cinematic | Neon | Ultra | 16:9 |

### Styles

- **Auto**: Enhancer wählt automatisch
- **Fotorealistisch**: Realistische Fotografie
- **Cinematic**: Filmischer Look
- **Künstlerisch**: Künstlerische Interpretation
- **Anime**: Anime-Stil
- **3D Render**: 3D-gerenderte Optik

### Lighting

- **Auto**: Enhancer wählt automatisch
- **Natürliches Licht**: Tageslicht, outdoor
- **Studio-Beleuchtung**: Professionelle Studio-Beleuchtung
- **Dramatisch**: Kontrastreiche, dramatische Beleuchtung
- **Golden Hour**: Warmes Sonnenauf-/untergang-Licht
- **Neon**: Neon-Beleuchtung für urbane Szenen
- **Weiches Licht**: Diffuses, sanftes Licht

### Quality

- **Standard**: Schnelle Generierung, gute Qualität
- **High**: Ausgewogene Qualität und Geschwindigkeit
- **Ultra**: Höchste Qualität, längere Generierung

### Aspect Ratios

- **1:1** - Quadrat (Social Media Posts)
- **16:9** - Landscape (Standard Widescreen)
- **9:16** - Portrait (Stories & Reels)
- **4:3** - Klassisch (TV-Format)
- **3:2** - Foto (Standard Fotoformat)
- **21:9** - Cinematic (Ultra-Wide Kinoformat)

## Type Safety

Alle Konfigurationen verwenden TypeScript `as const` für maximale Type Safety:

```typescript
// ✅ Type-safe
const style: ImageStyleValue = 'photorealistic';

// ❌ Type error
const style: ImageStyleValue = 'invalid-style';
```

## Migration von ImageSettings.tsx

Die ursprüngliche `ImageSettings.tsx` verwendete hardcoded Arrays. Diese wurden extrahiert in:

1. **Konfigurationen** → Separate Config Files
2. **Helper Functions** → In jeweiligen Config Files
3. **Types** → `types.ts`
4. **Default Values** → `DEFAULT_IMAGE_SETTINGS` in `index.ts`

### Aktualisierung der Component

```typescript
// Vorher
const PRESET_OPTIONS = [/* ... */];

// Nachher
import { PRESET_OPTIONS } from '@/config/imageSettings';
```

## Erweiterung

Um neue Optionen hinzuzufügen:

1. **Neue Option zur Config hinzufügen**:
   ```typescript
   // In entsprechender Config-Datei
   export const MY_OPTIONS = [
     { value: 'new', label: 'Neu' },
     // ...
   ] as const;
   ```

2. **Type aktualisieren**:
   ```typescript
   export type MyOptionValue = 'new' | 'existing';
   ```

3. **Helper Functions hinzufügen** (optional):
   ```typescript
   export const getMyOptionLabel = (value: MyOptionValue): string => {
     // ...
   };
   ```

4. **In index.ts exportieren**:
   ```typescript
   export * from './myOptions';
   ```

## Best Practices

1. **Immer `as const` verwenden** für Type Safety
2. **Helper Functions bereitstellen** für häufige Operationen
3. **Deutsche Labels** für User-Interface
4. **Descriptions hinzufügen** wo sinnvoll
5. **Type-Exports zentralisieren** in `index.ts`

## Wartung

Bei Änderungen an den Konfigurationen:

1. Config-Datei aktualisieren
2. Types bei Bedarf anpassen
3. Helper Functions aktualisieren
4. README.md aktualisieren (diese Datei)
5. Components aktualisieren, die die Config verwenden
