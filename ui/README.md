# Studyverse interface

`tracker.html` is now the document shell. It no longer contains the entire application.

- `core.js`: state loading, rendering, and shared utilities
- `views/dashboard.js`: Today mission, exam countdown, revision planner, and celebrations
- `views/syllabus.js`: syllabus and tests view components
- `events.js`: checklist and navigation events
- `cloud-sync.js`: account-specific saving and conflict handling
- `views/themes.js`: themes, appearance settings, and state normalization
- `views/timer.js`: stopwatch, countdown, and study log
- `views/groups.js`: membership, invitations, and study board
- `views/shared-room.js`: shared focus room, progress ring, and optional audio
- `views/calendar.js`: calendar views and exports
- `styles/`: base styles and Today dashboard styles
- `bootstrap.js`: application startup

`lib/tracker-page.ts` assembles these view components server-side, preserving the existing hosting/authentication integration. These files share the classic script scope; edits to one feature no longer require editing an enormous HTML file. `tests/tracker-source.mjs` builds the same document for tests. No framework migration or client build dependency is required.
