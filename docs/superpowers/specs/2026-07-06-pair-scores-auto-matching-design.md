# Pair Scores Auto-Matching Design

## Goal

Automatically match eligible mentees to mentors while keeping an audit trail that explains why each match was chosen.

The team should not have to approve every match before pairing happens. The system should create final matches first, then the team can review and override later if needed.

## Core Decision

Use a `Pair Scores` sheet.

This means the system compares:

```text
Every eligible mentee
against
every available mentor
```

It does not assign every mentee to every mentor. It only compares them.

Final output remains:

```text
One mentee -> one mentor
```

## Matching Sheets

| Sheet | Purpose |
| --- | --- |
| `Pair Scores` | Stores every mentor/mentee comparison that Gemini has scored. |
| `Match Recommendations` | Stores the system-selected best mentor for each mentee, with decision notes. |
| `Matched Pairs` | Stores the final auto-created mentor/mentee assignments. |
| `Run Log` | Stores automation activity and errors. |

## Eligible Mentees

Use `Mentee Scores` as the source for eligible mentees.

A mentee is eligible when:

- `Final Score >= 60`,
- `Gemini Review Status = Can Pair`,
- `Mentee ID` is present,
- `Mentee Email` is present.

Mentees below 60 are not auto-matched in version 1.

## Available Mentors

Use `Mentor Source Snapshot` as the source for mentors.

A mentor is available when:

- `Mentor ID` is present,
- mentor name/email are present,
- capacity can be read or defaulted,
- assigned count is below flexible capacity.

Flexible capacity:

```text
Flexible Capacity = Stated Capacity + 2
```

The system should prefer staying within stated capacity first, but it may use the extra 2 slots when needed.

## Pair Scores

For each eligible mentee and each available mentor, Gemini scores the pair.

Pair score categories:

| Category | Weight |
| --- | ---: |
| Skill fit | 40 |
| Career fit | 30 |
| Availability fit | 15 |
| Capacity fit | 15 |
| Total | 100 |

The `Pair Scores` tab stores one row per mentee/mentor comparison.

## Gemini Use

Gemini is part of the match decision, not only the explanation.

The first implementation should provide:

```text
Generate next pair score
```

This button scores one unscored pair and saves it.

It must:

- skip pairs already scored,
- stop safely when Gemini quota is reached,
- preserve existing pair scores,
- allow the team to resume later.

## Auto-Matching

The first implementation should provide:

```text
Auto-match from pair scores
```

Matching process:

1. Sort eligible mentees by `Final Score` descending.
2. For each mentee, find scored pair rows for available mentors.
3. Choose the mentor with the highest `Total Pair Score`.
4. Respect flexible mentor capacity.
5. Write the selected result to `Match Recommendations`.
6. Write the final assignment to `Matched Pairs`.
7. Mark the match as `Auto-Matched`.
8. Mark review as `Pending Review`.

If a mentor becomes full, the next mentee should use the next-best available mentor.

## Matching Requirement

Before assigning a mentee, the system should score all currently available mentors for that mentee.

This gives the fairest possible comparison, but it may take time because it requires many Gemini calls.

Example:

If there are:

- 50 eligible mentees,
- 10 available mentors,

then up to:

```text
50 x 10 = 500 pair scores
```

may be created.

## Review After Automation

The team reviews after the system has created matches.

`Matched Pairs` should include fields for:

- `Match Status`,
- `Review Status`,
- `Override Notes`.

## Out Of Scope For First Build

- Sending final match emails.
- Automatically notifying mentors or mentees.
- Web app display.
- WhatsApp messaging.
- Manual drag-and-drop matching UI.
