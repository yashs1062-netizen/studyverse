# Studyverse

A customisable CA Intermediate study tracker with account-based cloud saving.

Live website: https://studyverse.honedtoast.chatgpt.site

## Features

- Dashboard with exam countdown and Group 1 / Group 2 / All subjects selection
- Subject and chapter tracking with Study, Revision 1 and Revision 2 milestones
- CA Intermediate Group 1 chapter templates and Direct Tax / GST filters
- Stopwatch, countdown timer, manual study logs and CSV export
- Study groups with opt-in sharing and a shared focus room
- Customisable monthly calendars, printable PDF, CSV and calendar exports
- Twelve themes, theme-specific navigation icons and responsive mobile layouts
- Account-isolated cloud data, offline pending changes and conflict handling

## Development

Requires Node.js 22.13 or later.

```sh
npm run install:ci
npm run dev
```

Build with `npm run build`. Production runs on the Sites hosting platform using Cloudflare Workers and D1. Authentication is provided by Sites; opening the HTML file alone does not provide cloud saving. See [hosting documentation](docs/hosting.md) for platform configuration, local database migrations and deployment details.

## Source layout

- `tracker.html`: application shell
- `ui/`: styles, dashboard, syllabus, timer, groups, calendar and cloud sync
- `lib/tracker-page.ts`: assembles the application from UI source files
- `app/api/`: authenticated tracker, study-group and PDF endpoints
- `db/` and `drizzle/`: database schema and migrations
- `public/` and `assets/`: logo, icons, manifest and PDF font
- `tests/`: source, persistence, timer, calendar and group checks

This repository contains application source, migrations and dependency lockfiles. It excludes dependencies, generated builds, credentials, user backups and production user data.

Chapter templates use shortened topic labels. Group 1 templates follow ICAI material labelled May 2027 onward; Taxation is labelled for May/September 2027 and January 2028. Confirm applicability for your examination attempt using the ICAI links within the app.
