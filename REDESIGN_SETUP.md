# FareFair PH — Deep Red UI Redesign

## Install / run

1. Keep your existing `.env` file with your Supabase URL and publishable key.
2. Run:

```powershell
npm install
npm run build
npm run dev
```

The redesign adds `framer-motion` as a dependency.

## What changed

- Deep red design tokens and glassmorphism-lite surfaces.
- Outfit / Poppins typography.
- Animated page transitions and active navigation pill.
- Mobile hamburger drawer and sticky blurred navigation.
- New Home hero, animated CTA, interactive quick-action cards, trust tooltips, and audience marquee.
- Wizard transitions and interactive selections in Check My Fare.
- Count-up animation for fare results.
- Expandable animated route cards.
- Animated filters and cards for Discounts, Tourist Prices, and Sources & Proof.
- Smooth report-saved toast notification.
- Shared interactive Card, Button, and Chip components.
- Desktop cursor-follow glow.
- Footer and improved desktop content width.
- Reduced-motion support and visible focus states.

## Data integrity

No fare, route, discount, source, tourism price, or reporting data was moved into local/mock data. Existing Supabase/API services and route logic were preserved.
