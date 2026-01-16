# Claude Launcher

A beautiful local dashboard to launch Claude Code terminals in your projects and resume previous sessions.

![Claude Launcher](https://img.shields.io/badge/macOS-only-blue) ![Next.js](https://img.shields.io/badge/Next.js-15-black) ![License](https://img.shields.io/badge/license-MIT-green)

## Features

- **Quick Launch** - Open multiple Claude Code terminals in any project with one click
- **Session History** - Browse and resume previous Claude conversations from `~/.claude`
- **Folder Browser** - Navigate and select project folders visually (way better than Finder)
- **Beautiful UI** - Dark theme with glass-morphism, smooth animations
- **Sound Effects** - Subtle audio feedback using Web Audio API
- **Filter Sessions** - Filter conversation history by project path

## How It Works

- Reads your Claude session history directly from `~/.claude/__store.db`
- Opens Terminal.app with `claude --dangerously-skip-permissions` via AppleScript
- Stores your project shortcuts locally in `config/projects.json`

## Getting Started

```bash
# Clone the repo
git clone https://github.com/mypickupemail/claude-launcher.git
cd claude-launcher

# Install dependencies
npm install

# Run the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. **Add a project** - Click "Add Project", use the folder browser to select your project directory
2. **Launch terminals** - Select how many terminals you want and click "Launch"
3. **Resume sessions** - Scroll down to see your recent Claude conversations, click "Resume" to continue any session

## Tech Stack

- **Next.js 15** - React framework with App Router
- **Tailwind CSS** - Styling with custom dark theme
- **better-sqlite3** - Read Claude's session database
- **Web Audio API** - Synthesized sound effects
- **osascript** - Terminal.app automation

## Requirements

- **macOS** (uses Terminal.app via AppleScript)
- **Claude Code CLI** installed and configured
- **Node.js 18+**

## License

MIT

---

*Built with Claude Code in one session*
