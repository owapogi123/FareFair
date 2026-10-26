# Farefair V1 — 1.0.0

## Fixes in this release
- Fixed TypeScript TS2322 incompatibility between native React button event handlers and Framer Motion animation handlers in `src/components/ui/Button.tsx` and `src/components/ui/Chip.tsx`.
- Preserved all eight routes, the deep-red UI, existing services, fare logic, and Supabase database integrations.

## Windows installation
1. Extract `Farefair V1.zip`.
2. Copy your existing `.env` from the previous working Farefair folder into this folder. Do not use a secret/service-role key.
3. Open this folder in your IDE terminal.
4. Run `npm install`, then `npm run build`, then `npm run dev`.
5. Keep the old project as a backup until the updated app is working.

## Validation
TypeScript compilation completed with no reported errors in the available validation environment. A full production bundle could not be completed there because the provided dependency tree has Windows-only Rolldown native bindings. Run `npm run build` on Windows as the final verification.
