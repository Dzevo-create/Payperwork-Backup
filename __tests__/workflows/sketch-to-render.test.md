# Sketch-to-Render Workflow - Manual Test Checklist

**Version:** 2.0 (Refactored)
**Last Updated:** 18. Oktober 2025
**Status:** ✅ AKTIV

---

## 🎯 Test Overview

Diese Test-Suite validiert alle Funktionen des Sketch-to-Render Workflows nach dem Refactoring.

---

## ✅ Pre-Test Setup

### Environment
- [ ] Dev Server läuft (`npm run dev`)
- [ ] Browser geöffnet auf `http://localhost:3003/workflows/sketch-to-render`
- [ ] Browser DevTools Console geöffnet
- [ ] Keine Fehler in der Console beim Laden

### Test Data
- [ ] Test-Sketch vorhanden (Handzeichnung, CAD, einfaches Mockup)
- [ ] Optional: Reference Image

---

## 📋 Test Cases

### 1. Page Load & UI
**Priority:** HIGH

#### 1.1 Initial Page Load
- [ ] Page lädt ohne Fehler
- [ ] WorkflowPage component wird gerendert
- [ ] RenderSettings wird angezeigt
- [ ] Upload-Bereich ist sichtbar
- [ ] Generate Button ist disabled (kein Bild hochgeladen)

#### 1.2 Settings Panel
- [ ] **Space Type Dropdown** zeigt "Interior" und "Exterior"
- [ ] **Aspect Ratio Dropdown** funktioniert
- [ ] **Render Style Dropdown** funktioniert
- [ ] **Time of Day Dropdown** funktioniert
- [ ] **Quality Dropdown** funktioniert
- [ ] **Structure Fidelity Slider** (10-100%) funktioniert

**Expected Result:** Alle Settings funktionieren ohne Console-Fehler

---

### 2. Image Upload
**Priority:** HIGH

#### 2.1 Source Sketch Upload
- [ ] Click auf Upload-Bereich öffnet File-Dialog
- [ ] Sketch hochladen funktioniert
- [ ] Preview wird korrekt angezeigt
- [ ] Image-Crop Modal öffnet sich
- [ ] Crop funktioniert (Zoom, Pan)
- [ ] "Save Crop" speichert das Bild
- [ ] Generate Button wird enabled

#### 2.2 Reference Image Upload (Optional)
- [ ] Reference Image hochladen funktioniert
- [ ] Preview wird angezeigt
- [ ] Kann entfernt werden

**Expected Result:** Sketch und Reference Image werden korrekt hochgeladen

---

### 3. T-Button (Prompt Generator)
**Priority:** HIGH

#### 3.1 Sketch Analysis
- [ ] T-Button ist sichtbar
- [ ] Click auf T-Button startet Analyse
- [ ] Loading State wird angezeigt
- [ ] Prompt wird generiert (ca. 5-10 Sekunden)
- [ ] Prompt erscheint im Prompt-Input
- [ ] Prompt hat ca. 300-1000 Zeichen
- [ ] **Check Console:** Keine Fehler

#### 3.2 Prompt Quality
- [ ] Prompt beschreibt den Raum/Space
- [ ] Prompt enthält Architectural Details
- [ ] Prompt enthält Materials
- [ ] Prompt enthält Lighting
- [ ] Prompt ist kohärent und detailliert

**Expected Result:** T-Button generiert hilfreichen Sketch-Analyse-Prompt

---

### 4. Prompt Enhancement
**Priority:** MEDIUM

#### 4.1 Manual Prompt + T-Button
- [ ] User Prompt eingeben (z.B. "modern office space")
- [ ] T-Button klicken
- [ ] Prompt wird enhanced/erweitert
- [ ] Original User Intent bleibt erhalten
- [ ] Zusätzliche Details werden hinzugefügt

**Expected Result:** Prompt Enhancement funktioniert

---

### 5. Image Generation
**Priority:** CRITICAL

#### 5.1 Basic Generation
- [ ] Prompt eingeben (oder T-Button verwenden)
- [ ] Settings konfigurieren
- [ ] "Generate" Button klicken
- [ ] Loading State angezeigt
- [ ] Progress updates (0% → 100%)
- [ ] Image wird generiert (ca. 10-15 Sekunden)
- [ ] Generated Image erscheint in Result Panel
- [ ] **Check Console:** Keine Fehler

#### 5.2 With Reference Image
**Setup:**
- Source: Sketch
- Reference: Photorealistic Image
- Prompt: "Convert to photorealistic render"

- [ ] Image wird generiert
- [ ] Generated Image ähnelt Reference Style
- [ ] Sketch Structure wurde beibehalten

#### 5.3 Structure Fidelity Variations
**Test mit verschiedenen Fidelity Levels:**

| Fidelity | Expected Behavior |
|----------|-------------------|
| 100% | Exakte Structure, nur Materials ändern |
| 70% | Gleiche Grundstruktur, Details variieren |
| 30% | Nur Inspiration, große Freiheiten |

- [ ] 100% Fidelity: Structure wird exakt beibehalten
- [ ] 70% Fidelity: Balance zwischen Structure & Creativity
- [ ] 30% Fidelity: Mehr kreative Freiheit

