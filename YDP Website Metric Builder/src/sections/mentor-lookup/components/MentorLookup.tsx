import { useMemo, useState } from 'react'
import { Search, UserRound, UsersRound, Inbox, SearchX, Gauge } from 'lucide-react'
import type {
  MentorLookupProps,
  MentorWithMatches,
} from '@/../product/sections/mentor-lookup/types'
import { MenteeMatchCard } from './MenteeMatchCard'

/**
 * Mentor Lookup — search by mentor ID or name, then view matched mentees
 * ranked by pair score, with a load summary. Read-only apart from contacting
 * a mentee.
 *
 * Tokens: indigo primary, emerald top-match, slate neutrals.
 */
export function MentorLookup({
  mentors,
  initialMentorId,
  onContactMentee,
  onSelectMentor,
}: MentorLookupProps) {
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(
    initialMentorId ?? null,
  )

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return mentors.filter(
      (m) =>
        m.mentorId.toLowerCase().includes(q) ||
        m.mentorName.toLowerCase().includes(q),
    )
  }, [query, mentors])

  const selected = useMemo(
    () => mentors.find((m) => m.mentorId === selectedId) ?? null,
    [mentors, selectedId],
  )

  const showResults = focused && query.trim().length > 0
  const notFound = showResults && results.length === 0

  function select(mentor: MentorWithMatches) {
    setSelectedId(mentor.mentorId)
    setQuery('')
    setFocused(false)
    onSelectMentor?.(mentor.mentorId)
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <header className="mb-5">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Find your mentees
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Search your mentor ID or name to see the mentees matched to you.
        </p>
      </header>

      {/* Search */}
      <div className="relative">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 120)}
            placeholder="e.g. YDP-C2-Mentor-004 or Adeyemi"
            className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-900 shadow-sm outline-none transition-colors placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500 dark:focus:ring-indigo-500/20"
          />
        </div>

        {showResults && results.length > 0 && (
          <ul className="absolute z-10 mt-2 max-h-72 w-full overflow-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-900">
            {results.map((mentor) => (
              <li key={mentor.mentorId}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => select(mentor)}
                  className="flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
                    <UserRound className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-slate-900 dark:text-white">
                      {mentor.mentorName}
                    </span>
                    <span className="block truncate font-mono text-xs text-slate-400 dark:text-slate-500">
                      {mentor.mentorId} · {mentor.track}
                    </span>
                  </span>
                  <span className="ml-auto shrink-0 text-xs text-slate-400 dark:text-slate-500">
                    {mentor.menteeCount} mentee
                    {mentor.menteeCount === 1 ? '' : 's'}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {notFound && (
          <div className="absolute z-10 mt-2 w-full rounded-xl border border-slate-200 bg-white p-4 text-sm shadow-lg dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <SearchX className="h-4 w-4 text-slate-400" />
              We couldn't find a mentor matching{' '}
              <span className="font-mono font-medium text-slate-900 dark:text-white">
                "{query.trim()}"
              </span>
              .
            </div>
            <p className="mt-1 pl-6 text-xs text-slate-400 dark:text-slate-500">
              Check your mentor ID or name and try again.
            </p>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="mt-6">
        {!selected ? (
          <EmptyPrompt />
        ) : (
          <section>
            {/* Mentor profile + load summary */}
            <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center dark:border-slate-800 dark:bg-slate-900">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white dark:bg-indigo-500">
                  {selected.mentorName
                    .split(' ')
                    .map((p) => p[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase()}
                </span>
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-semibold text-slate-900 dark:text-white">
                    {selected.mentorName}
                  </h2>
                  <p className="truncate font-mono text-xs text-slate-400 dark:text-slate-500">
                    {selected.mentorId} · {selected.track}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 sm:ml-auto">
                <LoadStat
                  icon={UsersRound}
                  value={selected.menteeCount}
                  label={`mentee${selected.menteeCount === 1 ? '' : 's'}`}
                />
                <LoadStat
                  icon={Gauge}
                  value={selected.menteeCount ? selected.averagePairScore : '—'}
                  label="avg score"
                  accent
                />
              </div>
            </div>

            {/* Matches */}
            {selected.matches.length === 0 ? (
              <NoMatches name={selected.mentorName} />
            ) : (
              <>
                <div className="mb-3 mt-6 flex items-center gap-2">
                  <UsersRound className="h-4 w-4 text-slate-400" />
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Your matched mentees
                  </h3>
                  <span className="text-xs text-slate-400 dark:text-slate-500">
                    ranked by pair score
                  </span>
                </div>
                <div className="grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {selected.matches.map((match) => (
                    <MenteeMatchCard
                      key={match.matchId}
                      match={match}
                      onContact={() =>
                        onContactMentee?.(match.menteeId, match.matchId)
                      }
                    />
                  ))}
                </div>
              </>
            )}
          </section>
        )}
      </div>
    </div>
  )
}

function LoadStat({
  icon: Icon,
  value,
  label,
  accent,
}: {
  icon: typeof UsersRound
  value: string | number
  label: string
  accent?: boolean
}) {
  return (
    <div
      className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 ${
        accent
          ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-500/10'
          : 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/60'
      }`}
    >
      <Icon
        className={`h-4 w-4 ${accent ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}
      />
      <div className="leading-tight">
        <div
          className={`font-mono text-lg font-bold tabular-nums ${
            accent
              ? 'text-emerald-700 dark:text-emerald-300'
              : 'text-slate-900 dark:text-white'
          }`}
        >
          {value}
        </div>
        <div className="text-[11px] text-slate-400 dark:text-slate-500">
          {label}
        </div>
      </div>
    </div>
  )
}

function EmptyPrompt() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center dark:border-slate-700 dark:bg-slate-900">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
        <Search className="h-5 w-5" />
      </span>
      <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-white">
        Search to see your mentees
      </h3>
      <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
        Enter your mentor ID or name above and pick yourself from the list.
      </p>
    </div>
  )
}

function NoMatches({ name }: { name: string }) {
  return (
    <div className="mt-6 flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center dark:border-slate-700 dark:bg-slate-900">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
        <Inbox className="h-5 w-5" />
      </span>
      <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-white">
        No mentees matched yet
      </h3>
      <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
        {name.split(' ')[0]} hasn't been matched with any mentees yet. Check back
        after the next matching round.
      </p>
    </div>
  )
}
