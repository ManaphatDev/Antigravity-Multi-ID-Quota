import * as vscode from 'vscode';
import { QuotaManager, QuotaData } from './quotaManager';

export class SidebarProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'agq.sidebarView';
    private _view?: vscode.WebviewView;

    constructor(
        private readonly _extensionUri: vscode.Uri,
        private readonly quotaManager: QuotaManager
    ) {
        this.quotaManager.onChange.event((data) => {
            if (this._view) {
                this._view.webview.html = this._getHtmlForWebview(this._view.webview, data);
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

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview, this.quotaManager.getData());

        webviewView.webview.onDidReceiveMessage(message => {
            switch (message.command) {
                case 'openDashboard':
                    vscode.commands.executeCommand('agq.openDashboard');
                    break;
                case 'forceRefresh':
                    this.quotaManager.forceScan();
                    vscode.window.showInformationMessage('Syncing quota from language server...');
                    break;
            }
        });
    }

    private _getHtmlForWebview(webview: vscode.Webview, data: QuotaData) {
        let contentHtml = '';
        const accounts = Object.values(data.accounts || {});
        
        if (accounts.length > 0) {
            // Sort to put active email first
            accounts.sort((a, b) => (a.email === data.activeEmail ? -1 : b.email === data.activeEmail ? 1 : 0));
            
            contentHtml = accounts.map(acc => {
                const isActive = acc.email === data.activeEmail;
                
                let formattedTier = acc.tier || 'Unknown';

                const modelsHtml = acc.models.map(m => `
                    <div class="model-item">
                        <div class="row">
                            <span class="model-name">${m.name}</span>
                            <span class="model-pct">${m.percentage}%</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill ${m.percentage < 20 ? 'danger' : m.percentage < 50 ? 'warning' : 'safe'}" style="width: ${m.percentage}%"></div>
                        </div>
                        <div class="reset-time">Resets in ${m.resetIn}</div>
                    </div>
                `).join('');

                return `
                <div class="account-section">
                    <div class="account-header">
                        <span class="account-email" title="${acc.email}">${acc.email}</span>
                        ${isActive ? '<span class="badge active">ACTIVE</span>' : '<span class="badge">OFFLINE</span>'}
                    </div>
                    <div class="account-tier">${formattedTier}</div>
                    <div class="account-models">
                        ${modelsHtml}
                    </div>
                </div>
                `;
            }).join('');
        } else {
            contentHtml = '<div class="empty">Connecting to Language Server API... Please wait or open an Antigravity conversational window to wake up the server.</div>';
        }

        return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <style>
                    body { font-family: var(--vscode-font-family); color: var(--vscode-foreground); padding: 15px; }
                    .header { font-size: 14px; font-weight: bold; margin-bottom: 25px; color: var(--vscode-textLink-foreground); text-align: center; }
                    
                    .account-section { background: rgba(0,0,0,0.2); border: 1px solid var(--vscode-widget-border); border-radius: 6px; padding: 12px; margin-bottom: 20px; }
                    .account-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
                    .account-email { font-weight: bold; font-size: 13px; color: var(--vscode-foreground); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 180px; }
                    .account-tier { display: inline-block; font-size: 10px; color: #6db1ff; background: rgba(109, 177, 255, 0.15); padding: 2px 8px; border-radius: 12px; margin-bottom: 12px; font-weight: 600; letter-spacing: 0.5px; }
                    
                    .badge { font-size: 9px; padding: 2px 6px; border-radius: 10px; background: var(--vscode-badge-background); color: var(--vscode-badge-foreground); font-weight: bold; }
                    .badge.active { background: var(--vscode-testing-iconPassed); color: #fff; }
                    
                    .model-item { margin-bottom: 15px; }
                    .row { display: flex; justify-content: space-between; margin-bottom: 6px; }
                    .model-name { font-weight: 600; font-size: 12px; }
                    .model-pct { font-size: 12px; opacity: 0.8; }
                    .progress-bar { height: 6px; background: rgba(255,255,255,0.1); border-radius: 4px; overflow: hidden; margin-bottom: 4px; }
                    .progress-fill { height: 100%; border-radius: 4px; transition: width 0.3s; }
                    .safe { background: var(--vscode-testing-iconPassed); }
                    .warning { background: var(--vscode-charts-yellow); }
                    .danger { background: var(--vscode-errorForeground); }
                    .reset-time { font-size: 10px; opacity: 0.5; text-align: right; }
                    
                    .btn { display: block; width: 100%; padding: 8px; text-align: center; background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: none; cursor: pointer; margin-top: 10px; border-radius: 4px; }
                    .btn:hover { background: var(--vscode-button-hoverBackground); }
                    .empty { font-size: 12px; opacity: 0.6; text-align: center; padding: 20px; line-height: 1.5; }
                </style>
            </head>
            <body>
                <div class="header">Native Quota Monitor</div>
                ${contentHtml}
                <div style="margin-top: 40px;">
                    <button class="btn" onclick="openDashboard()">Open Full Dashboard</button>
                    <button class="btn" style="background: transparent; color: var(--vscode-button-background); border: 1px solid var(--vscode-button-background);" onclick="forceRefresh()">Refresh Quota</button>
                </div>
                <script>
                    const vscode = acquireVsCodeApi();
                    function openDashboard() { vscode.postMessage({ command: 'openDashboard' }); }
                    function forceRefresh() { vscode.postMessage({ command: 'forceRefresh' }); }
                </script>
            </body>
            </html>
        `;
    }
}
