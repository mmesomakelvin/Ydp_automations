# Mentee Lookup Specification

## Overview
Mentee Lookup lets a mentee find themselves by ID or name and see every mentor they've been matched with, ranked by pair score. Each mentor is shown with its rank, track, contact email, and the status of that specific pairing, so a mentee immediately knows who their strongest match is and how to reach them.

## User Flows
- A mentee types their mentee ID or name into a search box and selects themselves from the matching results.
- On selection, the mentee sees their profile summary (name, ID, track) and a ranked list of their matched mentors, best pair score first.
- The mentee reads each mentor card: rank, mentor name, pair score, track, match status, and email.
- The mentee clicks "Contact" (or the email) on a mentor to reach out.
- If the mentee has no matches yet, they see a clear "no mentor matched yet" empty state.
- If the search matches no one, they see a "we couldn't find that mentee — check the ID or name and try again" message.

## UI Requirements
- A prominent search input at the top that filters mentees by ID (mono) or name as the user types.
- A results dropdown/list when the query matches multiple mentees; selecting one loads their view.
- A mentee profile header: name, mentee ID (mono), and their track.
- A ranked list of mentor match cards, sorted by pair score descending. Each card shows: rank badge (#1, #2, …), mentor name, pair score (prominent, mono), track chip, match status badge, and mentor email with a Contact action.
- The top match (#1) is visually emphasized (e.g. emerald accent / "Best match" label).
- Empty state when the selected mentee has zero matches.
- Not-found state when the search yields no mentees.
- Uses indigo primary, emerald for the best match / healthy signals, amber/red for risk. Slate neutrals, Inter type, JetBrains Mono for IDs and scores.
- Responsive: search and cards stack cleanly on mobile; multi-column mentor grid on larger screens.
- Light and dark mode.

## Configuration
- shell: true
