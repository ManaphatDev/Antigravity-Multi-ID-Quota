import * as vscode from 'vscode';
import { QuotaManager, QuotaData, AccountQuota, NativeModelQuota, HistoryPoint } from './quotaManager';

export class DashboardPanel {
    public static currentPanel: DashboardPanel | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private _disposables: vscode.Disposable[] = [];

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, private quotaManager: QuotaManager) {
        this._panel = panel;
        this._update();
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
        this.quotaManager.onChange.event(() => this._update(), null, this._disposables);
    }

    public static createOrShow(extensionUri: vscode.Uri, quotaManager: QuotaManager) {
        const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;
        if (DashboardPanel.currentPanel) {
            DashboardPanel.currentPanel._panel.reveal(column);
            return;
        }
        const panel = vscode.window.createWebviewPanel(
            'agqDashboard', 'AGQ Multi-ID Dashboard',
            column || vscode.ViewColumn.One,
            { enableScripts: true, localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')] }
        );
        DashboardPanel.currentPanel = new DashboardPanel(panel, extensionUri, quotaManager);
    }

    public dispose() {
        DashboardPanel.currentPanel = undefined;
        this._panel.dispose();
        while (this._disposables.length) { this._disposables.pop()?.dispose(); }
    }

    private _update() {
        this._panel.webview.html = this._getHtml(this.quotaManager.getData());
    }

    private _getHtml(data: QuotaData): string {
        const accounts = Object.values(data.accounts || {});
        accounts.sort((a, b) => a.email === data.activeEmail ? -1 : b.email === data.activeEmail ? 1 : a.email.localeCompare(b.email));

        const tabsHtml = accounts.map((acc, i) => {
            const isActive = acc.email === data.activeEmail;
            return `<button class="tab ${i === 0 ? 'tab-active' : ''}" onclick="switchTab(${i})" id="tab-${i}">
                <span class="tab-dot ${isActive ? 'dot-live' : 'dot-off'}"></span>
                <span class="tab-email">${acc.email}</span>
                <span class="tab-tier">${acc.tier}</span>
            </button>`;
        }).join('');

        const panelsHtml = accounts.map((acc, i) => {
            const isActive = acc.email === data.activeEmail;
            const cardsHtml = acc.models.map(m => this._modelCard(m)).join('');
            const avgPct = acc.models.length > 0
                ? Math.round(acc.models.reduce((s, m) => s + m.percentage, 0) / acc.models.length) : 0;
            const updatedStr = acc.lastUpdated ? new Date(acc.lastUpdated).toLocaleString() : 'Never';

            let creditsHtml = '';
            if (acc.credits) {
                const c = acc.credits;
                creditsHtml = `
                <div class="credits-section">
                    <div class="credit-card">
                        <div class="credit-label">Prompt Credits</div>
                        <div class="credit-bar-wrap">
                            <div class="credit-bar" style="width:${c.promptPercent}%; background:${this._color(100 - c.promptPercent)}"></div>
                        </div>
                        <div class="credit-nums">${this._fmtNum(c.promptUsed)} / ${this._fmtNum(c.promptTotal)} <span class="credit-pct">(${c.promptPercent}% used)</span></div>
                    </div>
                    <div class="credit-card">
                        <div class="credit-label">Flow Credits</div>
                        <div class="credit-bar-wrap">
                            <div class="credit-bar" style="width:${c.flowPercent}%; background:${this._color(100 - c.flowPercent)}"></div>
                        </div>
                        <div class="credit-nums">${this._fmtNum(c.flowUsed)} / ${this._fmtNum(c.flowTotal)} <span class="credit-pct">(${c.flowPercent}% used)</span></div>
                    </div>
                </div>`;
            }

            return `<div class="panel ${i === 0 ? '' : 'panel-hidden'}" id="panel-${i}">
                <div class="panel-top">
                    <div class="panel-info">
                        <div class="panel-email">${acc.email}</div>
                        <div class="pills">
                            <span class="pill ${isActive ? 'pill-live' : 'pill-off'}">${isActive ? '● Active' : '○ Offline'}</span>
                            <span class="pill pill-tier">${acc.tier}</span>
                            <span class="pill pill-time">Updated ${updatedStr}</span>
                        </div>
                    </div>
                    <div class="avg-ring">
                        <svg viewBox="0 0 36 36">
                            <path class="ring-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
                            <path class="ring-fg" stroke="${this._color(avgPct)}" stroke-dasharray="${avgPct}, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
                            <text x="18" y="19" class="ring-num">${avgPct}%</text>
                            <text x="18" y="23.5" class="ring-label">AVG</text>
                        </svg>
                    </div>
                </div>
                ${creditsHtml}
                <div class="grid">${cardsHtml}</div>
            </div>`;
        }).join('');

        const emptyHtml = accounts.length === 0
            ? `<div class="empty"><div class="empty-icon">🔍</div>
               <div class="empty-title">No accounts detected</div>
               <div class="empty-desc">Please ensure that the Antigravity Language Server is running.<br>
               This extension connects directly to the internal language server to extract quota data.<br><br>
               Data will appear here once an account is active.</div></div>` : '';

        return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>AGQ Multi-ID Dashboard</title>
<style>
/* ===== Theme System ===== */
:root, [data-theme="classic"] {
    --bg:#09090b;--surface:#111113;--card:#18181b;--card-h:#1f1f23;--bdr:#27272a;
    --tx:#fafafa;--tx2:#71717a;--tx3:#52525b;
    --accent:#6366f1;--green:#10b981;--yellow:#f59e0b;--red:#ef4444;
    --r:12px;
    --banner-bg:linear-gradient(135deg,#1e1b4b 0%,#0c0a1e 100%);
    --banner-bdr:rgba(99,102,241,.15);
    --tab-bg:#111113;
}
[data-theme="native"] {
    --bg:var(--vscode-editor-background);--surface:var(--vscode-sideBar-background);
    --card:var(--vscode-editorWidget-background, #252526);--card-h:var(--vscode-list-hoverBackground, #2a2d2e);
    --bdr:var(--vscode-widget-border, #454545);--tx:var(--vscode-foreground);
    --tx2:var(--vscode-descriptionForeground);--tx3:var(--vscode-disabledForeground, #666);
    --accent:var(--vscode-textLink-foreground, #4fc1ff);
    --banner-bg:var(--vscode-titleBar-activeBackground, #3c3c3c);
    --banner-bdr:var(--vscode-widget-border, #454545);
    --tab-bg:var(--vscode-sideBar-background);
}
[data-theme="vibrant"] {
    --bg:#0a0a1a;--surface:#0f0f2a;--card:#151535;--card-h:#1a1a45;--bdr:#2a2a5a;
    --tx:#e0e0ff;--tx2:#8888cc;--tx3:#6666aa;
    --accent:#00d4ff;--green:#00ff88;--yellow:#ffcc00;--red:#ff4466;
    --r:12px;
    --banner-bg:linear-gradient(135deg,#0a0a3a 0%,#1a0a2e 50%,#0a1a2e 100%);
    --banner-bdr:rgba(0,212,255,.2);
    --tab-bg:#0f0f2a;
}

*{margin:0;padding:0;box-sizing:border-box}
body{background:var(--bg);color:var(--tx);font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,sans-serif}

.banner{background:var(--banner-bg);padding:32px 40px 20px;border-bottom:1px solid var(--banner-bdr);display:flex;justify-content:space-between;align-items:flex-start}
.banner-left{}
.banner h1{font-size:22px;font-weight:700;background:linear-gradient(90deg,#818cf8,#c084fc);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:4px}
[data-theme="vibrant"] .banner h1{background:linear-gradient(90deg,#00d4ff,#00ff88);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.banner .sub{font-size:13px;color:var(--tx2)}

.theme-switcher{display:flex;gap:4px;background:rgba(0,0,0,.3);border-radius:8px;padding:3px}
.theme-btn{background:none;border:1px solid transparent;color:var(--tx2);padding:6px 12px;border-radius:6px;cursor:pointer;font-size:11px;font-family:inherit;transition:all .2s}
.theme-btn:hover{color:var(--tx);background:rgba(255,255,255,.05)}
.theme-btn.active{background:rgba(255,255,255,.1);color:var(--tx);border-color:var(--accent)}

.tabs{display:flex;gap:0;background:var(--tab-bg);border-bottom:1px solid var(--bdr);padding:0 40px;overflow-x:auto}
.tab{display:flex;align-items:center;gap:8px;padding:14px 20px;background:0;border:0;border-bottom:2px solid transparent;color:var(--tx2);cursor:pointer;font-size:13px;font-family:inherit;white-space:nowrap;transition:all .2s}
.tab:hover{color:var(--tx);background:rgba(255,255,255,.03)}
.tab-active{color:var(--tx);border-bottom-color:var(--accent)}
.tab-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}
.dot-live{background:var(--green);box-shadow:0 0 6px var(--green);animation:pulse 2s infinite}
.dot-off{background:var(--tx3)}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
.tab-email{font-weight:600}
.tab-tier{font-size:10px;background:rgba(99,102,241,.15);color:#a5b4fc;padding:2px 8px;border-radius:10px}

.panels{padding:30px 40px}
.panel-hidden{display:none!important}

.panel-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:24px}
.panel-email{font-size:18px;font-weight:700;margin-bottom:10px}
.pills{display:flex;gap:8px;flex-wrap:wrap}
.pill{font-size:11px;padding:4px 10px;border-radius:20px;border:1px solid var(--bdr);color:var(--tx2)}
.pill-live{border-color:rgba(16,185,129,.3);color:var(--green);background:rgba(16,185,129,.08)}
.pill-off{border-color:rgba(113,113,122,.3);color:var(--tx3)}
.pill-tier{border-color:rgba(99,102,241,.25);color:#a5b4fc;background:rgba(99,102,241,.08)}
.pill-time{font-size:10px}

.avg-ring{width:90px;height:90px}
.avg-ring svg{display:block;width:100%;height:100%}
.ring-bg{fill:none;stroke:var(--bdr);stroke-width:3.8}
.ring-fg{fill:none;stroke-width:2.8;stroke-linecap:round;transition:stroke-dasharray .8s ease-out}
.ring-num{fill:var(--tx);font-size:8px;text-anchor:middle;font-weight:700}
.ring-label{fill:var(--tx2);font-size:3.5px;text-anchor:middle;text-transform:uppercase;letter-spacing:.5px}

.credits-section{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:28px}
.credit-card{background:var(--card);border:1px solid var(--bdr);border-radius:var(--r);padding:16px 20px}
.credit-label{font-size:12px;font-weight:600;color:var(--tx2);margin-bottom:10px;text-transform:uppercase;letter-spacing:.5px}
.credit-bar-wrap{height:8px;background:rgba(255,255,255,.08);border-radius:4px;overflow:hidden;margin-bottom:8px}
.credit-bar{height:100%;border-radius:4px;transition:width .5s}
.credit-nums{font-size:13px;color:var(--tx)}
.credit-pct{color:var(--tx2);font-size:11px}

.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:16px}
.card{background:var(--card);border:1px solid var(--bdr);border-radius:var(--r);padding:20px;display:flex;flex-direction:column;align-items:center;text-align:center;transition:transform .15s,border-color .15s,background .15s}
.card:hover{transform:translateY(-3px);border-color:rgba(99,102,241,.3);background:var(--card-h)}
.card-name{font-size:13px;font-weight:600;color:#e4e4e7;margin-bottom:14px;white-space:nowrap}
.card-svg{display:block;width:100px;height:100px}
.pct-text{fill:var(--tx);font-size:8px;text-anchor:middle;font-weight:700}
.pct-label{fill:var(--tx2);font-size:3px;text-anchor:middle;text-transform:uppercase}
.card-reset{margin-top:14px;font-size:12px;color:var(--tx2);background:rgba(255,255,255,.04);padding:5px 12px;border-radius:20px}

/* Sparkline */
.sparkline-wrap{width:100%;height:40px;margin-top:10px;position:relative;overflow:hidden}
.sparkline-svg{width:100%;height:100%}
.sparkline-line{fill:none;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round}
.sparkline-area{opacity:0.15}
.sparkline-label{font-size:9px;color:var(--tx3);text-align:center;margin-top:2px;opacity:0.6}

.empty{text-align:center;padding:80px 40px}
.empty-icon{font-size:48px;margin-bottom:16px}
.empty-title{font-size:18px;font-weight:600;margin-bottom:8px}
.empty-desc{font-size:13px;color:var(--tx2);max-width:450px;margin:0 auto;line-height:1.7}
</style></head>
<body>
<div class="banner">
    <div class="banner-left">
        <h1>Antigravity Multi-ID Quota</h1>
        <div class="sub">Live quota data parsed directly from IDE internal API</div>
    </div>
    <div class="theme-switcher">
        <button class="theme-btn active" onclick="setTheme('classic')" id="theme-classic">🌙 Classic</button>
        <button class="theme-btn" onclick="setTheme('native')" id="theme-native">🖥️ VS Code</button>
        <button class="theme-btn" onclick="setTheme('vibrant')" id="theme-vibrant">✨ Vibrant</button>
    </div>
</div>
${accounts.length > 0 ? `<div class="tabs">${tabsHtml}</div>` : ''}
<div class="panels">${panelsHtml}${emptyHtml}</div>
<script>
function switchTab(idx){
    document.querySelectorAll('.tab').forEach((t,i)=>t.classList.toggle('tab-active',i===idx));
    document.querySelectorAll('.panel').forEach((p,i)=>p.classList.toggle('panel-hidden',i!==idx));
}
function setTheme(name){
    document.documentElement.setAttribute('data-theme', name);
    document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('theme-'+name)?.classList.add('active');
}
</script>
</body></html>`;
    }

    private _modelCard(m: NativeModelQuota): string {
        const c = this._color(m.percentage);
        const sparkline = this._sparkline(m.history || [], c);
        return `<div class="card">
            <div class="card-name">${m.name}</div>
            <svg viewBox="0 0 36 36" class="card-svg">
                <path class="ring-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
                <path class="ring-fg" stroke="${c}" stroke-dasharray="${m.percentage}, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
                <text x="18" y="19" class="pct-text">${m.percentage}%</text>
                <text x="18" y="24" class="pct-label">remaining</text>
            </svg>
            ${sparkline}
            <div class="card-reset">⏳ ${m.resetIn}</div>
        </div>`;
    }

    private _sparkline(history: HistoryPoint[], color: string): string {
        if (!history || history.length < 2) {
            return `<div class="sparkline-wrap"><div class="sparkline-label">📊 Collecting data...</div></div>`;
        }

        const width = 200;
        const height = 36;
        const padding = 2;

        const minTime = history[0].timestamp;
        const maxTime = history[history.length - 1].timestamp;
        const timeRange = maxTime - minTime || 1;

        const points = history.map(h => {
            const x = padding + ((h.timestamp - minTime) / timeRange) * (width - padding * 2);
            const y = padding + ((100 - h.percentage) / 100) * (height - padding * 2);
            return { x, y };
        });

        const linePoints = points.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
        // Area fill: close path along bottom
        const areaPoints = linePoints + ` ${points[points.length - 1].x.toFixed(1)},${height} ${points[0].x.toFixed(1)},${height}`;

        const hoursAgo = Math.round((maxTime - minTime) / 3600000);
        const label = hoursAgo > 0 ? `Last ${hoursAgo}h trend` : 'Recent trend';

        return `<div class="sparkline-wrap">
            <svg class="sparkline-svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">
                <polygon class="sparkline-area" points="${areaPoints}" fill="${color}"/>
                <polyline class="sparkline-line" points="${linePoints}" stroke="${color}"/>
            </svg>
            <div class="sparkline-label">${label}</div>
        </div>`;
    }

    private _color(pct: number): string {
        if (pct < 20) return '#ef4444';
        if (pct < 50) return '#f59e0b';
        return '#10b981';
    }

    private _fmtNum(n: number): string {
        if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
        return n.toString();
    }
}
