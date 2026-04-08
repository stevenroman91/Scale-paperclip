---
name: design-system
description: Reference du design system Scale — tokens Tailwind, composants Radix UI, patterns de layout, guidelines d'accessibilite
slug: design-system
---

# Scale Design System

Comprehensive design system reference for ScaleHQ — Tailwind CSS + Radix UI + shadcn/ui conventions.

## Color Palette

### Light Mode

| Token         | Tailwind Class | Hex       | Usage                                          |
|---------------|----------------|-----------|-------------------------------------------------|
| Primary       | `blue-600`     | `#2563EB` | CTAs, links, active states, selected items       |
| Primary Hover | `blue-700`     | `#1D4ED8` | Button hover, link hover                         |
| Secondary     | `slate-700`    | `#334155` | Body text, headings, labels                      |
| Secondary Light| `slate-500`   | `#64748B` | Placeholder text, secondary labels, timestamps   |
| Success       | `green-600`    | `#16A34A` | Success toasts, positive status badges, checkmarks|
| Warning       | `amber-500`    | `#F59E0B` | Warning alerts, pending status, caution indicators|
| Error         | `red-600`      | `#DC2626` | Error messages, destructive actions, validation errors|
| Background    | `white`        | `#FFFFFF` | Page background, card background                 |
| Surface       | `slate-50`     | `#F8FAFC` | Section backgrounds, table row stripes, sidebar bg|
| Border        | `slate-200`    | `#E2E8F0` | Card borders, dividers, input borders             |

### Dark Mode

| Token         | Tailwind Class    | Hex       | Usage                                     |
|---------------|-------------------|-----------|-------------------------------------------|
| Background    | `slate-900`       | `#0F172A` | Page background                           |
| Surface       | `slate-800`       | `#1E293B` | Card background, sidebar                  |
| Text Primary  | `slate-100`       | `#F1F5F9` | Headings, body text                       |
| Text Secondary| `slate-400`       | `#94A3B8` | Secondary labels, placeholders             |
| Border        | `slate-700`       | `#334155` | Card borders, dividers                    |
| Primary       | `blue-500`        | `#3B82F6` | Slightly lighter for dark bg contrast     |

Dark mode is toggled via `next-themes` with class strategy on `<html>`. All components use CSS variables mapped in `globals.css`.

## Typography

Font family: **Inter** (loaded via `next/font/google`).

| Element  | Tailwind Classes           | Size  | Weight     | Line Height | Usage                          |
|----------|----------------------------|-------|------------|-------------|--------------------------------|
| h1       | `text-3xl font-bold`       | 30px  | 700 (bold) | 36px        | Page titles                    |
| h2       | `text-2xl font-semibold`   | 24px  | 600        | 32px        | Section headings               |
| h3       | `text-xl font-semibold`    | 20px  | 600        | 28px        | Card titles, subsection heads  |
| h4       | `text-lg font-medium`      | 18px  | 500        | 28px        | Group labels                   |
| body     | `text-base` or `text-sm`   | 16/14px| 400       | 24/20px     | General content                |
| small    | `text-xs`                  | 12px  | 400        | 16px        | Timestamps, badges, help text  |
| label    | `text-sm font-medium`      | 14px  | 500        | 20px        | Form labels                    |
| code     | `font-mono text-sm`        | 14px  | 400        | 20px        | Inline code, API keys          |

Use `text-sm` (14px) as the default body text in dashboard views (data-dense). Use `text-base` (16px) for marketing/landing pages and long-form content.

## Spacing System

Based on a 4px grid. The Tailwind spacing scale:

| Token | Class  | Value | Common Use                              |
|-------|--------|-------|-----------------------------------------|
| 1     | `p-1`  | 4px   | Tight padding (badges, inline elements) |
| 2     | `p-2`  | 8px   | Compact padding (table cells, chips)    |
| 3     | `p-3`  | 12px  | Input padding, small cards              |
| 4     | `p-4`  | 16px  | Standard padding (cards, sections)      |
| 6     | `p-6`  | 24px  | Section padding, modal content          |
| 8     | `p-8`  | 32px  | Page-level padding, large sections      |
| 12    | `p-12` | 48px  | Hero sections, major spacing            |

