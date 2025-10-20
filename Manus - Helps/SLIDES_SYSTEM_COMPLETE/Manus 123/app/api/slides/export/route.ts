/**
 * API Route: Export Slides
 * 
 * Exports presentation slides to PDF or PPTX format.
 * 
 * @route POST /api/slides/export
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ExportService } from '@/lib/api/slides/export/ExportService';
import type { PresentationFormat, PresentationTheme, Slide } from '@/types/slides';

// Initialize Supabase client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      presentationId,
      format: exportFormat, // 'pdf' or 'pptx'
      includeNotes = false,
      quality = 2,
    } = body;

    // Validation
    if (!presentationId) {
      return NextResponse.json(
        { success: false, error: 'Presentation ID is required' },
        { status: 400 }
      );
    }

    if (!exportFormat || !['pdf', 'pptx'].includes(exportFormat)) {
      return NextResponse.json(
        { success: false, error: 'Export format must be "pdf" or "pptx"' },
        { status: 400 }
      );
    }

    console.log('📤 Exporting presentation:', presentationId, 'to', exportFormat);

    // Fetch presentation from database
    const { data: presentation, error: presError } = await supabaseAdmin
      .from('presentations')
      .select('*')
      .eq('id', presentationId)
      .single();

    if (presError || !presentation) {
      return NextResponse.json(
        { success: false, error: 'Presentation not found' },
        { status: 404 }
      );
    }

    // Fetch slides
    const { data: slides, error: slidesError } = await supabaseAdmin
      .from('slides')
      .select('*')
      .eq('presentation_id', presentationId)
      .order('order_index', { ascending: true });

    if (slidesError || !slides || slides.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No slides found for this presentation' },
        { status: 404 }
      );
    }

    console.log('✅ Found', slides.length, 'slides');

    // Export based on format
    let result;
    if (exportFormat === 'pdf') {
      result = await ExportService.exportToPDF(
        slides as Slide[],
        presentation.format as PresentationFormat,
        presentation.theme as PresentationTheme,
        {
          filename: `${presentation.title.replace(/[^a-z0-9]/gi, '_')}.pdf`,
          quality,
          includeNotes,
        }
      );
    } else {
      result = await ExportService.exportToPPTX(
        slides as Slide[],
        presentation.format as PresentationFormat,
        presentation.theme as PresentationTheme,
        {
          filename: `${presentation.title.replace(/[^a-z0-9]/gi, '_')}.pptx`,
          includeNotes,
        }
      );
    }

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Export failed' },
        { status: 500 }
      );
    }

    console.log('✅ Export completed:', result.filename);

    // Return success (file is downloaded client-side)
    return NextResponse.json({
      success: true,
      filename: result.filename,
      format: exportFormat,
      slideCount: slides.length,
    });

  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

