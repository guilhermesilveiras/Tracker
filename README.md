# Tracker

A self-contained academic-progress tracking demo with a **fictional curriculum**. This is an independent, minimal adaptation of the author’s personal progress-tracking concept. It is **not an official university application** and is not associated with any educational institution.

## Features

- Eight sample terms and fictitious course catalog
- Status tracking: not started, planned, in progress, and completed
- Mutually exclusive capstone alternatives (no double-counting)
- Electives, supplementary activities, and progress calculations
- Browser-local persistence, JSON backup and reset
- Responsive design with light/dark themes
- No server, external API, analytics, third-party personal data, or bundled libraries

## Run locally

Run any simple HTTP server in this directory:

```bash
python3 -m http.server 8000 --bind 127.0.0.1
```

Open http://127.0.0.1:8000 . The application uses JavaScript ES modules, so opening `index.html` via `file://` is not recommended.

## Tests and basic audit

Node.js 20+ and Python 3.10+:

```bash
npm test
python3 scripts/audit.py
```

No npm packages or Python packages need to be installed.

## Privacy and security

This project uses **only fictional sample curriculum data**. You do not need an account, name, university ID or any personal record. Data stays in local browser storage under `tracker.*`. The JSON import accepts only a fixed set of statuses and numerical activity hours. Never put real student transcripts, credentials, or third-party data into this demo.

## Scope

The code deliberately does not include the original Affix project's university-specific source documents, transcript import, PDF.js bundle, integrations, or inherited Git history. This demo is not intended to represent the author's university’s formal degree requirements.

## Licensing

MIT License. See [LICENSE](./LICENSE).
