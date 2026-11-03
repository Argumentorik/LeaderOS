# Design Skills — Anti-Slop Premium Frontend

Six skills from [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill)
embedded for consistent Apple-grade design DNA across Claude Code sessions.

## Available skills

| Skill | When to use |
|---|---|
| **taste-skill** | Core anti-slop framework. Premium frontend defaults. |
| **minimalist-skill** | Apple-style clean / dark-mode UIs. |
| **soft-skill** | Friendly rounded UI (good for leader-check funnel). |
| **gpt-tasteskill** | GSAP motion + editorial typography + AIDA structure. |
| **redesign-skill** | Polish existing UI (e.g. /my-path refactors). |
| **image-to-code-skill** | Screenshot → production code. |

## How to invoke

In any Claude Code session inside this repo, the skills are auto-loaded
from `.claude/skills/`. Reference them by name:

```
Apply the taste-skill to /my-path before promoting.
Use minimalist-skill defaults for the new pricing page.
```

## License

Skills are MIT-licensed. See `TASTE_SKILL_LICENSE`.
Original repo: https://github.com/Leonxlnx/taste-skill

## Why these skills, not others

We skipped:
- `brutalist-skill` — doesn't match our brand
- `brandkit` / `imagegen-*` — Wlad's brand identity is already locked
- `stitch-skill` — overkill for our component patterns
