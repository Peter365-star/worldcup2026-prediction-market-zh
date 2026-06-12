import type { SerializedResult } from './worker';
import type { MatchAggregateSerialized } from './types';

export interface PredictionMatch {
  /** fixture key like "A:0" for group or "R32_3|ARG-FRA" for knockout */
  key: string;
  stage: string;
  group?: string;
  home: string;
  away: string;
  /** avg home goals per sim */
  avgHomeGoals: number;
  /** avg away goals per sim */
  avgAwayGoals: number;
  /** probability home wins */
  probHome: number;
  /** probability draw */
  probDraw: number;
  /** probability away wins */
  probAway: number;
  /** which scenario ("withAbsences" or "noAbsences") */
  scenario: string;
}

export interface PredictionPayload {
  timestamp: number;
  numSimulations: number;
  matches: PredictionMatch[];
}

const STORAGE_KEY = 'worldcup2026_predictions';

function summarizeFixture(
  f: MatchAggregateSerialized,
  scenario: string,
): PredictionMatch {
  const n = f.count || 1;
  return {
    key: f.slotId,
    stage: f.stage,
    group: f.group,
    home: f.home,
    away: f.away,
    avgHomeGoals: f.sumGoalsHome / n,
    avgAwayGoals: f.sumGoalsAway / n,
    probHome: f.winsHome / n,
    probDraw: f.draws / n,
    probAway: f.winsAway / n,
    scenario,
  };
}

export function savePredictions(result: SerializedResult, scenario: string): void {
  if (typeof window === 'undefined') return;

  const matches: PredictionMatch[] = [];
  for (const [, f] of result.fixtures) {
    // Only include group-stage and pre-determined knockout fixtures
    // (skip matchup-dependent knockout variants with very low counts)
    if (f.stage === 'group' || f.count > result.numSimulations * 0.1) {
      matches.push(summarizeFixture(f, scenario));
    }
  }

  const payload: PredictionPayload = {
    timestamp: Date.now(),
    numSimulations: result.numSimulations,
    matches,
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // localStorage might be full or disabled
  }
}

export function loadPredictions(): PredictionPayload | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PredictionPayload;
  } catch {
    return null;
  }
}
