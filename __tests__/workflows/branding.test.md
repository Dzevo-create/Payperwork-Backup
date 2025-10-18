# Branding Workflow - Manual Test Checklist

**Version:** 2.0 (Refactored)
**Last Updated:** 18. Oktober 2025
**Status:** ✅ AKTIV

---

## 🎯 Test Overview

Diese Test-Suite validiert alle Funktionen des Branding Workflows nach dem Refactoring.

---

## ✅ Pre-Test Setup

### Environment
- [ ] Dev Server läuft (`npm run dev`)
- [ ] Browser geöffnet auf `http://localhost:3003/workflows/branding`
- [ ] Browser DevTools Console geöffnet
- [ ] Keine Fehler in der Console beim Laden

### Test Data
- [ ] Test-Bild vorhanden (Interior oder Exterior Space)
- [ ] Brand ausgewählt (z.B. "Nike", "Rolex", "Apple")

---

## 📋 Test Cases

### 1. Page Load & UI
**Priority:** HIGH

#### 1.1 Initial Page Load
- [ ] Page lädt ohne Fehler
- [ ] WorkflowPage component wird gerendert
- [ ] BrandingSettings wird angezeigt
- [ ] Upload-Bereich ist sichtbar
- [ ] Generate Button ist disabled (kein Bild hochgeladen)

#### 1.2 Settings Panel
- [ ] **Space Type Dropdown** zeigt "Interior" und "Exterior"
- [ ] **Aspect Ratio Dropdown** funktioniert
- [ ] **Venue Type Dropdown** zeigt alle Optionen (scrollable)
- [ ] **Brand Dropdown** ist durchsuchbar und scrollable
- [ ] **Render Style Dropdown** funktioniert
- [ ] **Time of Day Dropdown** funktioniert
- [ ] **Empty Space Toggle** funktioniert (Leer ✓ / Füllen)
- [ ] **Quality Dropdown** funktioniert
- [ ] **Structure Fidelity Slider** (10-100%) funktioniert

**Expected Result:** Alle Settings funktionieren ohne Console-Fehler

---

### 2. Image Upload
**Priority:** HIGH

#### 2.1 Source Image Upload
- [ ] Click auf Upload-Bereich öffnet File-Dialog
- [ ] Bild hochladen funktioniert
- [ ] Preview wird korrekt angezeigt
- [ ] Image-Crop Modal öffnet sich
- [ ] Crop funktioniert (Zoom, Pan)
- [ ] "Save Crop" speichert das Bild
- [ ] Generate Button wird enabled

#### 2.2 Reference Image Upload (Optional)
- [ ] Reference Image hochladen funktioniert
- [ ] Preview wird angezeigt
- [ ] Kann entfernt werden

**Expected Result:** Bilder werden korrekt hochgeladen und angezeigt

---

### 3. T-Button (Prompt Generator)
**Priority:** CRITICAL

#### 3.1 Without Brand
- [ ] T-Button ist sichtbar
- [ ] Click auf T-Button startet Generierung
- [ ] Loading State wird angezeigt
- [ ] Prompt wird generiert (ca. 5-10 Sekunden)
- [ ] Prompt erscheint im Prompt-Input
- [ ] Prompt hat ca. 500-1500 Zeichen
- [ ] **Check Console:** Keine Fehler

#### 3.2 With Brand Selected
- [ ] Brand auswählen (z.B. "Migros", "Nike")
- [ ] T-Button klicken
- [ ] Prompt wird generiert
- [ ] Prompt enthält **Brand-spezifische Details:**
  - Brand Name
  - Brand Colors
  - Brand Materials
  - Brand Atmosphere
- [ ] **Check Server Logs:**
  ```
  ✅ isBranding: true
  ✅ Branding T-Button: Starting prompt generation
  ✅ Brand Intelligence: Analysis complete
  ✅ Branding T-Button: Success
  ```

