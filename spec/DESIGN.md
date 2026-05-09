---
name: Zenith Fitness System
colors:
  surface: '#f9f9f7'
  surface-dim: '#dadad8'
  surface-bright: '#f9f9f7'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f4f4f2'
  surface-container: '#eeeeec'
  surface-container-high: '#e8e8e6'
  surface-container-highest: '#e2e3e1'
  on-surface: '#1a1c1b'
  on-surface-variant: '#424842'
  inverse-surface: '#2f3130'
  inverse-on-surface: '#f1f1ef'
  outline: '#737972'
  outline-variant: '#c2c8c0'
  surface-tint: '#4a654e'
  primary: '#4a654e'
  on-primary: '#ffffff'
  primary-container: '#8ba88e'
  on-primary-container: '#233d29'
  inverse-primary: '#b0ceb2'
  secondary: '#635e54'
  on-secondary: '#ffffff'
  secondary-container: '#e7dfd2'
  on-secondary-container: '#676258'
  tertiary: '#55615e'
  on-tertiary: '#ffffff'
  tertiary-container: '#96a3a0'
  on-tertiary-container: '#2e3a38'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#cceace'
  primary-fixed-dim: '#b0ceb2'
  on-primary-fixed: '#07200f'
  on-primary-fixed-variant: '#334d38'
  secondary-fixed: '#eae1d5'
  secondary-fixed-dim: '#cdc5ba'
  on-secondary-fixed: '#1f1b14'
  on-secondary-fixed-variant: '#4b463d'
  tertiary-fixed: '#d8e5e2'
  tertiary-fixed-dim: '#bcc9c6'
  on-tertiary-fixed: '#121e1c'
  on-tertiary-fixed-variant: '#3d4947'
  background: '#f9f9f7'
  on-background: '#1a1c1b'
  surface-variant: '#e2e3e1'
typography:
  display-lg:
    fontFamily: Quicksand
    fontSize: 32px
    fontWeight: '300'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Quicksand
    fontSize: 24px
    fontWeight: '400'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Quicksand
    fontSize: 20px
    fontWeight: '500'
    lineHeight: 28px
  body-lg:
    fontFamily: Quicksand
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Quicksand
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Quicksand
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Quicksand
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
  headline-lg-mobile:
    fontFamily: Quicksand
    fontSize: 28px
    fontWeight: '300'
    lineHeight: 36px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
  xxl: 64px
  container-margin: 24px
  gutter: 16px
---

## Brand & Style

The design system is rooted in **Organic Minimalism**, a style that prioritizes mental clarity and physical well-being. It is designed for individuals seeking a sanctuary from the high-intensity, "hustle-culture" aesthetics of traditional fitness apps. The goal is to evoke a sense of "digital breathing room" through generous whitespace and a reduction of visual noise.

The interface utilizes soft, natural transitions and a "quiet" visual hierarchy. It avoids aggressive calls to action, instead using subtle tonal shifts and delicate iconography to guide the user. The atmosphere is calm, rhythmic, and meditative, ensuring that the process of tracking fitness feels like a restorative practice rather than a chore.

## Colors

The palette is inspired by nature—specifically stone, leaf, and sand. 

- **Primary (Sage Green):** Used for primary actions, progress indicators, and active states. It represents growth and vitality without being overstimulating.
- **Secondary (Delicate Beige):** Used for secondary surfaces, subtle backgrounds, and grouping related elements.
- **Tertiary (Muted Grey):** Provides balance and is used for non-essential icons or inactive states.
- **Neutral/Background:** Pure white is the primary canvas to ensure maximum readability, while the off-white neutral is used for section containers to create a soft layered effect.
- **Status Colors:** Use desaturated pastels for alerts (e.g., a soft dusty rose for errors) to maintain the "Zen" atmosphere.

## Typography

This design system uses **Quicksand** exclusively to leverage its rounded terminals and open apertures, which feel friendly and approachable. 

The typographic scale emphasizes lightness. Use the `Light (300)` weight for large display text to create an elegant, airy feel. Reserve `Medium (500)` for labels and buttons to ensure legibility against soft backgrounds. Avoid `Bold` weights entirely to prevent the UI from feeling "heavy" or aggressive. Paragraphs should use generous line-height to improve the reading rhythm.

## Layout & Spacing

The layout philosophy follows a **Fluid "Safe Area" Model**. Rather than a rigid column grid, the design system relies on wide margins (24px on mobile) and substantial vertical "breathing zones" (40px–64px) between distinct sections.

- **Whitespace:** Never crowd elements. If a screen feels busy, increase the `xxl` spacing between modules.
- **Alignment:** Center-alignment is preferred for hero states and empty states to reinforce the "Zen" balance.
- **Dividers:** Use 1px hair-line dividers in `divider_hex` only when necessary; prefer using whitespace or subtle background color shifts (`neutral_color_hex`) to separate content.

## Elevation & Depth

This design system rejects heavy shadows in favor of **Tonal Layering** and **Soft Ambient Occlusion**.

1.  **Surfaces:** The base layer is pure white. Secondary containers use a subtle beige (`secondary_color_hex` at 20% opacity) or sage-tinted neutrals.
2.  **Shadows:** When depth is required (e.g., for a primary card), use an extremely diffused shadow: `0px 10px 30px rgba(139, 168, 142, 0.08)`. The shadow should have a slight tint of the primary sage color rather than pure black to keep the look organic.
3.  **Glassmorphism:** Use sparingly for navigation bars or overlays. A 12px backdrop blur with a 40% white tint creates a clean, ethereal transition between views.

## Shapes

The shape language is consistently **Rounded**. There are no sharp corners in this design system, as they evoke tension. 

Standard components (buttons, inputs) use a 0.5rem radius. Larger containers, like workout summary cards or modal sheets, utilize the `rounded-xl` (1.5rem) setting to feel like "smooth river stones." Icons should always have rounded caps and joins to match the typography.

## Components

- **Buttons:** Primary buttons are filled with Sage Green with white text. Secondary buttons use a Sage outline (1px) or a ghost style with Medium weight text. Avoid high-contrast black buttons.
- **Cards:** Cards should have no borders. Use a soft off-white background or the ambient shadow described in the Elevation section. Internal padding should be at least `lg` (24px).
- **Inputs:** Use a soft beige background with a 1px border that turns Sage on focus. Labels sit above the field in `label-md` style.
- **Progress Bars:** Thin, 4px-height bars with rounded caps. Use a desaturated Sage for the fill and the neutral beige for the track.
- **Pastel Icons:** Icons should be dual-tone or monochromatic using the primary/tertiary colors at low saturation. They should feel like "illustrations" rather than functional "tools."
- **Chips:** Used for filtering workouts (e.g., "Yoga", "Meditation"). Pill-shaped with a light sage background and darker sage text.