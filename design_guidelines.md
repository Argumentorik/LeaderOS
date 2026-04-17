# WLADHUB Design Guidelines — Leader-OS Branding

## Identity
- **Aesthetic**: Minimalist Editorial Noir (leader-os.de Branding)
- **Core Philosophy**: "Die Zukunft gehort KI-nativen Fuhrungskraften."
- **Emotional Tone**: Authoritative, Clean, Premium, High-Stakes
- **Theme**: Dark Mode Only

---

## Color System

| Token | Hex | Usage |
|---|---|---|
| **Background** | `#0a0a0a` | Page backgrounds, nav bg |
| **Surface** | `rgba(255,255,255,0.025)` | Cards, glass panels |
| **Accent (Lime)** | `#C8FF00` | ALL accent elements: buttons, badges, highlights, icons, gradients |
| **Text Primary** | `#FFFFFF` | Headings, important text |
| **Text Secondary** | `#94A3B8` (slate-400) | Body text, descriptions |
| **Text Muted** | `#64748B` (slate-500) | Labels, fine print |
| **Border** | `rgba(255,255,255,0.06)` | Card borders, dividers |
| **Border Active** | `rgba(200,255,0,0.2)` | Hover/active states |
| **Error** | `#EF4444` | Error states only |

### Key Rule
- **ONE accent color**: `#C8FF00` (Neon Lime) — no blue, no amber, no orange, no purple
- All interactive states, highlights, and progress indicators use Lime

---

## Typography

| Element | Class |
|---|---|
| **Headings Font** | `font-manrope` (Manrope, 400-900) |
| **Body Font** | `font-inter` (Inter, 300-700) |
| **H1** | `font-manrope font-extrabold text-4xl sm:text-5xl lg:text-6xl text-white` |
| **H2** | `font-manrope font-extrabold text-3xl md:text-4xl text-white` |
| **H3** | `font-manrope font-bold text-xl text-white` |
| **Body** | `font-inter text-base text-slate-400` |
| **Small/Label** | `font-inter text-xs text-slate-500 uppercase tracking-[0.2em]` |

Google Fonts Import:
```
https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Manrope:wght@400;600;700;800;900&display=swap
```

---

## Component Styles

### Buttons
| Type | CSS Class | Style |
|---|---|---|
| **Primary** | `.btn-primary` | `bg-[#C8FF00] text-[#0a0a0a] font-bold rounded-[10px]` |
| **Secondary** | `.btn-secondary` | `bg-white/4% border-white/12% text-white rounded-[10px]` |
| **Accent** | `.btn-amber` / `.btn-blue` | Same as Primary (all Lime) |

### Badges
| Type | CSS Class | Style |
|---|---|---|
| **Lime** | `.badge-lime` | `bg-[#C8FF00]/8% border-[#C8FF00]/20% text-[#C8FF00] rounded-[8px]` |
| **Blue/Amber** | `.badge-blue` / `.badge-amber` | Same as Lime (unified) |

### Cards
| Type | CSS Class | Style |
|---|---|---|
| **Glass** | `.glass-card` | `bg-white/2.5% backdrop-blur-20 border-white/6% rounded-[16px]` |
| **Subtle** | `.glass-card-subtle` | `bg-white/2% backdrop-blur-10 border-white/4% rounded-[12px]` |
| **Feature** | `.feature-card` | `bg-white/2% border-white/5% rounded-[16px] hover:border-[#C8FF00]/15%` |

### Text Gradients
```css
.text-gradient-lime {
  background: linear-gradient(135deg, #C8FF00 0%, #a3e600 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
```

### Glow Effects
```css
.card-glow-lime { box-shadow: 0 4px 60px -10px rgba(200, 255, 0, 0.12); }
.hero-glow-center { radial-gradient(ellipse, rgba(200, 255, 0, 0.06) ... transparent 70%); }
```

---

## Layout Rules
- **Container**: `max-w-5xl mx-auto px-4 md:px-8`
- **Section Spacing**: `py-24` between major sections
- **Section Dividers**: `border-t border-white/[0.04]`
- **Card Gaps**: `gap-4` (mobile), `gap-5` (desktop)
- **Text Alignment**: Centered for hero/CTA sections, left-aligned for content

---

## CSS Variables (index.css)
```css
:root {
  --primary: 72 100% 50%;        /* Lime */
  --primary-foreground: 0 0% 4%; /* Black */
  --background: 0 0% 4%;         /* #0a0a0a */
  --foreground: 0 0% 98%;        /* White */
  --border: 0 0% 12%;
  --ring: 72 100% 50%;           /* Lime */
  --lime: #C8FF00;
}
```

---

## PDF Export Colors
```js
const COLORS = {
  bg: [10, 10, 10],       // #0a0a0a
  cardBg: [18, 18, 20],   // Dark surface
  accent: [200, 255, 0],  // #C8FF00
  white: [255, 255, 255],
  gray: [148, 163, 184],
};
```

---

## Icons
- **Library**: Lucide React (`lucide-react`)
- **Style**: Thin/elegant, `w-5 h-5` default
- **Color**: `text-[#C8FF00]` for accent, `text-slate-400` for neutral

## Animations
- **Fade In Up**: `anim-fade-up` (0.7s cubic-bezier)
- **Hover Lift**: `translateY(-4px)` on cards
- **Pulse Dot**: Lime green pulsing indicator for online status
- **Progress Bars**: Solid `#C8FF00` background, no gradients
