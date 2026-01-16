# Claude Launcher

A beautiful local dashboard to launch Claude Code terminals in your projects and resume previous sessions.

![macOS](https://img.shields.io/badge/macOS-supported-blue) ![Windows](https://img.shields.io/badge/Windows-coming%20soon-yellow) ![Linux](https://img.shields.io/badge/Linux-coming%20soon-yellow) ![Next.js](https://img.shields.io/badge/Next.js-15-black) ![License](https://img.shields.io/badge/license-MIT-green)

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

## Run as Background Service (Recommended)

Keep Claude Launcher running 24/7 with PM2 - it will auto-start on boot and survive sleep/restart cycles.

### Step 1: Install PM2 and build the app

```bash
# Install PM2 globally
npm install -g pm2

# Build for production
npm run build
```

### Step 2: Start with PM2

```bash
# Start on a custom port (e.g., 3333 to avoid conflicts)
PORT=3333 pm2 start npm --name "claude-launcher" -- run start

# Save the process list
pm2 save
```

### Step 3: Enable auto-start on boot

```bash
# Generate the startup script
pm2 startup
```

This will output a command like:
```bash
sudo env PATH=$PATH:/Users/YOUR_USER/.nvm/versions/node/vXX.X.X/bin pm2 startup launchd -u YOUR_USER --hp /Users/YOUR_USER
```

Copy and run that command to enable auto-start on boot.

### Useful PM2 commands

```bash
pm2 status                    # Check status
pm2 logs claude-launcher      # View logs
pm2 restart claude-launcher   # Restart the app
pm2 stop claude-launcher      # Stop the app
```

## Usage

1. **Add a project** - Click "Add Project", use the folder browser to select your project directory
2. **Launch terminals** - Select how many terminals you want (1-10) and click "Launch"
3. **Resume sessions** - Scroll down to see your recent Claude conversations, click "Resume" to continue any session

## Tech Stack

- **Next.js 15** - React framework with App Router
- **Tailwind CSS** - Styling with custom dark theme
- **better-sqlite3** - Read Claude's session database
- **Web Audio API** - Synthesized sound effects
- **osascript** - Terminal.app automation (macOS)

## Platform Support

| Platform | Status |
|----------|--------|
| macOS | ✅ Fully supported |
| Windows | 🔜 Coming soon |
| Linux | 🔜 Coming soon |

## Requirements

- **macOS** (Windows/Linux support coming soon)
- **Claude Code CLI** installed and configured
- **Node.js 18+**

## License

MIT

---

*Built with Claude Code in one session*