#### 3.3 Prompt Quality
- [ ] Prompt ist **flowing text** (keine Listen)
- [ ] Prompt startet mit: "Exact same camera angle and perspective as source..."
- [ ] Prompt enthält **5-7 Möbelstücke**
- [ ] Prompt enthält **3-4 Dekorations-Elemente**
- [ ] Prompt enthält **2-3 Lichtquellen**
- [ ] Prompt beschreibt **Atmosphere/Feeling**
- [ ] **KEIN Markdown** (keine **, _, #)

**Expected Result:** T-Button generiert detaillierten, brand-spezifischen Prompt

---

### 4. Image Generation
**Priority:** HIGH

#### 4.1 Basic Generation
- [ ] Prompt eingeben (oder T-Button verwenden)
- [ ] Settings konfigurieren
- [ ] "Generate" Button klicken
- [ ] Loading State angezeigt
- [ ] Progress updates (0% → 100%)
- [ ] Image wird generiert (ca. 10-15 Sekunden)
- [ ] Generated Image erscheint in Result Panel
- [ ] **Check Console:** Keine Fehler

#### 4.2 With Brand Settings
**Settings:**
- Brand: "Rolex"
- Venue Type: "Retail"
- Render Style: "Hyperrealistic"
- Time of Day: "Morning"
- Empty Space: "Füllen"

- [ ] Image wird generiert
- [ ] Image zeigt brand-spezifische Elemente
- [ ] Image ist photorealistic
- [ ] Camera Angle wurde beibehalten

**Expected Result:** Branded Space Rendering wird korrekt generiert

---

### 5. Post-Generation Actions
**Priority:** MEDIUM

#### 5.1 Lightbox
- [ ] Click auf Generated Image öffnet Lightbox
- [ ] **Source Image** wird links angezeigt
- [ ] **Generated Image** wird rechts angezeigt
- [ ] Navigation Pfeile funktionieren
- [ ] Zoom funktioniert
- [ ] Close funktioniert

#### 5.2 Save Generation
- [ ] Generation wird automatisch in Recent Generations gespeichert
- [ ] Thumbnail erscheint in Gallery
- [ ] **Check Database:** Generation wurde gespeichert
  - `type: 'render'`
  - `model: 'nano-banana'`
  - `name: 'payperwork-branding-YYYYMMDD-HHMMSS-XXXX'`

#### 5.3 Upscale
- [ ] "Upscale" Button klicken
- [ ] Upscale startet
- [ ] Upscaled Image wird generiert (ca. 20-30 Sekunden)
- [ ] Upscaled Image erscheint in Recent Generations
- [ ] **Check:** Upscaled Image hat höhere Auflösung

#### 5.4 Edit
- [ ] "Edit" Button klicken
- [ ] Edit Prompt eingeben
- [ ] Edited Image wird generiert
- [ ] Changes sind sichtbar

**Expected Result:** Alle Post-Generation Actions funktionieren

---

### 6. Recent Generations Gallery
**Priority:** MEDIUM

#### 6.1 Display
- [ ] Recent Generations werden geladen
- [ ] Thumbnails werden korrekt angezeigt
- [ ] Generation Name wird angezeigt
- [ ] Timestamp wird angezeigt

#### 6.2 Interactions
- [ ] Click auf Thumbnail öffnet Lightbox
- [ ] Delete Button funktioniert
- [ ] Filter funktioniert (falls vorhanden)

**Expected Result:** Gallery funktioniert korrekt

---

### 7. Error Handling
**Priority:** HIGH

#### 7.1 No Image Uploaded
- [ ] Generate ohne Image → Error Message
- [ ] T-Button ohne Image → Error Message

#### 7.2 API Errors
**Simulate:** Disconnect Internet
- [ ] Generation failed → Error Message angezeigt
- [ ] User-friendly Error Text
- [ ] Retry möglich

#### 7.3 Invalid Settings
- [ ] Test mit extremen Settings-Kombinationen
- [ ] Keine Crashes
- [ ] Sinnvolle Fallbacks

**Expected Result:** Errors werden graceful behandelt

---

## 🔍 Integration Tests

### 8. Complete User Flow
**Priority:** CRITICAL

#### End-to-End Happy Path
1. [ ] Page öffnen
2. [ ] Source Image hochladen & croppen
3. [ ] Brand auswählen (z.B. "Nike")
4. [ ] Settings konfigurieren
5. [ ] T-Button klicken → Prompt generiert
6. [ ] Generate klicken → Image generiert
7. [ ] Lightbox öffnen → Source + Result angezeigt
8. [ ] Upscale klicken → Upscaled Image generiert
9. [ ] Recent Generations prüfen → Alle Generations gespeichert

**Expected Duration:** ca. 2-3 Minuten
**Expected Result:** ✅ Complete flow funktioniert ohne Fehler

---

## 📊 Performance Tests

### 9. Performance Metrics
**Priority:** MEDIUM

#### 9.1 Load Time
- [ ] Page Load < 3 Sekunden
- [ ] Settings Load < 1 Sekunde
- [ ] Recent Generations Load < 2 Sekunden

#### 9.2 Generation Time
- [ ] T-Button Generation: 5-15 Sekunden
- [ ] Image Generation: 10-20 Sekunden
- [ ] Upscale: 20-40 Sekunden

#### 9.3 UI Responsiveness
- [ ] Keine UI Freezes während Generation
- [ ] Progress Updates smooth
- [ ] Interactions bleiben responsive

**Expected Result:** Performance ist acceptable

---

## 🐛 Known Issues

### Issues to Watch For
- [ ] **GPT-4o Content Policy:** Manche Gebäude-Bilder könnten abgelehnt werden
- [ ] **Image Upload Size:** Sehr große Bilder (>10MB) könnten langsam sein
- [ ] **Brand Cache:** Erste Brand-Analyse kann länger dauern

---

## ✅ Test Summary

### Must Pass (Critical)
- [ ] T-Button generiert Prompts
- [ ] Image Generation funktioniert
- [ ] Branding-spezifische Features arbeiten korrekt
- [ ] Keine Console Errors
- [ ] Complete User Flow funktioniert

### Should Pass (Important)
- [ ] All Settings funktionieren
- [ ] Lightbox funktioniert
- [ ] Recent Generations funktionieren
- [ ] Error Handling funktioniert

### Nice to Have
- [ ] Performance ist gut
- [ ] UI ist smooth
- [ ] Mobile responsive (falls applicable)

---

## 📝 Test Notes

**Tester:**
**Date:**
**Environment:** Dev / Staging / Production
**Browser:** Chrome / Firefox / Safari

### Issues Found:


### Additional Comments:


---

## 🚀 Sign-Off

**All Critical Tests Passed:** ☐ YES ☐ NO
**Ready for Production:** ☐ YES ☐ NO

**Approved By:**
**Date:**
