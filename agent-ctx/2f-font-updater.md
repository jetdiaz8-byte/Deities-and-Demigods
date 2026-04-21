# Task 2-f: Font Updater — Rulebook Page

## Summary

Applied the fantasy font system (v2.32.0) to `/src/app/rulebook/page.tsx` (1007 lines, 16 tabs).

## Changes Made

### Fonts Applied
| Element | Font Variable | Target |
|---------|-------------|--------|
| Page title "Player's Handbook" | `--font-title` | `Rivendell` — epic title font |
| All 20 CardTitle headings | `--font-heading` | `Wonderland` — decorative fantasy headings |
| All h4/h5 sub-headings (~40+) | `--font-subheading` | `Midwinter Fire` — bold gothic |
| All body text paragraphs | `--font-body` | `Fantasya` — general body text |
| All italic narrative passages | `--font-narrative` | `Wisp` — clean narrative text |
| All 16 tab triggers | `--font-caption` | `Wonder Night` — small text, captions |
| All tip/note/caption blocks | `--font-caption` | `Wonder Night` |
| All badges & metadata | `--font-caption` | `Wonder Night` |
| Table headers | `--font-caption` | `Wonder Night` |
| Navigation buttons | `--font-button` | `Midwinter Fire` — button text |
| "Back to Game" link | `--font-ui` | `Fantasya` — UI labels |
| Root container | `--font-body` | `Fantasya` — fallback for all |

### Fantasy Colors Applied
- **Gold (#D4AF37)**: Main page title, all 20 CardTitle section headings, BookOpen icon in header
- **Emerald (#2ECC71)**: Act I difficulty heading in difficulty tab
- **Crimson (#DC143C)**: Act III difficulty heading in difficulty tab (warning context)

### All 16 Tabs Covered
1. Getting Started ✓
2. Game Structure ✓
3. Turns ✓
4. Characters (4 sub-cards) ✓
5. Success Rate ✓
6. Shards (2 cards) ✓
7. Test of Faith ✓
8. Injuries ✓
9. Items (2 cards) ✓
10. Prophecies ✓
11. Companions ✓
12. Antagonists ✓
13. Saving ✓
14. Achievements ✓
15. Audio & Voice ✓
16. Difficulty ✓

## Method
Used `Write` to rewrite the full file with all inline `style={{ fontFamily: 'var(--font-xxx)' }}` applied systematically. No class names or functionality were changed. All existing imports, data constants, and component logic preserved exactly.

## Lint Result
No new errors introduced. All pre-existing lint issues are in other files (scripts, SidebarDiceArea, useGameAudio).
