import { NextRequest, NextResponse } from 'next/server';
import { generateArtistReport, generateOutreachDraft, ArtistReportInput } from '@/lib/openai';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { artist_id, artist_name, genre, followers, popularity } = body;

    // Validate input
    if (!artist_id || !artist_name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get user from session
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Prepare artist data for AI
    const artistData: ArtistReportInput = {
      name: artist_name,
      genre: genre || 'Unknown',
      followers: followers || 0,
      popularity: popularity || 0,
    };

    // Generate report
    const reportJson = await generateArtistReport(artistData);
    const parsedReport = JSON.parse(reportJson);

    // Generate outreach draft
    const outreachDraft = await generateOutreachDraft(artistData);
    parsedReport.outreach_draft = outreachDraft;

    // Get user ID from token
    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !userData.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Save report to database
    const { data: report, error: reportError } = await supabaseAdmin
      .from('reports')
      .insert([
        {
          user_id: userData.user.id,
          artist_id,
          report_json: parsedReport,
          lead_score: parsedReport.lead_score,
        },
      ])
      .select()
      .single();

    if (reportError) throw reportError;

    return NextResponse.json({
      success: true,
      report: parsedReport,
      report_id: report?.id,
    });
  } catch (error: any) {
    console.error('Report generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate report' },
      { status: 500 }
    );
  }
}
