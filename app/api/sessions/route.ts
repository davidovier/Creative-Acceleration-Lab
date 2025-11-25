/**
 * Sessions API Route
 * Save and retrieve creative sessions
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { projectId, report } = body;

    if (!report || !report.userText) {
      return NextResponse.json({ error: 'Missing report data' }, { status: 400 });
    }

    // Insert session
    const { data, error } = await supabase
      .from('sessions')
      .insert({
        project_id: projectId || null,
        owner_id: user.id,
        user_text: report.userText,
        insight: report.insight,
        story: report.story,
        prototype: report.prototype,
        symbol: report.symbol,
        consistency: report.consistency,
        ssic: report.ssic || null,
        total_duration: report.totalDuration,
        preprocessing: report.preprocessing,
      })
      .select()
      .single();

    if (error) throw error;

    // Update project updated_at if projectId provided
    if (projectId) {
      await supabase
        .from('projects')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', projectId)
        .eq('owner_id', user.id);
    }

    return NextResponse.json({ ok: true, sessionId: data.id });
  } catch (error: any) {
    console.error('Error saving session:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get projectId from query if provided
    const url = new URL(request.url);
    const projectId = url.searchParams.get('projectId');

    let query = supabase
      .from('sessions')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false });

    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ ok: true, sessions: data });
  } catch (error: any) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
