import { NextRequest, NextResponse } from 'next/server';
import { fetchChessDotComGames } from '@/lib/api-clients/games';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const username = searchParams.get('username');
    const maxGames = searchParams.get('maxGames') ? parseInt(searchParams.get('maxGames') as string, 10) : 50;
    
    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }
    
    const games = await fetchChessDotComGames(username, maxGames);
    
    return NextResponse.json({ games });
  } catch (error) {
    console.error('Error in Chess.com API route:', error);
    return NextResponse.json(
      { error: 'Failed to fetch games from Chess.com' },
      { status: 500 }
    );
  }
}