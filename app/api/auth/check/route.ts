import { NextRequest, NextResponse } from 'next/server';
import { checkAuth, TOKEN } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  return NextResponse.json({ authed: checkAuth(req), required: !!TOKEN });
}
