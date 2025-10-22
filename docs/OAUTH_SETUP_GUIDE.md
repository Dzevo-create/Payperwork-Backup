# OAuth Setup Guide: Google & Apple Login

Diese Anleitung zeigt dir, wie du Google und Apple OAuth für deine Payperwork-App in Supabase konfigurierst.

## 🎯 Übersicht

Die App unterstützt jetzt drei Login-Methoden:

1. **E-Mail/Passwort** - Standard-Authentifizierung
2. **Google OAuth** - Login mit Google-Konto
3. **Apple OAuth** - Login mit Apple ID

---

## 🔧 Setup: Google OAuth

### 1. Google Cloud Console Setup

1. Gehe zu [Google Cloud Console](https://console.cloud.google.com/)
2. Erstelle ein neues Projekt oder wähle ein bestehendes
3. Navigiere zu **APIs & Services** → **Credentials**
4. Klicke auf **Create Credentials** → **OAuth client ID**
5. Wähle **Application type**: Web application
6. Konfiguriere:
   - **Name**: Payperwork
   - **Authorized JavaScript origins**:
     - `https://<your-project>.supabase.co`
     - `http://localhost:3000` (für Entwicklung)
   - **Authorized redirect URIs**:
     - `https://<your-project>.supabase.co/auth/v1/callback`
     - `http://localhost:3000/auth/callback` (für Entwicklung)

7. Klicke auf **Create**
8. Kopiere **Client ID** und **Client Secret**

### 2. Supabase Setup

1. Gehe zu deinem Supabase-Projekt Dashboard
2. Navigiere zu **Authentication** → **Providers**
3. Finde **Google** in der Liste
4. Aktiviere Google Provider
5. Füge ein:
   - **Client ID** (von Google Cloud Console)
   - **Client Secret** (von Google Cloud Console)
6. Klicke auf **Save**

### 3. Test

1. Starte deine App: `npm run dev`
2. Gehe zu `/auth/login`
3. Klicke auf "Mit Google anmelden"
4. Du wirst zu Google OAuth weitergeleitet
5. Nach erfolgreicher Anmeldung wirst du zu `/chat` weitergeleitet

---

## 🍎 Setup: Apple OAuth

### 1. Apple Developer Account Setup

> **Wichtig**: Du benötigst ein Apple Developer Programm Mitgliedschaft ($99/Jahr)

1. Gehe zu [Apple Developer Portal](https://developer.apple.com/)
2. Navigiere zu **Certificates, Identifiers & Profiles**
3. Wähle **Identifiers** → **App IDs**
4. Klicke auf **+** (Create New)
5. Wähle **App IDs** und **App** als Type
6. Konfiguriere:
   - **Description**: Payperwork
   - **Bundle ID**: `com.payperwork.app` (oder deine Domain)
   - **Capabilities**: Aktiviere **Sign In with Apple**

### 2. Services ID erstellen

1. Gehe zurück zu **Identifiers**
2. Klicke auf **+** und wähle **Services IDs**
3. Konfiguriere:
   - **Description**: Payperwork Web
   - **Identifier**: `com.payperwork.web`
   - Aktiviere **Sign In with Apple**
   - Klicke auf **Configure**

4. Im Configuration Dialog:
   - **Primary App ID**: Wähle deine App ID
   - **Domains and Subdomains**:
     - `<your-project>.supabase.co`
   - **Return URLs**:
     - `https://<your-project>.supabase.co/auth/v1/callback`

5. Klicke auf **Save** und **Continue**

### 3. Private Key erstellen

1. Gehe zu **Keys**
2. Klicke auf **+** (Create New)
3. Konfiguriere:
   - **Key Name**: Payperwork Sign In with Apple
   - Aktiviere **Sign In with Apple**
   - Klicke auf **Configure** und wähle deine Primary App ID
4. Klicke auf **Continue** und **Register**
5. **Download** die `.p8` Key-Datei
   - ⚠️ **WICHTIG**: Diese Datei kann nur einmal heruntergeladen werden!
   - Notiere die **Key ID** (10 Zeichen)

### 4. Team ID finden

1. Gehe zu [Apple Developer Membership](https://developer.apple.com/account/#/membership/)
2. Kopiere deine **Team ID** (10 Zeichen)

### 5. Supabase Setup

1. Gehe zu deinem Supabase-Projekt Dashboard
2. Navigiere zu **Authentication** → **Providers**
3. Finde **Apple** in der Liste
4. Aktiviere Apple Provider
5. Füge ein:
   - **Services ID** (z.B. `com.payperwork.web`)
   - **Team ID** (von Apple Developer)
   - **Key ID** (von der erstellten Key)
   - **Private Key**: Öffne die `.p8`-Datei in einem Texteditor und kopiere den gesamten Inhalt (inkl. `-----BEGIN PRIVATE KEY-----` und `-----END PRIVATE KEY-----`)

6. Klicke auf **Save**

### 6. Test

1. Starte deine App: `npm run dev`
2. Gehe zu `/auth/login`
3. Klicke auf "Mit Apple anmelden"
4. Du wirst zu Apple OAuth weitergeleitet
5. Nach erfolgreicher Anmeldung wirst du zu `/chat` weitergeleitet

---

## 🔍 Troubleshooting

### Google OAuth Fehler

**Problem**: "redirect_uri_mismatch"

- **Lösung**: Stelle sicher, dass die Redirect URI in Google Cloud Console **exakt** mit der Supabase URL übereinstimmt
- Format: `https://<your-project>.supabase.co/auth/v1/callback`

**Problem**: "access_denied"

- **Lösung**: Überprüfe, dass die Google APIs aktiviert sind
- Gehe zu **APIs & Services** → **Library** und suche nach "Google+ API"

### Apple OAuth Fehler

**Problem**: "invalid_client"

- **Lösung**: Überprüfe, dass Services ID, Team ID und Key ID korrekt sind
- Stelle sicher, dass der Private Key vollständig kopiert wurde

**Problem**: "invalid_request"

- **Lösung**: Überprüfe die Redirect URL in Apple Developer Portal
- Format: `https://<your-project>.supabase.co/auth/v1/callback`

### Allgemeine Fehler

**Problem**: OAuth funktioniert lokal nicht

- **Lösung**: OAuth funktioniert nur mit HTTPS. Für lokale Entwicklung:
  - Verwende `ngrok` oder `localtunnel` für HTTPS-Tunnel
  - ODER teste nur auf Staging/Production

**Problem**: Nach OAuth Redirect erscheint "Unauthorized"

- **Lösung**: Überprüfe, dass die RLS-Policies für OAuth-User funktionieren
- OAuth-User haben keine `email_verified` Flag standardmäßig

---

## 📝 Environment Variables

Keine zusätzlichen Environment Variables benötigt! Alle OAuth-Konfigurationen werden in Supabase gespeichert.

Die bestehenden Supabase-Variablen reichen aus:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

---

## ✅ Checkliste: OAuth Setup abgeschlossen

### Google OAuth

- [ ] Google Cloud Project erstellt
- [ ] OAuth Client ID konfiguriert
- [ ] Redirect URIs hinzugefügt
- [ ] Client ID & Secret in Supabase eingetragen
- [ ] Google Login getestet

### Apple OAuth

- [ ] Apple Developer Account aktiv
- [ ] App ID erstellt mit Sign In with Apple
- [ ] Services ID erstellt und konfiguriert
- [ ] Private Key (.p8) heruntergeladen
- [ ] Team ID notiert
- [ ] Services ID, Team ID, Key ID & Private Key in Supabase eingetragen
- [ ] Apple Login getestet

### Testing

- [ ] OAuth funktioniert auf Staging/Production
- [ ] Redirect zu `/chat` funktioniert
- [ ] User-Daten werden korrekt gespeichert
- [ ] RLS-Policies erlauben OAuth-User Zugriff

---

## 🎨 UI Features

Die neuen Login/Signup-Seiten bieten:

✨ **Modernes Design**:

- Glassmorphism-Effekt mit Backdrop-Blur
- Dark theme mit Gradient-Hintergrund
- Payperwork Logo prominent angezeigt
- Responsive für Mobile & Desktop

🔘 **Social Login Buttons**:

- Google Button mit offiziellem Logo
- Apple Button mit Apple-Symbol
- Loading-States während OAuth
- Disabled-States für bessere UX

📱 **User Experience**:

- "Oder mit E-Mail" Divider
- Fehlerbehandlung mit schönen Error-Messages
- Erfolgs-Screen nach Registrierung
- "Passwort vergessen?" Link
- "Jetzt registrieren" / "Jetzt anmelden" Links

---

## 🚀 Production Deployment

Vor dem Go-Live:

1. **Google OAuth**:
   - Füge Production-Domain zu Authorized Origins hinzu
   - Füge Production-Redirect-URI hinzu
   - Teste auf Production-Domain

2. **Apple OAuth**:
   - Füge Production-Domain zu Domains and Subdomains hinzu
   - Füge Production-Return-URL hinzu
   - Teste auf Production-Domain

3. **Supabase**:
   - Überprüfe, dass Site URL korrekt ist (Settings → General)
   - Füge Redirect URLs zur Allowlist hinzu (Settings → Auth → URL Configuration)

---

## 📚 Weitere Ressourcen

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Apple Sign In Documentation](https://developer.apple.com/sign-in-with-apple/)
- [Next.js Authentication Guide](https://nextjs.org/docs/authentication)

---

**Status**: OAuth Integration Complete ✅

Erstellt: $(date)
Letzte Aktualisierung: $(date)
