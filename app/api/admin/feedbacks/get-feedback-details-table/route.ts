//@ts-nocheck
import 'server-only'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from '@/lib/db_types'
import { auth } from '@/auth'
import { NextResponse } from 'next/server'
import { PostgrestError } from '@supabase/supabase-js'
import { createClient } from '@supabase/supabase-js'
import { getFeedbacksLocalAdmin } from '@/app/admin/actions'

export const maxDuration = 60
export const runtime = 'nodejs'
export const fetchCache = 'force-no-store';
export const dynamic = "force-dynamic";

export async function GET() {
  const feedback_details_data = await getFeedbacksLocalAdmin()
  return NextResponse.json(feedback_details_data)
}
