'use client';

import { useEffect, useState } from 'react';
import { Bebas_Neue } from 'next/font/google';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { getCountdownParts, type CountdownParts } from '@/lib/tournament';

const countdownFont = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
});

type MatchStatus = 'loading' | 'live' | 'upcoming' | 'finished' | 'none';

interface NextMatch {
  status: MatchStatus;
  home: string;
  away: string;
  homeAbbr: string;
  awayAbbr: string;
  group: string;
  date: string;
  kickoffMs: number;
  homeScore?: number;
  awayScore?: number;
  detail?: string;
}

const INITIAL_PARTS: CountdownParts = {
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 0,
  totalMs: 0,
};

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

const ESPN_URL = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard';

async function fetchNextMatch(): Promise<NextMatch> {
  try {
    const r = await fetch(ESPN_URL, { cache: 'no-store' });
    if (!r.ok) throw new Error('fetch failed');
    const d = await r.json();
    const events: any[] = d.events || [];
    if (!events.length) return { status: 'none', home: '', away: '', homeAbbr: '', awayAbbr: '', group: '', date: '', kickoffMs: 0 };

    const now = Date.now();

    // Find live matches first
    const live = events.filter((e) => e.status?.type?.state === 'in');
    if (live.length > 0) {
      const ev = live[0];
      const comp = ev.competitions?.[0] || {};
      const cs = comp.competitors || [];
      const home = cs.find((c: any) => c.homeAway === 'home') || cs[0] || {};
      const away = cs.find((c: any) => c.homeAway === 'away') || cs[1] || {};
      return {
        status: 'live',
        home: home.team?.displayName || home.team?.shortDisplayName || '',
        away: away.team?.displayName || away.team?.shortDisplayName || '',
        homeAbbr: home.team?.abbreviation || '',
        awayAbbr: away.team?.abbreviation || '',
        group: (ev.name || '').replace('Group ', '小组'),
        date: ev.date || '',
        kickoffMs: Date.parse(ev.date || ''),
        homeScore: home.score,
        awayScore: away.score,
        detail: ev.status?.type?.shortDetail || '',
      };
    }

    // Find upcoming matches, closest first
    const upcoming = events
      .filter((e) => e.status?.type?.state === 'pre')
      .filter((e) => e.date)
      .sort((a, b) => Date.parse(a.date) - Date.parse(b.date));

    if (upcoming.length > 0) {
      const ev = upcoming[0];
      const comp = ev.competitions?.[0] || {};
      const cs = comp.competitors || [];
      const home = cs.find((c: any) => c.homeAway === 'home') || cs[0] || {};
      const away = cs.find((c: any) => c.homeAway === 'away') || cs[1] || {};
      const kickoffMs = Date.parse(ev.date);
      // If match is within 2 hours but not yet started, still "upcoming"
      if (kickoffMs <= now + 2 * 3600_000 && kickoffMs > now - 300_000) {
        return {
          status: 'upcoming',
          home: home.team?.displayName || home.team?.shortDisplayName || '',
          away: away.team?.displayName || away.team?.shortDisplayName || '',
          homeAbbr: home.team?.abbreviation || '',
          awayAbbr: away.team?.abbreviation || '',
          group: (ev.name || '').replace('Group ', '小组'),
          date: ev.date,
          kickoffMs,
        };
      }
      return {
        status: 'upcoming',
        home: home.team?.displayName || home.team?.shortDisplayName || '',
        away: away.team?.displayName || away.team?.shortDisplayName || '',
        homeAbbr: home.team?.abbreviation || '',
        awayAbbr: away.team?.abbreviation || '',
        group: (ev.name || '').replace('Group ', '小组'),
        date: ev.date,
        kickoffMs,
      };
    }

    return { status: 'finished', home: '', away: '', homeAbbr: '', awayAbbr: '', group: '', date: '', kickoffMs: 0 };
  } catch {
    return { status: 'none', home: '', away: '', homeAbbr: '', awayAbbr: '', group: '', date: '', kickoffMs: 0 };
  }
}

const UNITS = ['days', 'hours', 'minutes', 'seconds'] as const;

function Unit({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex min-w-[2.75rem] flex-col items-center sm:min-w-[3.25rem]">
      <span
        className={cn(
          countdownFont.className,
          'text-[clamp(2rem,5vw,3.25rem)] leading-none tracking-[0.1em] text-orange-400',
        )}
        style={{ textShadow: '0 0 28px oklch(0.75 0.18 55 / 0.35)' }}
        suppressHydrationWarning
      >
        {value}
      </span>
      <span className="mt-1 font-mono text-[9px] uppercase tracking-[0.16em] text-orange-400/55 sm:text-[10px]">
        {label}
      </span>
    </div>
  );
}

