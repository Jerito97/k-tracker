# K-Tracker

A K-drama and Korean movie tracker for a group of friends — implemented from the
Claude Design handoff in `../project/K-Tracker.dc.html` (see `../README.md` and
`../chats/chat1.md` for the original design brief and back-and-forth).

React + TypeScript + Vite, no backend.

## Running it

```bash
npm install
npm run dev
```

## How it works

- **Profiles**: a lightweight "pick who you are" screen (Jero / Flor / Liz) —
  not a login, just identifies whose ratings/episode-bumps you're recording.
- **Persistence**: everything (who you are, statuses, ratings, episode
  progress, discovery adds, stats variant, OMDb key) is saved to
  `localStorage` — no account, no server. Clearing site data resets it.
- **Posters**: fetched from the [OMDb API](https://www.omdbapi.com/apikey.aspx)
  by title/year when you've entered a free API key (gear icon on the tracker
  screen). Without a key, or when a title has no match, each card falls back
  to a generated typographic cover instead of a broken image.
- **Stats**: all three dashboard variants from the design (Barras / Anillos /
  Cintas) are kept, switchable from the stats screen — the design chat never
  narrowed it down to one.

## Structure

- `src/data.ts` — the crew, seed titles, and discovery list (ported from the prototype's mock data).
- `src/state/` — the app's state (context + localStorage) and derived view-model selectors.
- `src/lib/` — the `localStorage` hook and the OMDb client.
- `src/screens/` — the five screens: Gate, Tracker, Detail, Discover, Stats.
- `src/components/` — shared bits: the poster (image or fallback), tab bar, toast, and the OMDb API key sheet.
