# Slides Feature

## Overview

AI-powered presentation generation using Manus API integrated into the Payperwork platform.

## Features

- ✅ AI-generated slides from text prompts
- ✅ 3 formats: 16:9 (Widescreen), 4:3 (Standard), A4 (Document)
- ✅ 8 Shadcn UI themes (default, red, rose, orange, green, blue, yellow, violet)
- ✅ Real-time updates via WebSocket
- ✅ Export to PDF & PPTX
- ✅ 5 slide layouts (title_slide, content, two_column, quote, image)
- ✅ Markdown support in slide content
- ✅ Speaker notes support
- ✅ Comprehensive CRUD API

## Architecture

```
User → Frontend → API → Manus API
                   ↓
              Database (Supabase)
                   ↓
              Webhook ← Manus
                   ↓
              WebSocket → Frontend
```

## API Endpoints

### POST /api/slides/generate
Create new presentation

**Request:**
```json
{
  "prompt": "Create a presentation about AI in 2025",
  "format": "16:9",
  "theme": "blue"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "presentation_id": "uuid",
    "task_id": "task_abc123",
    "status": "generating"
  }
}
```

### GET /api/slides
Get all presentations for authenticated user

**Query Parameters:**
- `limit` (number, default: 20, max: 100)
- `offset` (number, default: 0)
- `status` (string, optional: "generating" | "ready" | "error")

**Response:**
```json
{
  "success": true,
  "data": {
    "presentations": [
      {
        "id": "uuid",
        "title": "AI in 2025",
        "status": "ready",
        "format": "16:9",
        "theme": "blue",
        "created_at": "2025-01-01T00:00:00Z",
        "updated_at": "2025-01-01T00:00:00Z"
      }
    ]
  }
}
```

### GET /api/slides/[id]
Get presentation details with all slides

**Response:**
```json
{
  "success": true,
  "data": {
    "presentation": { ... },
    "slides": [
      {
        "id": "slide-1",
        "title": "Welcome",
        "content": "# Welcome\n\n...",
        "layout": "title_slide",
        "order_index": 0,
        "speaker_notes": "Introduction notes",
        "background_color": "#eff6ff",
        "created_at": "2025-01-01T00:00:00Z"
      }
    ]
  }
}
```

### PATCH /api/slides/[id]
Update presentation metadata

**Request:**
```json
{
  "title": "Updated Title",
  "theme": "red",
  "format": "4:3"
}
```

### DELETE /api/slides/[id]
Delete presentation (CASCADE deletes all slides)

**Response:**
```json
{
  "success": true,
  "message": "Presentation deleted successfully"
}
```

### POST /api/slides/manus-webhook
Webhook handler for Manus API task completion

**Headers:**
- `x-manus-signature`: HMAC SHA256 signature (verified if MANUS_WEBHOOK_SECRET is set)

**Request:**
```json
{
  "event_type": "task_stopped",
  "task_id": "task_abc123",
  "stop_reason": "finish",
  "attachments": [...]
}
```

### PATCH /api/slides/[id]/slides/[slideId]
Update individual slide

**Request:**
```json
{
  "title": "Updated Slide Title",
  "content": "Updated content",
  "layout": "content",
  "speaker_notes": "Updated notes"
}
```

### DELETE /api/slides/[id]/slides/[slideId]
Delete individual slide (auto-reorders remaining slides)

## Database Schema

### presentations
- `id` (uuid, primary key)
- `user_id` (text, foreign key)
- `task_id` (text, nullable)
- `title` (text, default: "Untitled Presentation")
- `prompt` (text)
- `format` (text: "16:9" | "4:3" | "A4")
- `theme` (text: "default" | "red" | "rose" | "orange" | "green" | "blue" | "yellow" | "violet")
- `status` (text: "generating" | "ready" | "error", default: "generating")
- `created_at` (timestamp with time zone)
- `updated_at` (timestamp with time zone)

**Indexes:**
- `presentations_user_id_idx` on (user_id)
- `presentations_status_idx` on (status)
- `presentations_created_at_idx` on (created_at DESC)

**RLS Policies:**
- Users can only view/update/delete their own presentations

### slides
- `id` (uuid, primary key)
- `presentation_id` (uuid, foreign key → presentations.id ON DELETE CASCADE)
- `order_index` (integer)
- `title` (text)
- `content` (text)
- `layout` (text: "title_slide" | "content" | "two_column" | "image" | "quote")
- `background_color` (text, nullable)
- `background_image` (text, nullable)
- `speaker_notes` (text, nullable)
- `created_at` (timestamp with time zone)
- `updated_at` (timestamp with time zone)

**Indexes:**
- `slides_presentation_id_idx` on (presentation_id)
- `slides_order_index_idx` on (presentation_id, order_index)

**RLS Policies:**
- Users can only access slides from their own presentations

### manus_tasks
- `id` (uuid, primary key)
- `task_id` (text, unique)
- `presentation_id` (uuid, foreign key → presentations.id ON DELETE CASCADE)
- `status` (text: "running" | "completed" | "failed")
- `webhook_data` (jsonb, nullable)
- `created_at` (timestamp with time zone)
- `updated_at` (timestamp with time zone)

**Indexes:**
- `manus_tasks_task_id_idx` on (task_id)
- `manus_tasks_presentation_id_idx` on (presentation_id)

## Environment Variables