export function NextMatchCountdown({ className }: { className?: string }) {
  const t = useTranslations('countdown');
  const [mounted, setMounted] = useState(false);
  const [match, setMatch] = useState<NextMatch>({ status: 'loading', home: '', away: '', homeAbbr: '', awayAbbr: '', group: '', date: '', kickoffMs: 0 });
  const [parts, setParts] = useState<CountdownParts>(INITIAL_PARTS);

  useEffect(() => {
    setMounted(true);
    let timer: number | undefined;

    const load = async () => {
      const m = await fetchNextMatch();
      setMatch(m);
    };
    load();

    // Refresh match data every 60s
    const refreshId = window.setInterval(load, 60_000);

    return () => {
      window.clearInterval(refreshId);
      if (typeof timer === 'number') window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (match.status === 'upcoming' && match.kickoffMs > 0) {
      const tick = () => setParts(getCountdownParts(match.kickoffMs));
      tick();
      const id = window.setInterval(tick, 1_000);
      return () => window.clearInterval(id);
    }
  }, [match]);

  const values = {
    days: pad(parts.days),
    hours: pad(parts.hours),
    minutes: pad(parts.minutes),
    seconds: pad(parts.seconds),
  };

  return (
    <div className={cn('flex flex-col items-center', className)} role="timer" aria-live="polite">
      {match.status === 'loading' && (
        <div className="flex flex-col items-center gap-2">
          <div className="h-4 w-32 animate-pulse rounded bg-orange-500/10" />
          <div className="flex gap-3">
            {UNITS.map((unit) => (
              <div key={unit} className="flex flex-col items-center gap-1">
                <div className="h-10 w-10 animate-pulse rounded-md bg-orange-500/10 sm:h-12 sm:w-12" />
                <div className="h-2 w-8 animate-pulse rounded bg-orange-500/10" />
              </div>
            ))}
          </div>
        </div>
      )}

      {match.status === 'live' && (
        <div className="flex flex-col items-center">
          <p className="mb-1 font-mono text-[9px] uppercase tracking-[0.22em] text-red-400/80 sm:text-[10px]">
            ● 正在直播
          </p>
          <p className="font-display text-2xl font-bold text-orange-400 sm:text-3xl" suppressHydrationWarning>
            {match.homeAbbr} {match.homeScore}-{match.awayScore} {match.awayAbbr}
          </p>
          <p className="mt-1 font-mono text-xs text-orange-400/60">
            {match.group} · {match.detail}
          </p>
        </div>
      )}

      {match.status === 'upcoming' && (
        <div className="flex flex-col items-center">
          <p className="mb-1 font-mono text-[9px] uppercase tracking-[0.22em] text-orange-400/65 sm:text-[10px]">
            距离下一场开赛
          </p>
          {mounted && match.kickoffMs > 0 ? (
            <div className="flex items-start gap-1 sm:gap-1.5">
              {UNITS.map((unit, i) => (
                <div key={unit} className="flex items-start gap-1 sm:gap-1.5">
                  {i > 0 && (
                    <span
                      className={cn(
                        countdownFont.className,
                        'mt-0.5 text-[clamp(1.75rem,4vw,2.75rem)] leading-none text-orange-500/40',
                      )}
                      aria-hidden
                    >
                      :
                    </span>
                  )}
                  <Unit value={values[unit]} label={t(unit)} />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex gap-3" aria-hidden>
              {UNITS.map((unit) => (
                <div key={unit} className="flex flex-col items-center gap-1">
                  <div className="h-10 w-10 animate-pulse rounded-md bg-orange-500/10 sm:h-12 sm:w-12" />
                  <div className="h-2 w-8 animate-pulse rounded bg-orange-500/10" />
                </div>
              ))}
            </div>
          )}
          <p className="mt-2 font-display text-lg font-bold text-orange-300/90 sm:text-xl">
            {match.homeAbbr} vs {match.awayAbbr}
          </p>
          <p className="mt-0.5 font-mono text-xs text-orange-400/55">{match.group}</p>
        </div>
      )}

      {match.status === 'finished' && (
        <div className="flex flex-col items-center">
          <p className="mb-1 font-mono text-[9px] uppercase tracking-[0.22em] text-fg-3/60 sm:text-[10px]">
            今日比赛已全部结束
          </p>
          <p className="font-display text-xl font-bold text-fg-2">等待下一轮</p>
        </div>
      )}

      {match.status === 'none' && (
        <div className="flex flex-col items-center">
          <p className="mb-1 font-mono text-[9px] uppercase tracking-[0.22em] text-fg-3/60 sm:text-[10px]">
            暂无可获取赛程
          </p>
        </div>
      )}
    </div>
  );
}
