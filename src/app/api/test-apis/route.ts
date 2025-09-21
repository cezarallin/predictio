import { NextResponse } from 'next/server';
import { testAPIConnections, getWeekendFixtures } from '@/lib/football-api';

export async function GET() {
  try {
    console.log('🧪 Testing API connections...');
    
    // Test API connections
    const connectionResults = await testAPIConnections();
    
    // Test match fetching
    const matches = await getWeekendFixtures();
    
    const testResults = {
      timestamp: new Date().toISOString(),
      apiConnections: connectionResults,
      matchesFetched: matches.length,
      sampleMatches: matches.slice(0, 3), // Show first 3 matches as example
      apiKeys: {
        oddsAPI: !!process.env.ODDS_API_KEY,
        rapidAPI: !!process.env.RAPIDAPI_KEY
      },
      instructions: {
        message: 'To get real data, add API keys to your .env.local file',
        oddsAPI: 'Get free key from: https://the-odds-api.com/',
        rapidAPI: 'Get free key from: https://rapidapi.com/api-sports/api/api-football/'
      }
    };
    
    return NextResponse.json(testResults);
  } catch (error) {
    console.error('Test API error:', error);
    return NextResponse.json(
      { error: 'Failed to test APIs', details: error }, 
      { status: 500 }
    );
  }
}
