# Changelog

All notable changes to **Antigravity Multi-ID Quota** will be documented in this file.

---

## [1.1.3] — 2026-04-16

### ✨ New Features

#### 🔄 Instant Quota Reset Detection
- Extension now **fetches data immediately** the moment a quota resets — no more waiting for the next 15-second poll cycle
- A dedicated `resetTimer` is scheduled to fire at the exact `resetTimestamp` of the nearest expiring model across all accounts
- Timer is automatically **re-armed** after every successful data save, so it always targets the next upcoming reset
- Timer is properly **cleaned up** on `stopTracking()` to prevent memory leaks

#### 🧹 Auto-Clear History on Reset
- When a quota cycle rolls over (new `resetTimestamp` detected + old one has passed), the usage history for that model is **wiped clean**
- Chart now starts fresh from the reset point instead of showing stale pre-reset data points
- Prevents misleading sparkline graphs that previously showed "0% → 100%" jumps carried over from the previous cycle

#### ⚡ Optimistic Reset Display
- When a quota reset time is reached, the UI **instantly shows 100%** and **"Available"** without waiting for the API response
- Provides immediate visual feedback — the actual API fetch runs in the background and corrects values if needed
- Eliminates the brief "stale 0%" display that previously appeared between reset and the next successful API poll

---

## [1.1.2] — 2026-04-10

### ✨ New Features

#### 💫 Smooth Dashboard Animations
- Added fluid loading animations to the dashboard circular gauges. Rings now organically fill from 0% to their target values when the dashboard opens, providing a more premium, polished experience.
- Value counters smoothly tick upwards in sync with the gauge animation.

#### 🧠 Smart Account Suggestions
- The low quota warning notification (e.g., when dropping below 20% or hitting 0%) is now context-aware!
- When your active account runs low, the extension automatically scans your other configured accounts. If it finds one with plenty of available quota, it adds a smart suggestion directly into the notification alert (e.g., `💡 Hint: my.second.acc@... has 95% available!`).

---

## [1.1.1] — 2026-04-10

### ✨ New Features

#### ⏱ Live Reset Countdown
- Reset timer now counts down in **real-time every second**, even when accounts are offline
- Stores absolute `resetTimestamp` from the API instead of pre-formatted strings
- When timer reaches zero, displays **"Available"** automatically
- Works across VS Code restarts — timestamp persists in `globalState`

#### 📊 Enhanced Usage Chart
- Chart height increased from 36px → **80px** for much better readability
- Added **grid lines** at 0%, 50%, 100% with Y-axis percentage labels
- Added **data point dots** on every recorded data point
- Added **time labels** (start and end time) below the chart
- Displays **data point count** in the label (e.g. `📈 6h trend · 12 data points`)
- Glow effect on the trend line for better visibility
- Rounded container with subtle background

### 🔧 Improvements
- Removed custom sound notification feature (unreliable cross-platform)
- Cleaned up unused `fs` and `path` imports

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
