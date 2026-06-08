import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !userData.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get stats
    const { data: reports, error: reportsError } = await supabaseAdmin
      .from('reports')
      .select('artist_id')
      .eq('user_id', userData.user.id);

    if (reportsError) throw reportsError;

    const { data: saved, error: savedError } = await supabaseAdmin
      .from('saved_artists')
      .select('id')
      .eq('user_id', userData.user.id);

    if (savedError) throw savedError;

    const uniqueArtists = new Set((reports || []).map((r: any) => r.artist_id)).size;

    return NextResponse.json({
      artists_analyzed: uniqueArtists,
      saved_artists: (saved || []).length,
      reports_generated: (reports || []).length,
    });
  } catch (error: any) {
    console.error('Stats error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