Gaps between elements: use `gap-2` (8px) for tight groups, `gap-4` (16px) for standard, `gap-6` (24px) for section separation.

## Components (Radix UI / shadcn/ui)

All components are in `components/ui/` directory, built on Radix UI primitives with Tailwind styling via the `cn()` utility from `lib/utils.ts`.

### Button

Variants: `default` (primary blue), `secondary` (slate outline), `ghost` (transparent), `destructive` (red), `outline` (bordered), `link` (underlined text).

Sizes: `sm` (h-8 px-3 text-xs), `default` (h-10 px-4 text-sm), `lg` (h-12 px-6 text-base), `icon` (h-10 w-10).

```tsx
<Button variant="default" size="default">Save Changes</Button>
<Button variant="destructive" size="sm">Delete</Button>
<Button variant="ghost" size="icon"><Icons.settings /></Button>
```

### Form Inputs

| Component | File                    | Notes                                          |
|-----------|-------------------------|-------------------------------------------------|
| Input     | `components/ui/input.tsx`| Text input, h-10, border-slate-200, focus:ring-blue-600 |
| Select    | `components/ui/select.tsx`| Radix Select with search, supports groups      |
| Textarea  | `components/ui/textarea.tsx`| Auto-resize option, min-h-20                |
| Checkbox  | `components/ui/checkbox.tsx`| Radix Checkbox, blue-600 when checked        |
| Radio     | `components/ui/radio-group.tsx`| Radix RadioGroup with label             |
| Switch    | `components/ui/switch.tsx`| Toggle switch, blue-600 when active            |
| DatePicker| `components/ui/date-picker.tsx`| Calendar popover, uses date-fns         |

### Overlay Components

| Component    | Trigger                | Use Case                                    |
|-------------|------------------------|---------------------------------------------|
| Dialog      | Button click           | Confirmations, forms, detail views          |
| Sheet       | Button click           | Side panels (mobile nav, filters, detail)   |
| Popover     | Click or hover         | Quick actions, mini forms, color pickers    |
| Tooltip     | Hover (300ms delay)    | Help text, truncated text expansion         |
| DropdownMenu| Right-click or button  | Context menus, action menus                 |
| AlertDialog | Destructive action     | "Are you sure?" confirmations               |

### Data Display

| Component | Usage                                              |
|-----------|----------------------------------------------------|
| Table     | Data tables with sorting, filtering, pagination (uses @tanstack/react-table) |
| Card      | Content containers (rounded-lg border shadow-sm p-6) |
| Badge     | Status indicators, tags (variants: default, success, warning, error, outline) |
| Avatar    | User profile images (rounded-full, fallback to initials) |
| Tabs      | Content switching (Radix Tabs, underline variant)  |

### Feedback

| Component | Library   | Usage                                         |
|-----------|-----------|-----------------------------------------------|
| Toast     | Sonner    | Success/error/info notifications (bottom-right, auto-dismiss 5s) |
| Progress  | Radix     | Progress bars (file uploads, onboarding steps) |
| Skeleton  | Custom    | Loading placeholders (animate-pulse bg-slate-200) |
| Spinner   | Custom    | Inline loading indicator (animate-spin)       |

## Layout Patterns

### Dashboard Layout (Sidebar + Main Content)

```
+--sidebar (w-64)--+--main content (flex-1)---------------+
|  Logo            |  Header (h-16, border-b)              |
|  Navigation      |  Page content (p-6)                   |
|  - Dashboard     |    [Breadcrumb]                       |
|  - Calls         |    [Page Title h1]                    |
|  - RDV           |    [Action buttons]                   |
|  - Enrichment    |    [Content area]                     |
|  - E-Learning    |                                       |
|  - Settings      |                                       |
|  User avatar     |                                       |
+------------------+---------------------------------------+
```

- Sidebar: fixed on desktop, Sheet overlay on mobile (<768px)
- Main content: scrollable, min-h-screen
- Header: sticky top-0, contains breadcrumb + user menu

### Data Table Layout

