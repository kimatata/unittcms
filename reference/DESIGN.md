# Design System Strategy: Electric Spectrum - Got from Google Stitch Design

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Chromatic Analyst."** 

We are moving away from the cold, sterile aesthetic of traditional financial ledgers toward an experience that feels alive, data-rich, and editorially sophisticated. By replacing heavy blacks with deep indigos and utilizing a vibrant "Electric Spectrum" of gradients, we shift the user’s perception from "inputting data" to "interpreting energy." 

The system breaks the "template" look through **Intentional Asymmetry**. We favor oversized display type paired with compact, high-density data modules. By utilizing overlapping surfaces and a "borderless" philosophy, we create a sense of depth that feels like a physical, high-end dashboard rather than a flat web page.

---

## 2. Colors & Surface Philosophy
The palette is rooted in deep indigos (`primary`) and soft, atmospheric neutrals (`background`), punctuated by high-saturation accents.

### The "No-Line" Rule
**Explicit Instruction:** Do not use 1px solid borders to section off the UI. Containers must be defined solely through background color shifts. For example, a `surface-container-low` module should sit on a `background` floor without a stroke. Separation is achieved through tonal contrast, not structural lines.

### Surface Hierarchy & Nesting
Treat the UI as a series of layered, frosted sheets. Use the `surface-container` tiers to create organic depth:
- **Floor:** `background` (#f5f6ff) – The base layer.
- **Sub-sections:** `surface-container-low` (#eef0fd) – For subtle grouping.
- **Primary Content Cards:** `surface-container-lowest` (#ffffff) – To provide maximum "pop" and legibility.
- **Elevated Interims:** `surface-container-highest` (#d8dcec) – For temporary overlays or sidebars.

### The "Glass & Gradient" Rule
To achieve a premium feel, use **Glassmorphism** for floating elements (e.g., Modals, Navigation Bars). Apply a `surface` color at 70% opacity with a `20px` backdrop-blur. 
**Signature Texture:** Use a linear gradient transitioning from `primary` (#4953ac) to `primary-container` (#929bfa) for main CTAs. This provides a "glow" that flat colors cannot replicate.

---

## 3. Typography: The Editorial Edge
We utilize **Manrope** for its geometric clarity and modern technicality. The hierarchy is designed to feel like a high-end financial magazine.

*   **Display (lg/md/sm):** Use for hero data points or section starters. Set these in **ExtraBold (800)** weight. These should feel authoritative and massive, creating a "visual hook."
*   **Headline & Title:** Set in **Bold (700)**. Use `on_primary_container` for headlines to maintain the deep indigo theme.
*   **Body (lg/md/sm):** Set in **Medium (500)** for high legibility. Avoid "Regular" weights to ensure the text holds its own against vibrant backgrounds.
*   **Labels:** Use **SemiBold (600)** with a slight letter-spacing increase (+0.02rem) for a professional, "labeled" look on data points.

---

## 4. Elevation & Depth
We eschew traditional drop shadows in favor of **Tonal Layering**.

*   **The Layering Principle:** Place a `surface-container-lowest` card atop a `surface-container` section. The subtle shift from `#d8dcec` to `#ffffff` creates a natural lift.
*   **Ambient Shadows:** If a card must "float" (e.g., a hover state), use a shadow with a `24px` blur at 6% opacity. The shadow color must be a tint of our indigo (`primary_dim`), never pure black.
*   **The "Ghost Border" Fallback:** If a container lacks sufficient contrast, use a "Ghost Border": a 1px stroke of `outline_variant` (#aaadb8) at **15% opacity**.
*   **Chromatic Glow:** For active states, use a 2px outer "glow" using the `secondary` (#006859) or `tertiary` (#652fe7) colors at low opacity to signify focus.

---

## 5. Components

### Buttons
*   **Primary:** Gradient-filled (`primary` to `primary_container`), `xl` (1.5rem) roundedness. No border. Text is `on_primary`.
*   **Secondary:** Ghost-style with a `primary` label and a 10% opacity `primary` background. 
*   **Tertiary:** Text-only, using `tertiary` (#652fe7) to draw the eye to alternative actions.

### Cards & Data Lists
*   **Forbid Divider Lines:** Use `spacing-6` (1.5rem) of vertical white space or a subtle shift to `surface-container-low` to separate list items.
*   **Data Cards:** Use `lg` (1rem) corner radius. Apply a "Spectrum Border": a 2px gradient stroke (Teal to Electric Blue) on the left edge only to categorize data types.

### Input Fields
*   **State:** Default backgrounds should be `surface-container-highest`.
*   **Focus:** Transition the background to `surface-container-lowest` and add a subtle `tertiary` (violet) ghost border.
*   **Error:** Use `error` (#b41340) for text and helper icons, but fill the input container with a 5% opacity `error_container` wash.

### Chips & Tags
*   **Analytical Chips:** Small (`sm` radius), using `secondary_container` with `on_secondary_container` text. These should feel like luminous highlights on the page.

---

## 6. Do's and Don'ts

### Do:
*   **Do** use asymmetrical layouts. A sidebar that is wider than traditional standards or a header that overlaps a content card adds "Editorial Soul."
*   **Do** use the `20` (5rem) spacing token for major section breathing room. 
*   **Do** lean into the "Electric" palette for data visualization (Gradients of `tertiary` to `secondary` for charts).

### Don't:
*   **Don't** use pure #000000 or #FFFFFF for text. Always use the `on_surface` or `on_background` tokens to maintain the indigo-tinted harmony.
*   **Don't** use 1px solid dividers. If you feel the need for a line, use a `surface-variant` color block 2px high instead.
*   **Don't** crowd the data. If a dashboard feels "busy," increase the surface nesting depth rather than adding more borders.