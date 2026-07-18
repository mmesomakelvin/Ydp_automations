# Data Shape

## Entities

### Match
The central record — one row per mentee-to-mentor pairing. Carries the pair score (currently embedded in the Notes field), track, match status (e.g. Auto-Matched), active/review status, risk status, session metrics (start date, last check-in, missed sessions, feedback completion, mentor rating average), and email delivery status for both sides.

### Mentee
A person being mentored, matched to one or more mentors. Identified by a unique mentee ID (e.g. `YDP-C2-Mentee-006`) with name and email. Derived from the matches sheet.

### Mentor
A person mentoring one or more mentees. Identified by a unique mentor ID (e.g. `YDP-C2-Mentor-007`) with name and email. Derived from the matches sheet.

### Track
The domain a match belongs to (e.g. Data Analyst, Data Scientist, Machine Learning/AI Engineer). Matching happens within a track.

## Relationships

- Mentee has many Matches (matched to multiple mentors)
- Mentor has many Matches (matched to multiple mentees)
- Match connects exactly one Mentee and one Mentor
- Match belongs to one Track