```
+--filters bar (flex gap-2 mb-4)---------------------------+
| [Search input] [Status filter] [Date range] [Export btn] |
+--table (rounded-lg border)-------------------------------+
| Header row (bg-slate-50 font-medium text-xs uppercase)   |
| Data row (border-b hover:bg-slate-50)                    |
| Data row                                                  |
| Data row                                                  |
+--pagination (flex justify-between p-4)-------------------+
| Showing 1-10 of 234        [< Prev] [1] [2] [3] [Next >]|
+----------------------------------------------------------+
```

### Two-Column Form (Settings Pages)

```
+--left (w-1/3)------------+--right (w-2/3)----------------+
| Section title (h3)       | Form fields in Card            |
| Section description      | [Label + Input]                |
| (text-sm text-slate-500) | [Label + Select]               |
|                          | [Save button]                  |
+--------------------------+--------------------------------+
```

### Full-Width (Landing/Marketing)

```
+--container (max-w-7xl mx-auto px-4)----------------------+
| Hero section (py-20 text-center)                          |
| Features grid (grid-cols-3 gap-8)                         |
| CTA section (bg-blue-600 text-white py-16)                |
| Footer (border-t py-8)                                    |
+----------------------------------------------------------+
```

## Responsive Breakpoints

| Breakpoint | Prefix | Min Width | Typical Layout Change                      |
|------------|--------|-----------|--------------------------------------------|
| Default    | (none) | 0px       | Mobile-first, single column, stacked       |
| sm         | `sm:`  | 640px     | Small tablets, two-column where appropriate|
| md         | `md:`  | 768px     | Tablets, sidebar becomes visible            |
| lg         | `lg:`  | 1024px    | Desktop, full sidebar + content layout      |
| xl         | `xl:`  | 1280px    | Wide desktop, larger content area           |
| 2xl        | `2xl:` | 1536px    | Ultra-wide, max-width containers            |

Key responsive patterns:
- Sidebar: hidden on mobile (Sheet), visible from `md:` breakpoint
- Tables: horizontal scroll on mobile, full display from `lg:`
- Grid cards: 1 column mobile, 2 columns `sm:`, 3 columns `lg:`
- Forms: full-width on mobile, two-column from `lg:`

## Accessibility Guidelines (WCAG 2.1 AA)

### Color Contrast
- Normal text (< 18px): minimum 4.5:1 contrast ratio
- Large text (>= 18px bold or >= 24px): minimum 3:1 contrast ratio
- Interactive elements (buttons, links): minimum 3:1 against background
- Verified combinations: blue-600 on white (4.6:1), slate-700 on white (8.6:1), white on blue-600 (4.6:1)

### Focus Management
- All interactive elements have visible focus rings: `focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2`
- Tab order follows visual layout (no `tabindex` > 0)
- Modal dialogs trap focus (Radix handles this automatically)
- Skip-to-content link as first focusable element

### ARIA
- All form inputs have associated `<label>` elements (or `aria-label`)
- Icon-only buttons have `aria-label` describing the action
- Dynamic content updates use `aria-live` regions (toast notifications, loading states)
- Data tables use proper `<th scope="col">` and `<th scope="row">`
- Navigation landmarks: `<nav>`, `<main>`, `<aside>` for sidebar

### Keyboard Navigation
- All functionality accessible via keyboard (no mouse-only interactions)
- Escape closes modals, popovers, dropdowns
- Arrow keys navigate within dropdown menus and radio groups
- Enter/Space activates buttons and toggles
- Radix UI primitives handle keyboard interactions by default

### Icons
- Icon library: `lucide-react`
- Default size: 16px (`h-4 w-4`) inline, 20px (`h-5 w-5`) standalone
- Decorative icons: `aria-hidden="true"`
- Meaningful icons: `aria-label` or accompanying visible text
- Color: inherit text color (`currentColor`), never rely on color alone for meaning

## Naming Conventions

- **CSS classes**: use `cn()` utility for composing Tailwind classes (from `lib/utils.ts`)
- **Components**: PascalCase (e.g., `CallsTable`, `FeedbackWidget`)
- **Files**: kebab-case (e.g., `calls-table.tsx`, `feedback-widget.tsx`)
- **CSS variables**: defined in `globals.css` using `--` prefix (e.g., `--primary`, `--background`)
- **Tailwind config**: extended tokens in `tailwind.config.ts` under `theme.extend`
