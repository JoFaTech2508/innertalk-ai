# Local AI Chat

**A private, offline desktop app for chatting with local AI models.**
Everything runs on your machine — no cloud, no API keys, no data leaving your computer.

![macOS](https://img.shields.io/badge/macOS-12%2B-blue?style=flat-square&logo=apple)
![Tauri](https://img.shields.io/badge/Tauri-2-FFC131?style=flat-square&logo=tauri)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

<p align="center">
  <img src="docs/screenshot-chat.png" alt="Local AI Chat" width="800" />
</p>

---

## Features

- **100% Private** — no cloud, no telemetry, everything runs locally on your Mac
- **Multiple Models** — browse, download, and switch between AI models with smart RAM-based recommendations
- **Chat Management** — multiple conversations with full history
- **File Context** — attach local files and folders for the AI to reference

---

## Installation

1. Download the latest `.dmg` from [Releases](https://github.com/JoFaTech2508/local-ai-chat/releases)
2. Open the `.dmg` and drag the app to Applications
3. Launch the app — it handles everything else automatically

### Requirements

- macOS 12 or later (Apple Silicon or Intel)
- 8 GB RAM minimum (16 GB+ recommended for larger models)

---

## Development

For contributors who want to build from source:

```bash
git clone https://github.com/JoFaTech2508/local-ai-chat.git
cd local-ai-chat
npm install
npm run tauri dev
```

Requires [Node.js](https://nodejs.org/) 18+ and [Rust](https://rustup.rs/) (latest stable).

---

© 2025 JoFaTech2508
