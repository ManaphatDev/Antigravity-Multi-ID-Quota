# 🚀 Antigravity Multi-ID Quota Dashboard

**Monitor your Antigravity AI quota usage in real-time — fully standalone, no dependencies required.**

![Version](https://img.shields.io/badge/version-1.1.0-blue)
![VS Code](https://img.shields.io/badge/VS%20Code-1.85+-green)
![License](https://img.shields.io/badge/license-MIT-success)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-blueviolet)

> 💡 **New in v1.1.0:** Dashboard Theme Switcher (Classic / VS Code / Vibrant), Usage Sparkline Graphs, Smart Notifications with customizable sound, and full Cross-Platform Support (Linux & macOS)!

---

## 🌟 Overview

**Antigravity Multi-ID Quota** is a lightweight, fully self-contained VS Code extension that tracks your AI coding assistant quota in real-time.

It works by scanning running **Antigravity Language Server** processes, extracting their internal ports and CSRF tokens, and fetching live quota data directly from the IDE's internal API — no third-party extensions or log files needed.

---

## ✨ Features

### 📌 Model Pinning
Keep track of the models you care about the most:

<div align="center">
  <img src="media/sidebar-pinned.png" alt="Pinned Models Screenshot" width="300" />
</div>

- **Pin from Sidebar:** Click the star icon (☆ / ★) next to any model.
- **Smart Status Bar:** Pinned models instantly appear in the bottom-right Status Bar.
- **Clean Naming:** Model names are intelligently shortened (e.g., `Gemini 3.1 Pro (High)` → `Pro (High)`).
- **Color-Coded Status:** ✅ Green (≥ 50%) · ⚠️ Yellow (20-49%) · ❌ Red (< 20%)
- **Dynamic Reordering:** Pinned models move to a dedicated "📌 PINNED" section at the top.

### 📊 Multi-Account Dashboard

<div align="center">
  <img src="media/dashboard.png" alt="Dashboard Screenshot" width="700" />
</div>

- Supports **multiple accounts simultaneously** — each account gets its own tab.
- Displays live **quota percentage** per AI model with interactive circular gauges.
- Shows raw **tier name** directly from the API (e.g., `TEAMS_TIER_PRO`, `Google AI Pro`).
- Displays **reset time** countdowns per model.

### 🎨 Dashboard Themes (New!)
Switch between three visual styles via the theme switcher in the dashboard:
- 🌙 **Classic Dark** — Sleek purple-toned premium design
- 🖥️ **VS Code Native** — Follows your active VS Code theme automatically
- ✨ **Vibrant** — Bold neon blue-green tones for maximum visibility

### 📈 Usage Analytics (New!)
- **Sparkline graphs** show 24-hour usage trends beneath each model's gauge
- Auto-records data efficiently (only logs when percentage changes, or every 1 hour)

### 🔔 Smart Notifications (New!)
- Automatic alerts when quota **drops below threshold** (customizable in Settings)
- Good news notification when quota **resets back**
- Anti-spam protection (won't re-notify until state actually changes)

### 🔌 Cross-Platform (New!)
- **Windows:** `netstat` + `wmic`
- **macOS / Linux:** `ps` + `lsof`

---

## 🚀 How to Use

1. **Open the Sidebar:** Click the Antigravity Quota icon in the VS Code Activity Bar.
2. **View Accounts:** Multiple accounts are listed automatically.
3. **Pin Models:** Click the **Star Icon (☆)** → model moves to "📌 PINNED" and appears in the Status Bar.
4. **Open Full Dashboard:** Click "Full Dashboard" or run `AGQ: Open Quota Dashboard`.
5. **Switch Themes:** Use the theme switcher buttons at the top-right of the Dashboard.
6. **Force Refresh:** Click "↺ Refresh" in the sidebar.

---

## 🛠 Installation

### From `.vsix`
1. Download the latest `.vsix` from [Releases](https://github.com/ManaphatDev/Antigravity-Multi-ID-Quota/releases)
2. In VS Code: `Extensions` module → `...` menu → `Install from VSIX...`

### Build from Source
```bash
git clone https://github.com/ManaphatDev/Antigravity-Multi-ID-Quota.git
cd Antigravity-Multi-ID-Quota
npm install
npm run package
```
Then install the generated `.vsix` file.

---

## 💻 Commands

| Command | Description |
|---|---|
| `AGQ: Open Quota Dashboard` | Open the full interactive multi-account dashboard |
| `AGQ: Refresh Quota` | Force an immediate Native Quota sync |

---

## ⚙️ Settings

| Property | Default | Description |
|---|---|---|
| `agq.enableNotifications` | `true` | Enable/disable quota alerts when running low or after reset |
| `agq.notificationWarningThreshold` | `20` | Percentage below which a warning notification is triggered |

---

## 📋 Requirements

- **OS:** Windows, macOS, or Linux
- **IDE:** VS Code `1.85+` or compatible IDE
- **Prerequisite:** Antigravity extension installed and **logged in**

---

## 📜 License

MIT © [ManaphatDev](https://github.com/ManaphatDev)
