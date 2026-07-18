# Overview Dashboard Specification

## Overview
The Overview Dashboard is the landing view for YDP Mentorship Hub. It turns the matches sheet into live program metrics — headline counts, match quality, distribution by track, and a health panel of items that need attention — so a coordinator can understand the state of Cohort 2 at a glance and drill into anything that needs action.

## User Flows
- Coordinator opens the app and immediately sees headline KPIs: total mentees, total mentors, total matches, and average pair score.
- Coordinator scans track distribution to see how matches are spread across Data Analyst, Data Scientist, Data Engineer, Analytics Engineer, and Machine Learning/AI Engineer.
- Coordinator reviews the health panel to find matches that need attention: at-risk matches, matches pending review, matches with email delivery issues, and low-scoring matches.
- Coordinator clicks a KPI or health card to drill down into the filtered list of matches behind that number.
- Coordinator clicks an individual match to open its details (handled by the directory/lookup sections).

## UI Requirements
- A row of KPI stat tiles at the top: Total Mentees, Total Mentors, Total Matches, Average Pair Score. Each tile is clickable to drill down.
- A track distribution panel using simple horizontal bars showing match count per track.
- A pair-score summary: average score plus a small breakdown of matches by score band (e.g. 90–100, 80–89, below 80).
- A health & attention panel with four cards: At-Risk Matches (list preview), Pending Review (count + preview), Email Delivery Issues (list preview), Low-Score Matches (list preview). Each card is clickable to drill down.
- At-risk and issue lists show mentee name, mentor name, track, pair score, and a status badge; IDs render in mono.
- Uses indigo for primary accents, emerald for positive/healthy signals, amber/red for warnings and risk. Slate neutrals, Inter typography.
- Fully responsive: KPI tiles stack on mobile; panels reflow to a single column.
- Light and dark mode.
- Read-only display; the only interactions are drill-down navigation and opening a match.

## Configuration
- shell: true
