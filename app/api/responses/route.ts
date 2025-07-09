// app/api/responses/route.ts
import { NextResponse } from 'next/server';
import { getSharedResponsesFromDb } from '@/services/responseService';

export async function GET() {
  try {
    const responses = await getSharedResponsesFromDb();
    return NextResponse.json(responses);
  } catch (error: any) {
    console.error('Error fetching shared responses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shared responses', details: error.message },
      { status: 500 }
    );
  }
}