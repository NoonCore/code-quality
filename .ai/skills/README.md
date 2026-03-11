# AI Skills for Code Quality Library

These skill files teach AI coding assistants (Cursor, Copilot, Windsurf, Cline, etc.) to follow this project's coding standards automatically.

## How to Use

### Cursor / Windsurf

Add these files to your AI rules or context:

- Copy contents to `.cursorrules`, `.windsurfrules`, or project-level AI settings
- Or reference them as context files in your IDE settings

### ChatGPT / Claude / Other LLMs

Paste the relevant skill file contents as system prompts or context before asking the AI to write code.

### Custom Setup

Concatenate the skills you need:

```bash
cat .ai/skills/general.md .ai/skills/typescript.md .ai/skills/eslint.md > .ai-rules.md
```

## Available Skills

| Skill          | File            | Description                                         |
| -------------- | --------------- | --------------------------------------------------- |
| **General**    | `general.md`    | Project structure, conventions, and universal rules |
| **TypeScript** | `typescript.md` | Type safety, strict mode, and TS compiler rules     |
| **ESLint**     | `eslint.md`     | Linting rules, import ordering, code quality        |
| **Prettier**   | `prettier.md`   | Formatting rules (quotes, semicolons, spacing)      |
| **Knip**       | `knip.md`       | Dead code prevention, export hygiene                |
| **React**      | `react.md`      | React/JSX patterns, hooks rules, component design   |

## Composing Skills

Skills are designed to be **composable**. Pick only what applies to your project:

- **Node.js CLI project** → `general.md` + `typescript.md` + `eslint.md` + `prettier.md`
- **React web app** → all skills
- **Library package** → `general.md` + `typescript.md` + `eslint.md` + `prettier.md` + `knip.md`

## Extending

Create your own skill files in this directory for project-specific rules:

```
.ai/skills/your-project-rules.md
```

Follow the same format: clear headings, DO/DON'T examples, and concise rules.
