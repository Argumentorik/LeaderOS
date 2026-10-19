# WladBot / LeaderOS — Brand Design Guidelines

## Brand Identity (WLADHUB Consistent)

### Primary Colors
- **Neon Lime (Brand):** `#BFFF00` — CTAs, active states, badges, highlights
- **Brand Dark:** `#9ACC00` — Gradients, secondary accents
- **Dark Lime (Light Mode):** `#4A6200` / `#6B8A00` — Text on white backgrounds

### Backgrounds
- **Dark Mode:** `#0A0A0A` (pure black, like wladhub.com)
- **Light Mode:** `#FAFAFA` (clean white)
- **Cards Dark:** `rgba(255,255,255,0.065)` with `border: rgba(255,255,255,0.12)`
- **Cards Light:** `#FFFFFF` with `border: rgba(0,0,0,0.04)`

### Typography
- **Font:** Inter (400-900)
- **Code:** JetBrains Mono
- **Headings:** letter-spacing: -0.03em, font-weight: 700-900
- **Section Labels:** uppercase, tracking-[0.16em], 9px, font-extrabold

### Button Styles
- **Primary CTA:** `bg-[#BFFF00] text-black hover:bg-[#D4FF4D]` (pill-shaped)
- **Secondary:** `bg-[#0A0A0A] text-white` (dark)
- **Outline:** Border with brand accent on hover

### Active States
- **Dark Mode:** `bg-[#BFFF00]/[0.06] text-[#BFFF00] border-l-2 border-[#BFFF00]`
- **Light Mode:** `bg-[#BFFF00]/[0.07] text-[#4A6200] border-l-2 border-[#6B8A00]`

### Logo
- **Dark Mode:** Neon Lime square with black "W"
- **Light Mode:** Black square with white "W"

### Gradient Text
- **Dark:** `linear-gradient(135deg, #BFFF00, #E0FF66)`
- **Light:** `linear-gradient(135deg, #6B8A00, #4A6200)`

### Animations
- `pulseGlow`: Neon lime shadow pulse
- `fadeIn`, `slideUp`: Standard entrance animations
- `card-premium:hover`: -2px translateY + lime shadow (dark)

### DO NOT USE
- ❌ `indigo-*` classes
- ❌ `violet-*` classes (use `purple-*` for accent only)
- ❌ Purple/violet gradients