### Required
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Manus API
MANUS_API_KEY=sk-xxxxx
MANUS_WEBHOOK_URL=https://your-domain.com/api/slides/manus-webhook
MANUS_API_BASE_URL=https://api.manus.ai/v1
MANUS_AGENT_PROFILE=quality

# App
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### Optional
```bash
# Webhook signature verification
MANUS_WEBHOOK_SECRET=your_secret_key
```

## Usage

### Creating a Presentation

1. Click "New Presentation" in the sidebar
2. Enter a prompt describing your presentation topic
3. Select format (16:9, 4:3, or A4)
4. Choose a theme color
5. Click "Erstellen"
6. Wait for real-time notification (~30-60 seconds)

### Editing Slides

1. Click on a presentation to open the editor
2. Use the slide list (left sidebar) to navigate
3. Edit title, content, layout in settings (right sidebar)
4. Changes are automatically saved
5. Navigate with Previous/Next buttons or slide list

### Exporting

**PDF Export:**
- Click "Export PDF" button
- Wait for processing (~5-10 seconds)
- Download starts automatically
- PDF preserves theme colors and layouts

**PPTX Export:**
- Click "Export PPTX" button
- Wait for processing (~5-10 seconds)
- Download starts automatically
- Editable in Microsoft PowerPoint or compatible software

## Tech Stack

- **Frontend:** Next.js 15.5.4, React 18, TypeScript 5
- **UI:** Shadcn UI, Tailwind CSS, Lucide Icons
- **Database:** Supabase (PostgreSQL)
- **Real-time:** Socket.IO
- **AI:** Manus API (OpenAI SDK compatible)
- **Export:** jsPDF, html2canvas, PptxGenJS
- **Markdown:** react-markdown
- **Date:** date-fns

## File Structure

```
app/
├── slides/
│   ├── page.tsx                 # Presentations list
│   └── [id]/
│       └── page.tsx             # Slide editor
└── api/
    └── slides/
        ├── generate/route.ts    # Create presentation
        ├── route.ts             # List presentations
        ├── [id]/
        │   ├── route.ts         # Get/Update/Delete presentation
        │   └── slides/
        │       └── [slideId]/
        │           └── route.ts # Update/Delete slide
        └── manus-webhook/
            └── route.ts         # Webhook handler

components/
└── slides/
    ├── NewPresentationModal.tsx # Create modal
    ├── PresentationsList.tsx    # Grid view
    ├── SlideEditor.tsx          # 3-column editor
    ├── SlideCanvas.tsx          # Slide renderer
    ├── SlideList.tsx            # Left sidebar
    └── SlideSettings.tsx        # Right sidebar

hooks/
└── slides/
    ├── useWebSocket.ts          # WebSocket integration
    └── useExport.ts             # Export functionality

lib/
├── api/
│   └── slides/
│       ├── manus-client.ts      # Manus API client
│       ├── prompt-generator.ts  # Prompt enhancement
│       └── slides-parser.ts     # Webhook parsing
├── export/
│   ├── pdf-exporter.ts          # PDF generation
│   └── pptx-exporter.ts         # PPTX generation
└── socket/
    ├── server.ts                # Socket.IO server
    └── client.ts                # Socket.IO client

types/
└── slides.ts                    # TypeScript definitions

constants/
└── slides.ts                    # Format/theme/layout options

supabase/
└── migrations/
    └── 20251019000000_slides_tables.sql
```

## WebSocket Events

### Client → Server
- `connect`: Initial connection
- `authenticate`: User authentication with userId

### Server → Client
- `presentation_ready`: Presentation generation completed
- `presentation_error`: Presentation generation failed
- `slide_updated`: Individual slide updated

## Development

### Setup
```bash
# Install dependencies
npm install

# Run migrations
# Execute supabase/migrations/20251019000000_slides_tables.sql in Supabase Dashboard

# Start dev server
npm run dev
```

### Testing
```bash
# Manual testing
# 1. Navigate to http://localhost:3000/slides
# 2. Create a presentation
# 3. Wait for real-time update
# 4. Edit slides
# 5. Export to PDF/PPTX

# API testing with curl
curl -X POST http://localhost:3000/api/slides/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"prompt": "Test presentation", "format": "16:9", "theme": "blue"}'
```

## Deployment

### Build
```bash
npm run build
npm start
```

### Vercel
```bash
# Push to GitHub (auto-deploy)
git push origin main

# Or deploy manually
vercel --prod
```

### Post-Deployment Checklist
- [ ] Environment variables configured
- [ ] Database migrations executed
- [ ] Webhook URL accessible
- [ ] WebSocket connection works
- [ ] Authentication flow works
- [ ] Export functionality works
- [ ] Real-time updates work

## Troubleshooting

### Presentation stuck in "generating" status
- Check Manus API key validity
- Verify webhook URL is publicly accessible
- Check webhook signature verification
- Review Manus task logs

### WebSocket not connecting
- Verify `NEXT_PUBLIC_APP_URL` is correct
- Check Socket.IO server initialization in `server.js`
- Review browser console for connection errors

### Export not working
- Verify `jspdf`, `html2canvas`, and `pptxgenjs` are installed
- Check browser console for errors
- Ensure slide elements have proper refs

## Support

For issues or questions:
- GitHub Issues: [payperwork/issues](https://github.com/your-org/payperwork/issues)
- Email: support@payperwork.com
- Documentation: [docs.payperwork.com](https://docs.payperwork.com)

## License

Proprietary - Payperwork © 2025
