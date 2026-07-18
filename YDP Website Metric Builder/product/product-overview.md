# YDP Mentorship Hub

## Description
A web dashboard for the YDP mentorship program that turns the matches spreadsheet into a live, searchable view. It shows program-wide metrics, lets a mentee look up their matched mentors ranked by match score, and lets a mentor see the mentees matched to them — all read directly from Google Sheets.

## Problems & Solutions

### Problem 1: No at-a-glance view of the program
Coordinators can't quickly see how many mentees, mentors, and matches exist, or how healthy those matches are. The overview dashboard reads the matches sheet live and shows totals, average pair score, track distribution, and status/risk breakdowns.

### Problem 2: A mentee can't easily see who they're matched with
Each mentee is matched to multiple mentors and scored, but that lives in a wide spreadsheet. The mentee lookup lets them enter their ID and see all their matched mentors, ranked by pair score, with track and status.

### Problem 3: A mentor can't see their matched mentees
Mentors have to scan the sheet to find who they're paired with. The mentor lookup lets them enter their ID and see every mentee matched to them, with score, track, and match status.

### Problem 4: Match health and progress are hard to track
Risk, missed sessions, check-ins, and review status are buried across many columns. The dashboard surfaces at-risk and pending-review matches so coordinators can act.

### Problem 5: The full match list is hard to browse
The raw sheet isn't friendly for scanning. A searchable directory presents every match in a clean, filterable table (by track, status, score, risk).

## Key Features
- Overview dashboard: total mentees, mentors, and matches, plus average pair score and track distribution
- Mentee lookup by ID: matched mentors ranked by pair score
- Mentor lookup by ID: matched mentees with scores and status
- Match health view: risk status, pending reviews, missed sessions, check-ins
- Searchable, filterable directory of all matches
- Google Sheets as the live data source — the team keeps managing matches where they already do
- Pair score read from the Notes field today, with room for a dedicated score column later
