import { NextResponse } from 'next/server';

const ESPN_SCOREBOARD = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard';
const ESPN_STANDINGS = 'https://site.api.espn.com/apis/v2/sports/soccer/fifa.world/standings';
const ESPN_LEADERS = 'https://site.api.espn.com/apis/v2/sports/soccer/fifa.world/leaders';

async function fetchWithTimeout(url: string, timeout = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const r = await fetch(url, { signal: controller.signal, cache: 'no-store' });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.json();
  } finally {
    clearTimeout(timer);
  }
}

export async function GET() {
  const [scores, standings, leaders] = await Promise.allSettled([
    fetchWithTimeout(ESPN_SCOREBOARD).catch(() => null),
    fetchWithTimeout(ESPN_STANDINGS).catch(() => null),
    fetchWithTimeout(ESPN_LEADERS).catch(() => null),
  ]);

  return NextResponse.json({
    scores: scores.status === 'fulfilled' ? scores.value : null,
    standings: standings.status === 'fulfilled' ? standings.value : null,
    leaders: leaders.status === 'fulfilled' ? leaders.value : null,
    timestamp: Date.now(),
  }, {
    headers: {
      'Cache-Control': 'public, max-age=30, s-maxage=30',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