**Expected Result:** Sketch wird korrekt in Photorealistic Render konvertiert

---

### 6. Post-Generation Actions
**Priority:** MEDIUM

#### 6.1 Lightbox
- [ ] Click auf Generated Image öffnet Lightbox
- [ ] **Source Sketch** wird links angezeigt
- [ ] **Generated Render** wird rechts angezeigt
- [ ] Comparison Mode funktioniert
- [ ] Navigation Pfeile funktionieren
- [ ] Zoom funktioniert
- [ ] Close funktioniert

#### 6.2 Save Generation
- [ ] Generation wird automatisch gespeichert
- [ ] Erscheint in Recent Generations
- [ ] **Check Database:**
  - `type: 'render'`
  - `model: 'nano-banana'`
  - `name: 'payperwork-sketchtorender-YYYYMMDD-HHMMSS-XXXX'`

#### 6.3 Upscale
- [ ] "Upscale" Button klicken
- [ ] Upscale startet
- [ ] Upscaled Image wird generiert
- [ ] Higher resolution als Original

#### 6.4 Edit
- [ ] "Edit" Button klicken
- [ ] Edit Prompt eingeben (z.B. "add more plants")
- [ ] Edited Image wird generiert
- [ ] Changes sind sichtbar

#### 6.5 Video Generation (Runway)
- [ ] "Generate Video" Button klicken
- [ ] Camera Movement wählen
- [ ] Video wird generiert (ca. 30-60 Sekunden)
- [ ] Video wird abspielbar
- [ ] Video zeigt smooth camera movement

**Expected Result:** Alle Post-Generation Actions funktionieren

---

### 7. Recent Generations Gallery
**Priority:** MEDIUM

#### 7.1 Display
- [ ] Recent Generations werden geladen
- [ ] Thumbnails werden korrekt angezeigt
- [ ] Generation Name wird angezeigt
- [ ] Timestamp wird angezeigt

#### 7.2 Interactions
- [ ] Click auf Thumbnail öffnet Lightbox
- [ ] Delete Button funktioniert
- [ ] Load More funktioniert (falls viele Generations)

**Expected Result:** Gallery funktioniert korrekt

---

### 8. Error Handling
**Priority:** HIGH

#### 8.1 No Sketch Uploaded
- [ ] Generate ohne Sketch → Error Message
- [ ] T-Button ohne Sketch → Error Message

#### 8.2 API Errors
**Simulate:** Disconnect Internet
- [ ] Generation failed → Error Message angezeigt
- [ ] User-friendly Error Text
- [ ] Retry möglich

#### 8.3 Invalid Prompts
- [ ] Test mit sehr langem Prompt (>2000 chars)
- [ ] Test mit leerem Prompt
- [ ] Sinnvolle Validierung

**Expected Result:** Errors werden graceful behandelt

---

## 🔍 Integration Tests

### 9. Complete User Flow
**Priority:** CRITICAL

#### End-to-End Happy Path
1. [ ] Page öffnen
2. [ ] Sketch hochladen & croppen
3. [ ] Reference Image hochladen (optional)
4. [ ] Settings konfigurieren
5. [ ] T-Button klicken → Prompt generiert
6. [ ] Generate klicken → Render generiert
7. [ ] Lightbox öffnen → Sketch + Render Comparison
8. [ ] Upscale klicken → Upscaled Render generiert
9. [ ] Video generieren → Runway Video erstellt
10. [ ] Recent Generations prüfen → Alle gespeichert

**Expected Duration:** ca. 3-5 Minuten
**Expected Result:** ✅ Complete flow funktioniert ohne Fehler

---

## 📊 Performance Tests

### 10. Performance Metrics
**Priority:** MEDIUM

#### 10.1 Load Time
- [ ] Page Load < 3 Sekunden
- [ ] Settings Load < 1 Sekunde
- [ ] Recent Generations Load < 2 Sekunden

#### 10.2 Generation Time
- [ ] T-Button Generation: 5-15 Sekunden
- [ ] Image Generation: 10-20 Sekunden
- [ ] Upscale: 20-40 Sekunden
- [ ] Video Generation: 30-90 Sekunden

#### 10.3 UI Responsiveness
- [ ] Keine UI Freezes während Generation
- [ ] Progress Updates smooth
- [ ] Interactions bleiben responsive

**Expected Result:** Performance ist acceptable

---

## 🐛 Known Issues

### Issues to Watch For
- [ ] **Complex Sketches:** Sehr detaillierte Sketches können länger dauern
- [ ] **Large Files:** Sketches >10MB könnten langsam hochladen
- [ ] **Video Generation:** Runway kann manchmal timeout haben

---

## ✅ Test Summary

### Must Pass (Critical)
- [ ] T-Button generiert Prompts
- [ ] Sketch-to-Render Generation funktioniert
- [ ] Structure Fidelity wird respektiert
- [ ] Keine Console Errors
- [ ] Complete User Flow funktioniert

### Should Pass (Important)
- [ ] All Settings funktionieren
- [ ] Reference Image Integration funktioniert
- [ ] Lightbox Comparison funktioniert
- [ ] Recent Generations funktionieren
- [ ] Error Handling funktioniert

### Nice to Have
- [ ] Performance ist gut
- [ ] Video Generation funktioniert
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
