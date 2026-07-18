# Mentor Lookup Specification

## Overview
Mentor Lookup lets a mentor find themselves by ID or name and see every mentee matched to them, ranked by pair score. The mentor's profile shows their overall load — how many mentees they carry and their average pair score — and each mentee card shows rank, track, match status, and contact email so the mentor knows who to prioritise and how to reach them.

## User Flows
- A mentor types their mentor ID or name into a search box and selects themselves from the matching results.
- On selection, the mentor sees a profile summary (name, ID, track) with a load summary: total mentees and average pair score.
- The mentor sees a ranked list of their matched mentees, best pair score first.
- The mentor reads each mentee card: rank, mentee name, pair score, track, match status, and email.
- The mentor clicks "Contact" (or the email) on a mentee to reach out.
- If the mentor has no mentees yet, they see a clear "no mentees matched yet" empty state.
- If the search matches no one, they see a "we couldn't find that mentor — check the ID or name and try again" message.

## UI Requirements
- A prominent search input at the top that filters mentors by ID (mono) or name as the user types.
- A results dropdown/list when the query matches multiple mentors; selecting one loads their view.
- A mentor profile header: name, mentor ID (mono), track, plus a load summary showing mentee count and average pair score.
- A ranked list of mentee match cards, sorted by pair score descending. Each card shows: rank badge (#1, #2, …), mentee name, pair score (prominent, mono), track chip, match status badge, and mentee email with a Contact action.
- The top match (#1) is visually emphasized (emerald accent / "Top match" label).
- Empty state when the selected mentor has zero mentees.
- Not-found state when the search yields no mentors.
- Uses indigo primary, emerald for the top match / healthy signals, amber/red for risk. Slate neutrals, Inter type, JetBrains Mono for IDs and scores.
- Responsive: search and cards stack cleanly on mobile; multi-column mentee grid on larger screens.
- Light and dark mode.

## Configuration
- shell: true
