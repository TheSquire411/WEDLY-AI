
import { askWeddingAssistant } from '@/ai/flows/wedding-assistant';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { question, userId } = body;

    if (!question || !userId) {
      return NextResponse.json({ error: 'Missing question or userId' }, { status: 400 });
    }

    const result = await askWeddingAssistant({ question, userId });
    return NextResponse.json(result);

  } catch (error: any) {
    console.error("API Route Error:", error);
    return NextResponse.json({ error: 'An internal server error occurred' }, { status: 500 });
  }
}
