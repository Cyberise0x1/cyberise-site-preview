# Smell Report — Cyberise Landing Prototype (mockup-sandbox)

Date: 2026-08-06
Score: **2/10 — IDENTITY FAILURE**

The current prototype has 8 of the 10 tracked odors. The structural
verdict is **redesign**, not piecemeal repair: too many category reflexes
are baked into the palette, type, and composition at once.

---

## Odors detected

| # | Odor | Where | Reflex | Why it weakens this brief |
|---|------|-------|--------|---------------------------|
| 1 | **Tech gradient** | Hero "Build. Secure. Deploy.", brand logo mark, `text-gradient` utility | indigo-cyan glossy energy plastered on hero + CTA | A VPS/security brand gets the exact look of an AI startup; says nothing about infrastructure |
| 2 | **Generic tech hue** | `--color-brand: #4f7cff` (indigo) as primary identity | blue-purple for anything software-adjacent | Indigo is the median "tech" choice; the palette could be guessed from the industry |
| 3 | **Feature tile grid** | Services (6), Tools (4), Testimonials (3) — icon + heading + one sentence, uniform grid | repeated card grid until sections stop meaning anything | Every card equal; nothing prioritized; no work-pattern reason |
| 4 | **Accent rail** | Hero card borders, plan card "Popular" top border | colored stripe simulating structure | Decoration pretending to organize |
| 5 | **Icon topper** | Every section heading has a rounded-square icon above it | template reflex | The icon carries no function beyond filling space |
| 6 | **Center stack** | Hero, section headers, CTAs all centered | safe-middle composition | No composition decision; the landing becomes the median generated page |
| 7 | **Default type** | Space Grotesk + Inter everywhere | common family with no voice, no scale, no reason | No project-specific typographic decision |
| 8 | **Unearned blur** | `backdrop-blur` on hero cards and navbar | frosted glass with no depth system | Depth is implied but never committed to |

## Close calls (suspicion, not confirmed)

- **Stat monument** — the old site's `StatsBar` used oversized numbers; the
  prototype removed them, but the "Trusted by operators worldwide" section
  risks drifting back if filled with counts. Not present today.
- **Bounce everywhere** — `whileHover: { y: -4 }` on cards uses a spring; this
  is subtle today, but any elastic easing would tip it into toy territory.

## The one original idea worth keeping

The **4-card fan** (Marketplace / Tools / What We Do / Who We Are) is the
strongest idea in the build and belongs to this specific brief. The problem
is not the concept — it is that the generic treatment (indigo glow, cards
fanned on a centered hero) makes even that feel templated.

## What the redesign must do

1. **Kill the indigo-cyan tech gradient** and pick a hue with a reason tied
   to the product: infrastructure, security, control. Not blue-purple.
2. **Build a real type system** — display type with voice, a body face, a
   measure, and a scale; not Space Grotesk + Inter by reflex.
3. **Change the composition** — the 4-card fan should be the hero artifact
   and carry the page; sections beneath should vary in structure, not repeat
   the same centered icon grid.
4. **Remove icon toppers, accent rails, unearned blur.**
5. **Write copy with a voice** — the brief is a marketplace + security
   agency; the words should read like infrastructure, not a startup pitch.
6. **Tint neutrals toward the brand hue** and clamp chroma at extremes.
7. **Keep the 4-card fan** as the centerpiece, restyled with the new system.

Heuristics table (1 = odor absent, 0 = detected):

| Odor | Score |
|------|-------|
| Tech gradient | 0 |
| Generic tech hue | 0 |
| Feature tile grid | 0 |
| Accent rail | 0 |
| Unearned blur | 0 |
| Stat monument | 1 |
| Icon topper | 0 |
| Bounce everywhere | 1 |
| Default type | 0 |
| Center stack | 0 |
| **Total** | **2/10** |
