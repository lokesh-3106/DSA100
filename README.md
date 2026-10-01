# DSA 100 — 90-Day LeetCode Journey
React + TypeScript + Vite + Tailwind + Lucide. No backend; progress lives in localStorage.

    npm install
    npm run dev      # http://localhost:5173
    npm run build    # production bundle in dist/

## Data
All plan data comes from the Excel file, converted into `src/data/plan.json`.
To grow past 100 problems (250+ in 2027): append to `problems` and `calendar` in that JSON
(next id = 101, ...) and add new topics to `roadmap`. No UI code changes needed.

## Notes
- LeetCode links are auto-built from problem titles (`slug` field). If one 404s, fix its `slug` in plan.json.
- Brute-force / optimized / mistake notes are yours to fill in (Two Sum is pre-filled from the Excel template).
