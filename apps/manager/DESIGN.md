# Manager design direction

> **Status: draft for review.** This direction was written by the agent, not by you. Agent-written direction tends toward default AI taste, so edit anything that does not feel like yours. Nothing in the UI changes until you approve this file.

## Identity

- **What it is:** the private workspace where one person runs their portfolio, blog, CV versions and job applications. Nobody else signs in.
- **Character:** a quiet desk. Content comes first and chrome disappears. Notion is the inspiration for how it works (pages, properties, tables, a slash menu), not a look to copy (R-30).
- **Dial:** ENERGY 1 / RHYTHM 2 / MOTION 1. It is a work tool: calm, predictable, a few deliberate breaks (document pages differ from table pages), motion only for state changes.

## Theme

- Light by default, with a dark toggle in the sidebar footer (system / light / dark). Both modes ship and both get tested (R-21, R-34).
- Neutrals are warm and lean slightly green toward the accent, never a pure mid grey.

| Token | Light | Dark | Use |
|---|---|---|---|
| `--bg` | `#FBFBFA` | `#191A19` | page |
| `--surface` | `#FFFFFF` | `#202221` | tables, popovers |
| `--sidebar` | `#F5F5F3` | `#1D1F1E` | sidebar |
| `--hover` | `#EFEFEC` | `#2A2C2B` | row and item hover |
| `--border` | `#E6E6E2` | `#333634` | hairlines |
| `--fg` | `#2F3130` | `#E7E8E6` | body text |
| `--muted` | `#656865` | `#9A9E9B` | labels, meta |
| `--accent` | `#0B7D59` | `#34C08E` | links, focus ring, primary button, selection |
| `--accent-soft` | `#E4F3EC` | `#173328` | selected row, active nav item |
| `--danger` | `#C4473A` | `#E06B5F` | delete, errors |

- Light accent and muted were darkened from the first draft so text on the page background passes 4.5:1.
- Emerald is the only accent. Status colours (stage, published, draft) use soft tinted pills plus the word, never colour alone.

## Type

- **Inter** for the interface and body text (14px base, 1.55 line height).
- **Source Serif 4** for document page titles only (36px, semibold), so a page reads like a document and a table page reads like a tool.
- **JetBrains Mono** for slugs, ids, code blocks and keyboard hints.
- Scale: 12 / 13 / 14 / 16 / 20 / 28 / 36. Uppercase labels at 11px with 0.06em tracking, used sparingly.

## Layout

- Sidebar 248px, collapsible to 0 with Ctrl+\. Groups: Workspace (Home, Posts, Projects, Experience, Skills, Certifications), Career (CV Studio, Job Tracker, Resume), Audience (Analytics, Newsletter, Contact), System (Settings, API keys).
- Top bar: breadcrumbs on the left, page actions on the right (Share link, more menu). No logo bar, no hero.
- Document pages: centered column, 720px max for text, title, then a properties block (two columns: label in muted, value editable), then content.
- Database pages: full width table with sticky header, row hover, click a cell to edit, filter, sort and group chips above the table, "New" at the bottom of the table.
- Spacing scale 4 / 8 / 12 / 16 / 24 / 32 / 48. Radius 6px for controls, 8px for popovers, nothing pill shaped except status pills.
- Shadows only on floating layers (menus, command palette, dialogs).

## Interaction

- Ctrl+K opens the command palette: jump to any page or record, and run actions (new post, new application, toggle theme).
- `/` in the post editor opens the block menu. Blocks drag by a handle on hover.
- Saves are automatic with a "Saved" status in the top bar, plus Ctrl+S. Conflicts (someone else, or ZIA, saved first) show a banner with Reload.
- Motion: 120ms fades for menus and popovers, nothing else animates.

## Icons

- Lucide stays because the app already uses it everywhere, at 16px with 1.75 stroke and muted colour. No sparkle, robot or magic icons.

## Copy

- Plain labels: "New post", "Publish", "Move to Interview". No em dashes, no buzzwords, no exclamation marks.
