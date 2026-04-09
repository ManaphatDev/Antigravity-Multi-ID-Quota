# Changelog

All notable changes to **Antigravity Multi-ID Quota** will be documented in this file.

---

## [1.1.0] — 2026-04-09

### ✨ New Features

#### 🍎 Cross-Platform Support
- Added full support for **macOS** and **Linux**
- Windows: continues using `netstat` + `wmic` (unchanged)
- macOS / Linux: uses `ps x -o pid,command` + `lsof -nP -iTCP -sTCP:LISTEN` to scan Antigravity Language Server processes

#### 🔔 Smart Notifications
- VS Code toast notifications fire automatically when quota **drops below threshold** (default: 20%)
- Additional alert when quota is completely **depleted (0%)**
- Recovery notification when quota **resets back**
- Built-in **anti-spam protection** — won't re-notify until the quota level actually changes state
- New settings:
  - `agq.enableNotifications` — toggle all alerts on/off
  - `agq.notificationWarningThreshold` — customize the warning percentage (default: 20%)

#### 📈 Usage Analytics & Sparkline Graphs
- Each model now tracks a **24-hour usage history**
- History stored efficiently: only records a new point when percentage changes, or every 1 hour minimum
- Data older than 24 hours is pruned automatically
- **Sparkline SVG graph** displayed beneath each model's circular gauge in the Full Dashboard

#### 🎨 Dashboard Theme Switcher
- New theme toggle buttons in the top-right corner of the Dashboard
- **🌙 Classic Dark** — original sleek purple-toned design
- **🖥️ VS Code Native** — dynamically follows your active VS Code color theme via CSS variables
- **✨ Vibrant** — bold neon blue-green palette for maximum contrast

#### ⚙️ Settings Shortcut Button
- Added a **⚙️ button** to the Sidebar action bar
- Clicking it opens VS Code Settings filtered to `agq.*` directly

### 🔧 Improvements
- Updated extension `description` in `package.json` to better highlight key capabilities
- All notification messages and README feature sections are now fully in **English**
- Cleaned up CSS to use VS Code CSS variables for better theme compatibility

---

## [1.0.9] — 2026-04-09

### ✨ New Features

#### 📌 Model Pinning
- Pin any model from the Sidebar by clicking the **star icon (☆ / ★)**
- Pinned models move to a dedicated **📌 PINNED** section at the top
- Pin state persists across sessions via `vscode.globalState`

#### 📊 Status Bar Refinement
- Status bar now displays **pinned model names** with their remaining percentage
- Model names are intelligently shortened (e.g. `Gemini 3.1 Pro (High)` → `Pro (High)`)
- Single leading VS Code icon: `$(check)`, `$(warning)`, or `$(error)` based on lowest pinned quota
- Removed forced background color overrides for cleaner integration

### 🔧 Improvements
- Status bar updates **immediately** when pins change in the sidebar
- Sidebar hides pinned models from the "All Models" list to avoid duplication
- Packaged as `antigravity-multi-id-quota-1.0.9.vsix`

---

## [1.0.0] — 2026-04-08

### 🎉 Initial Release

- Standalone extension — no dependency on "Toolkit for Antigravity"
- Scans running Antigravity Language Server processes via `netstat` + `wmic` (Windows)
- Extracts port and CSRF token from process command-line arguments
- Fetches live quota data from the internal IDE API
- **Sidebar view** with per-model quota bars and reset countdown
- **Full Dashboard** with multi-account tab support, circular gauges, and credit tracking
- **Status bar item** showing real-time quota summary
- Commands: `AGQ: Open Quota Dashboard`, `AGQ: Refresh Quota`
