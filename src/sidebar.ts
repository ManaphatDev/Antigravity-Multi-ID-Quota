import * as vscode from 'vscode';
import { QuotaManager, QuotaData } from './quotaManager';

export class SidebarProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'agq.sidebarView';
    private _view?: vscode.WebviewView;
    public onPinsChanged?: (pins: string[]) => void;

    constructor(
        private readonly _extensionUri: vscode.Uri,
        private readonly quotaManager: QuotaManager,
        private readonly context: vscode.ExtensionContext
    ) {
        this.quotaManager.onChange.event((data) => {
            if (this._view) {
                this._view.webview.html = this._getHtmlForWebview(data);
            }
        });
    }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };

        webviewView.webview.html = this._getHtmlForWebview(this.quotaManager.getData());

        webviewView.webview.onDidReceiveMessage(message => {
            switch (message.command) {
                case 'openDashboard':
                    vscode.commands.executeCommand('agq.openDashboard');
                    break;
                case 'forceRefresh':
                    this.quotaManager.forceScan();
                    vscode.window.showInformationMessage('Syncing quota from language server...');
                    break;
                case 'openSettings':
                    vscode.commands.executeCommand('workbench.action.openSettings', 'agq');
                    break;
                case 'updatePins':
                    // Save pins to globalState so statusBar can read them
                    this.context.globalState.update('agq.pinnedModels', message.pins);
                    if (this.onPinsChanged) {
                        this.onPinsChanged(message.pins);
                    }
                    break;
            }
        });
    }

    private _getInitialPins(): string[] {
        return this.context.globalState.get<string[]>('agq.pinnedModels') || [];
    }

    private _getHtmlForWebview(data: QuotaData) {
        let contentHtml = '';
        const accounts = Object.values(data.accounts || {});
        const initialPins = this._getInitialPins();

        if (accounts.length > 0) {
            accounts.sort((a, b) => (a.email === data.activeEmail ? -1 : b.email === data.activeEmail ? 1 : 0));

            contentHtml = accounts.map(acc => {
                const isActive = acc.email === data.activeEmail;
                const emailId = acc.email.replace(/[@.]/g, '_');

                const modelsHtml = acc.models.map((m) => {
                    const colorClass = m.percentage < 20 ? 'danger' : m.percentage < 50 ? 'warning' : 'safe';
                    const modelKey = `${emailId}__${m.name.replace(/\s+/g, '_')}`;
                    const isPinned = initialPins.includes(modelKey);
                    return `
                    <div class="model-item" data-key="${modelKey}" id="model-${modelKey}">
                        <div class="model-row">
                            <div class="model-left">
                                <button class="pin-btn ${isPinned ? 'pinned' : ''}" onclick="togglePin('${modelKey}')" title="Pin to status bar">
                                    <span class="pin-icon">${isPinned ? '★' : '☆'}</span>
                                </button>
                                <span class="model-name">${m.name}</span>
                            </div>
                            <span class="model-pct ${colorClass}-text">${m.percentage}%${m.isOptimistic ? '<span class="sync-spin" title="Syncing...">↻</span>' : ''}</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill ${colorClass}" style="width: ${m.percentage}%"></div>
                        </div>
                        <div class="reset-time" data-reset="${m.resetTimestamp || 0}">⏱ Resets in ${m.resetIn}</div>
                    </div>`;
                }).join('');

                return `
                <div class="account-section ${isActive ? 'account-active' : ''}">
                    <div class="account-header">
                        <div class="account-left">
                            <span class="status-dot ${isActive ? 'dot-live' : 'dot-off'}"></span>
                            <span class="account-email" title="${acc.email}">${acc.email}</span>
                        </div>
                        <span class="account-tier">${acc.tier || 'Unknown'}</span>
                    </div>
                    <div class="account-models">
                        <div class="pinned-section" id="pinned-${emailId}" style="display:none">
                            <div class="section-label">📌 Pinned</div>
                            <div class="pinned-list" id="pinned-list-${emailId}"></div>
                            <div class="divider"></div>
                        </div>
                        <div class="all-models" id="all-${emailId}">
                            ${modelsHtml}
                        </div>
                    </div>
                </div>`;
            }).join('');
        } else {
            contentHtml = '<div class="empty">Connecting to Language Server...<br>Please open an Antigravity window to wake up the server.</div>';
        }

        return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <style>
                    * { box-sizing: border-box; margin: 0; padding: 0; }
                    body { font-family: var(--vscode-font-family); color: var(--vscode-foreground); padding: 12px; font-size: 12px; }

                    .header { font-size: 13px; font-weight: 700; margin-bottom: 16px; color: var(--vscode-textLink-foreground); display: flex; align-items: center; gap: 6px; }

                    .account-section { border: 1px solid var(--vscode-widget-border); border-radius: 8px; padding: 10px 12px; margin-bottom: 14px; background: rgba(0,0,0,0.15); }
                    .account-active { border-color: rgba(99,102,241,0.35); background: rgba(99,102,241,0.04); }

                    .account-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
                    .account-left { display: flex; align-items: center; gap: 6px; min-width: 0; }
                    .status-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
                    .dot-live { background: #10b981; box-shadow: 0 0 5px #10b981; }
                    .dot-off { background: #52525b; }
                    .account-email { font-weight: 600; font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 160px; }
                    .account-tier { font-size: 10px; color: #a5b4fc; background: rgba(99,102,241,0.15); padding: 2px 7px; border-radius: 10px; font-weight: 600; white-space: nowrap; flex-shrink: 0; }

                    .section-label { font-size: 10px; font-weight: 700; color: var(--vscode-descriptionForeground); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; opacity: 0.7; }
                    .divider { height: 1px; background: var(--vscode-widget-border); margin: 10px 0; opacity: 0.5; }

                    .model-item { margin-bottom: 12px; }
                    .model-item:last-child { margin-bottom: 0; }
                    .model-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; }
                    .model-left { display: flex; align-items: center; gap: 4px; min-width: 0; }
                    .model-name { font-size: 12px; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
                    .model-pct { font-size: 12px; font-weight: 700; flex-shrink: 0; }
                    .safe-text { color: #10b981; }
                    .warning-text { color: #f59e0b; }
                    .danger-text { color: #ef4444; }

                    .progress-bar { height: 5px; background: rgba(255,255,255,0.08); border-radius: 3px; overflow: hidden; margin-bottom: 4px; }
                    .progress-fill { height: 100%; border-radius: 3px; transition: width 0.4s ease; }
                    .safe { background: #10b981; }
                    .warning { background: #f59e0b; }
                    .danger { background: #ef4444; }
                    .reset-time { font-size: 10px; opacity: 0.45; text-align: right; }
                    .sync-spin { display: inline-block; animation: spin 1s linear infinite; font-size: 10px; opacity: 0.6; margin-left: 3px; }
                    @keyframes spin { to { transform: rotate(360deg); } }

                    .pin-btn { background: none; border: none; cursor: pointer; padding: 0; line-height: 1; flex-shrink: 0; opacity: 0.35; transition: opacity 0.15s, transform 0.15s; }
                    .pin-btn:hover { opacity: 1; transform: scale(1.2); }
                    .pin-btn.pinned { opacity: 1; }
                    .pin-icon { font-size: 12px; color: var(--vscode-foreground); }
                    .pin-btn.pinned .pin-icon { color: #f59e0b; }

                    .actions { display: flex; gap: 6px; margin-top: 14px; }
                    .btn { flex: 1; padding: 7px; text-align: center; border: none; cursor: pointer; border-radius: 5px; font-size: 11px; font-weight: 600; font-family: inherit; transition: opacity 0.15s; }
                    .btn:hover { opacity: 0.85; }
                    .btn-primary { background: var(--vscode-button-background); color: var(--vscode-button-foreground); }
                    .btn-secondary { background: transparent; color: var(--vscode-textLink-foreground); border: 1px solid var(--vscode-widget-border); }
                    .empty { font-size: 12px; opacity: 0.6; text-align: center; padding: 24px 12px; line-height: 1.7; }
                </style>
            </head>
            <body>
                <div class="header">⚡ Native Quota Monitor</div>
                ${contentHtml}
                <div class="actions">
                    <button class="btn btn-primary" onclick="openDashboard()">Full Dashboard</button>
                    <button class="btn btn-secondary" onclick="forceRefresh()">↺ Refresh</button>
                    <button class="btn btn-secondary" onclick="openSettings()" title="Settings">⚙️</button>
                </div>
                <script>
                    const vscode = acquireVsCodeApi();
                    let pinned = ${JSON.stringify(initialPins)};

                    function openDashboard() { vscode.postMessage({ command: 'openDashboard' }); }
                    function forceRefresh() { vscode.postMessage({ command: 'forceRefresh' }); }
                    function openSettings() { vscode.postMessage({ command: 'openSettings' }); }

                    function togglePin(key) {
                        const idx = pinned.indexOf(key);
                        if (idx >= 0) { pinned.splice(idx, 1); }
                        else { pinned.push(key); }
                        // Notify extension to save + update status bar
                        vscode.postMessage({ command: 'updatePins', pins: [...pinned] });
                        renderPins();
                    }

                    function renderPins() {
                        document.querySelectorAll('.pin-btn').forEach(btn => {
                            const key = btn.closest('.model-item').dataset.key;
                            const isPinned = pinned.includes(key);
                            btn.classList.toggle('pinned', isPinned);
                            btn.querySelector('.pin-icon').textContent = isPinned ? '★' : '☆';
                        });

                        document.querySelectorAll('[id^="all-"]').forEach(allDiv => {
                            const emailId = allDiv.id.replace('all-', '');
                            const pinnedSection = document.getElementById('pinned-' + emailId);
                            const pinnedList = document.getElementById('pinned-list-' + emailId);
                            if (!pinnedSection || !pinnedList) return;

                            const allItems = [...allDiv.querySelectorAll('.model-item')];
                            const pinnedItems = allItems.filter(el => pinned.includes(el.dataset.key));

                            // Hide the original item in the "All" list if it is pinned
                            allItems.forEach(el => {
                                el.style.display = pinned.includes(el.dataset.key) ? 'none' : 'block';
                            });

                            if (pinnedItems.length > 0) {
                                pinnedSection.style.display = 'block';
                                pinnedList.innerHTML = '';
                                pinnedItems.forEach(el => {
                                    const clone = el.cloneNode(true);
                                    clone.style.display = 'block'; // Make clone visible
                                    clone.querySelector('.pin-btn').onclick = () => togglePin(el.dataset.key);
                                    pinnedList.appendChild(clone);
                                });
                            } else {
                                pinnedSection.style.display = 'none';
                                pinnedList.innerHTML = '';
                            }
                        });
                    }

                    renderPins();

                    function fmtCountdown(ms) {
                        if (ms <= 0) return 'Available';
                        const m = Math.floor(ms / 60000);
                        if (m < 60) return m + ' min';
                        const d = Math.floor(m / 1440);
                        const h = Math.floor((m % 1440) / 60);
                        const mm = m % 60;
                        let s = '';
                        if (d > 0) s += d + 'd ';
                        if (h > 0) s += h + 'h ';
                        if (mm > 0) s += mm + 'm';
                        return s.trim();
                    }
                    function tickResets() {
                        document.querySelectorAll('.reset-time[data-reset]').forEach(el => {
                            const ts = parseInt(el.getAttribute('data-reset'));
                            if (!ts) return;
                            el.textContent = '⏱ Resets in ' + fmtCountdown(ts - Date.now());
                        });
                    }
                    setInterval(tickResets, 1000);
                    tickResets();
                </script>
            </body>
            </html>`;
    }
}
