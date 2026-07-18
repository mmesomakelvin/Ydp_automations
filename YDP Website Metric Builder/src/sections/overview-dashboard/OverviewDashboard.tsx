import data from '@/../product/sections/overview-dashboard/data.json'
import type {
  DashboardSummary,
  TrackStat,
  ScoreBand,
  AttentionMatches,
  DrillDownCategory,
} from '@/../product/sections/overview-dashboard/types'
import { OverviewDashboard } from './components/OverviewDashboard'

/**
 * Preview wrapper for Design OS. Feeds sample data into the props-based
 * OverviewDashboard component. Not part of the exported package.
 */
export default function OverviewDashboardPreview() {
  return (
    <OverviewDashboard
      cohortLabel={data.cohortLabel}
      lowScoreThreshold={data.lowScoreThreshold}
      filtersApplied={data.filtersApplied}
      summary={data.summary as DashboardSummary}
      tracks={data.tracks as TrackStat[]}
      scoreBands={data.scoreBands as ScoreBand[]}
      attention={data.attention as unknown as AttentionMatches}
      onDrillDown={(category: DrillDownCategory) =>
        console.log('Drill down:', category)
      }
      onOpenMatch={(matchId) => console.log('Open match:', matchId)}
      onNavigate={(href) => console.log('Navigate:', href)}
    />
  )
}
