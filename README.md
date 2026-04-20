# 🚀 Antigravity Multi-ID Quota Dashboard

**Monitor your Antigravity AI quota usage in real-time — fully standalone, no dependencies required.**

![Version](https://img.shields.io/badge/version-1.1.0-blue)
![VS Code](https://img.shields.io/badge/VS%20Code-1.85+-green)
![License](https://img.shields.io/badge/license-MIT-success)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-blueviolet)

> 💡 **New in v1.1.4:** In-Dashboard Custom Palette Color Pickers with Live-Preview, Predictive Drain Rate Badges, Dynamic Polling Intervals, and persistent Dashboard Themes!

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
  
  <div align="center">
    <img src="https://raw.githubusercontent.com/ManaphatDev/Antigravity-Multi-ID-Quota/main/media/statusbar.png" alt="Status Bar Screenshot" width="500" />
  </div>

- **Clean Naming:** Model names are intelligently shortened (e.g., `Gemini 3.1 Pro (High)` → `Pro (High)`).
- **Color-Coded Status:** ✅ Green (≥ 50%) · ⚠️ Yellow (20-49%) · ❌ Red (< 20%)
- **Dynamic Reordering:** Pinned models move to a dedicated "📌 PINNED" section at the top.

### 📊 Multi-Account Dashboard

<div align="center">
  <img src="https://raw.githubusercontent.com/ManaphatDev/Antigravity-Multi-ID-Quota/main/media/dashboard-classic.png" alt="Dashboard Classic Theme" width="800" />
</div>

- Supports **multiple accounts simultaneously** — each account gets its own tab.
- Displays live **quota percentage** per AI model with interactive circular gauges.
- Shows raw **tier name** directly from the API (e.g., `TEAMS_TIER_PRO`, `Google AI Pro`).
- Displays **reset time** countdowns per model.

### 🎨 Dashboard Themes & Animations
Switch between three visual styles via the theme switcher in the dashboard:

<div align="center">
  <img src="https://raw.githubusercontent.com/ManaphatDev/Antigravity-Multi-ID-Quota/main/media/dashboard-custom.png" alt="Dashboard Custom Theme" width="31%" style="margin-right: 1.5%;" />
  <img src="https://raw.githubusercontent.com/ManaphatDev/Antigravity-Multi-ID-Quota/main/media/dashboard-native.png" alt="VS Code Native Theme" width="31%" style="margin-right: 1.5%;" />
  <img src="https://raw.githubusercontent.com/ManaphatDev/Antigravity-Multi-ID-Quota/main/media/dashboard-vibrant.png" alt="Vibrant Theme" width="31%" />
</div>
<br/>

- 🌙 **Classic Dark** — Sleek purple-toned premium design
- 🖥️ **VS Code Native** — Follows your active VS Code theme automatically
- ✨ **Vibrant** — Bold neon blue-green tones for maximum visibility
- 🎨 **Custom (NEW)** — Build your own dashboard theme using the integrated native **Color Picker Palette**. Offers real-time **live-previews** as you drag the cursor, and permanently saves your design!
  
  <div align="center">
    <img src="https://raw.githubusercontent.com/ManaphatDev/Antigravity-Multi-ID-Quota/main/media/palette-horizontal.png" alt="Custom Palette Editor" width="400" />
  </div>

- 💫 **Smooth Loading Animations** — Circular gauges organically fill from 0% when opening the dashboard

### 📊 Usage Analytics & Enhanced Chart
- **Predictive Analytics (NEW):** Sleek badges intelligently calculate linear usage trends from your 24-hour buffer to display your estimated drain rate (`🔥 Empty in XXm` or `✨ Stable Usage`).
- **Full-size chart** (80px) with grid lines at 0%, 50%, 100% and Y-axis labels
- **Data point dots** and **time axis** for easy reading
- 24-hour usage trend tracking with smart data recording
- Auto-records data efficiently (only logs when percentage changes, or every 1 hour)

### ⏱ Live Reset Countdown (New!)
- Reset timer **counts down every second** in real-time
- Works even when accounts are **offline** — uses absolute timestamps
- Automatically shows **"Available"** when timer reaches zero
- Persists across VS Code restarts

### 🔔 Smart Notifications & Suggestions (New!)
- Automatic alerts when quota **drops below threshold** (customizable in Settings)
- 🧠 **Context-Aware Suggestions:** Recommends alternative accounts with higher quota when your active account runs low
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
| `agq.refreshInterval` | `15` | Polling interval in seconds for fetching quota data. Changes apply immediately. |
| `agq.enableOptimisticReset` | `true` | Optimistically predict resets to 100% locally when reset time is reached. |
| `agq.dashboardTheme` | `classic` | Persisted default UI theme for the Quota Dashboard. |

---

## 📋 Requirements

- **OS:** Windows, macOS, or Linux
- **IDE:** VS Code `1.85+` or compatible IDE
- **Prerequisite:** Antigravity extension installed and **logged in**

---

## 🐛 Feedback & Issues

Found a bug or have a feature request? Please open an issue on GitHub:
👉 **[Antigravity Multi-ID Quota Issues](https://github.com/ManaphatDev/Antigravity-Multi-ID-Quota/issues)**

---

## 📜 License

MIT © [ManaphatDev](https://github.com/ManaphatDev)
