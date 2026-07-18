# Application Shell Specification

## Overview
The shell for YDP Mentorship Hub is a dashboard-style frame built around a persistent left sidebar. It presents the product identity (with a Cohort 2 badge), primary navigation to all four sections, and a coordinator user menu. The content area to the right hosts each section's screens. The design uses the indigo/emerald/slate palette with Inter typography and supports light and dark mode.

## Navigation Structure
- Overview Dashboard → Overview Dashboard
- Mentee Lookup → Mentee Lookup
- Mentor Lookup → Mentor Lookup
- Match Directory → Match Directory

## User Menu
Located at the bottom of the sidebar (desktop) and inside the mobile drawer. Shows the signed-in coordinator's avatar (initials fallback), name, and role, with a dropdown containing a Logout action. This is chrome only — no authentication logic.

## Layout Pattern
Left sidebar navigation. A fixed 256px sidebar on desktop holds the brand, nav items with icons, and the user menu. The main content area fills the remaining width and scrolls independently. Active nav items are highlighted with the indigo primary color.

## Responsive Behavior
- **Desktop (lg and up):** Sidebar is always visible on the left; content fills the rest.
- **Tablet (md):** Same as desktop; sidebar remains visible.
- **Mobile (below lg):** Sidebar collapses behind a hamburger button in a top bar. Tapping it slides the sidebar in as an overlay with a dimmed backdrop; tapping the backdrop or a nav item closes it.

## Design Notes
- Primary (indigo) for active nav state, brand mark, and key accents.
- Secondary (emerald) reserved for positive/health signals inside sections.
- Neutral (slate) for backgrounds, borders, and text.
- Fonts: Inter for all UI text; JetBrains Mono for IDs and code-like values.
- Icons from lucide-react.
- Cohort badge ("C2") sits next to the product name so the frame reflects the current cohort.
