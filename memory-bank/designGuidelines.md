# Design Guidelines: Headlines Crossword Game

## Design Philosophy
The game follows a **refined Material Design approach** with emphasis on clarity, simplicity, and professional polish without unnecessary ornamentation.

## Core Design Principles

### 1. **Flat Design**
- **NO gradients** - Use solid colors only
- Clean surfaces with depth created through shadows, not gradients
- Minimal visual noise - let content be the focus

### 2. **Material Design 3.0 Inspired**
- Subtle elevation through carefully crafted shadows
- Card-based layouts with consistent border radius (12-16px)
- Surface hierarchy through shadow depth, not color variation
- Clean, geometric shapes

### 3. **Typography Hierarchy**
- **Primary font**: Inter (with system font fallbacks)
- **Title**: 3.5rem, 800 weight, tight letter-spacing (-0.03em)
- **Headers**: Bold weights (600-700) with clear size differentiation
- **Body text**: Regular weights (400-500) for readability
- Clear visual hierarchy through size and weight, not color

### 4. **Color Palette**
- **Background**: Light gray (#f5f7fa) for subtle contrast
- **Surface cards**: Pure white (#ffffff)
- **Secondary actions**: Blue (#3b82f6) - consistent across secondary CTAs (Next Headline, Replay)
- **Primary CTA**: Orange/Yellow (#f59e0b) - for main call-to-action (Read Full Article)
- **Text hierarchy**: 
  - Primary: #1f2937 (near black)
  - Secondary: #4b5563 (medium gray)
  - Tertiary: #6b7280 (light gray)
  - Muted: #9ca3af (very light gray)

### 5. **Shadow System**
Following Material Design elevation levels:
- **Level 1** (subtle): `0 2px 8px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.04)`
- **Level 2** (medium): `0 4px 12px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04)`
- **Level 3** (elevated): `0 24px 48px rgba(0, 0, 0, 0.2), 0 12px 24px rgba(0, 0, 0, 0.15)`

### 6. **Spacing & Layout**
- Consistent padding: 16px, 20px, 24px, 32px
- Card padding: 20px minimum
- Section margins: 24px-32px
- Breathing room around all elements

### 7. **Interactive Elements**
- Subtle hover states with transform: translateY(-2px)
- Smooth transitions (0.2s ease)
- Clear focus states for accessibility
- No jarring animations

### 8. **Component Styling**

#### Cards
- White background
- Border radius: 12-16px
- Subtle shadows (Level 1 or 2)
- Adequate padding (20-24px)

#### Buttons
- Solid colors, no gradients
- Border radius: 12px
- Clear hover states with elevation change
- Consistent padding (12px 20-24px)

#### Info/Hint Sections
- Light colored backgrounds (#f0f9ff for blue)
- Subtle borders instead of heavy accents
- Simple icons/emojis for visual interest

### 9. **Visual Restraint**
- **Avoid**: Screaming colors, excessive animations, heavy borders, gradients
- **Embrace**: Subtlety, whitespace, clean lines, functional beauty
- Professional appearance without being boring
- Let the game content be the star

### 10. **Consistency**
- Unified visual language across all UI elements
- Same border radius patterns throughout
- Consistent color usage (blue #3b82f6 for secondary actions, orange #f59e0b for primary CTA)
- Predictable interaction patterns

## Implementation Notes
- The playing field (crossword grid) should remain functionally unchanged
- Debug panel maintains its utility-first design
- Victory modal can be more celebratory while still following these principles
- Accessibility through clear contrast and readable typography

## Summary
The design should feel **professional, modern, and refined** - like it was crafted by an experienced UI designer who values clarity and usability over flashy effects. Think "premium simplicity" - high quality through restraint and attention to detail.
