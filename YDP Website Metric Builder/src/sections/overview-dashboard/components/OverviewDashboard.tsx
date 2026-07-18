import {
  GraduationCap,
  Users,
  GitMerge,
  Gauge,
  ShieldAlert,
  ClipboardCheck,
  MailWarning,
  TrendingDown,
} from 'lucide-react'
import type { OverviewDashboardProps } from '@/../product/sections/overview-dashboard/types'
import { StatTile } from './StatTile'
import { TrackDistribution } from './TrackDistribution'
import { ScoreQuality } from './ScoreQuality'
import { AttentionCard } from './AttentionCard'
import { riskBadge, emailBadge, scoreBadge, reviewBadge } from './status'

/**
 * Overview Dashboard — the landing view for YDP Mentorship Hub.
 * Read-only metrics with drill-down into the matches behind each number.
 *
 * Design tokens: primary indigo, secondary emerald, neutral slate.
 * Type: Inter (UI) + JetBrains Mono (IDs / figures).
 */
export function OverviewDashboard({
  cohortLabel,
  summary,
  tracks,
  scoreBands,
  attention,
  onDrillDown,
  onOpenMatch,
}: OverviewDashboardProps) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      {/* Header */}
      <header className="mb-6">
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-emerald-100 px-2 py-0.5 font-mono text-xs font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
            {cohortLabel}
          </span>
          <span className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
            Program overview
          </span>
        </div>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Where the cohort stands today
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Live from the matches sheet. Select any figure to see the matches behind it.
        </p>
      </header>

      {/* KPI tiles */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatTile
          label="Mentees"
          value={summary.totalMentees}
          icon={GraduationCap}
          tone="indigo"
          onClick={() => onDrillDown?.('totalMentees')}
        />
        <StatTile
          label="Mentors"
          value={summary.totalMentors}
          icon={Users}
          tone="indigo"
          onClick={() => onDrillDown?.('totalMentors')}
        />
        <StatTile
          label="Matches"
          value={summary.totalMatches}
          icon={GitMerge}
          tone="slate"
          onClick={() => onDrillDown?.('totalMatches')}
        />
        <StatTile
          label="Avg pair score"
          value={summary.averagePairScore}
          icon={Gauge}
          tone="emerald"
          fill={summary.averagePairScore}
          onClick={() => onDrillDown?.('averagePairScore')}
        />
      </div>

      {/* Distribution + quality */}
      <div className="mt-4 grid gap-3 sm:gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <TrackDistribution
            tracks={tracks}
            onSelect={(track) => onDrillDown?.({ track })}
          />
        </div>
        <div className="lg:col-span-2">
          <ScoreQuality
            averagePairScore={summary.averagePairScore}
            scoreBands={scoreBands}
            onClick={() => onDrillDown?.('averagePairScore')}
          />
        </div>
      </div>

      {/* Health & attention */}
      <div className="mt-8">
        <div className="mb-3 flex items-center gap-2">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
            Needs attention
          </h2>
          <span className="text-xs text-slate-400 dark:text-slate-500">
            triage before the next review
          </span>
        </div>
        <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 2xl:grid-cols-4">
          <AttentionCard
            title="At-risk matches"
            count={summary.atRiskCount}
            icon={ShieldAlert}
            tone="amber"
            matches={attention.atRisk}
            badgeFor={riskBadge}
            emptyText="No matches are flagged at risk."
            onDrill={() => onDrillDown?.('atRisk')}
            onOpenMatch={onOpenMatch}
          />
          <AttentionCard
            title="Pending review"
            count={summary.pendingReviewCount}
            icon={ClipboardCheck}
            tone="indigo"
            matches={attention.pendingReview}
            badgeFor={reviewBadge}
            emptyText="Every match has been reviewed."
            onDrill={() => onDrillDown?.('pendingReview')}
            onOpenMatch={onOpenMatch}
          />
          <AttentionCard
            title="Email issues"
            count={summary.emailIssueCount}
            icon={MailWarning}
            tone="red"
            matches={attention.emailIssues}
            badgeFor={emailBadge}
            emptyText="All match emails delivered."
            onDrill={() => onDrillDown?.('emailIssues')}
            onOpenMatch={onOpenMatch}
          />
          <AttentionCard
            title="Low-score matches"
            count={summary.lowScoreCount}
            icon={TrendingDown}
            tone="amber"
            matches={attention.lowScore}
            badgeFor={(m) => scoreBadge(m.pairScore)}
            emptyText="No matches below the score threshold."
            onDrill={() => onDrillDown?.('lowScore')}
            onOpenMatch={onOpenMatch}
          />
        </div>
      </div>
    </div>
  )
}
