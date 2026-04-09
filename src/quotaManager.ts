import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as http from 'http';
import * as https from 'https';
import * as os from 'os';

export interface HistoryPoint {
    timestamp: number;
    percentage: number;
}

export interface NativeModelQuota {
    name: string;
    percentage: number;
    resetIn: string;
    history: HistoryPoint[];
}

export interface CreditInfo {
    promptUsed: number;
    promptTotal: number;
    promptPercent: number;
    flowUsed: number;
    flowTotal: number;
    flowPercent: number;
}

export interface AccountQuota {
    email: string;
    tier: string;
    lastUpdated: number;
    models: NativeModelQuota[];
    credits: CreditInfo | null;
}

export interface QuotaData {
    accounts: Record<string, AccountQuota>;
    activeEmail: string | null;
}

// Notification state tracking
interface NotificationState {
    level: 'ok' | 'warning' | 'critical' | 'empty';
    notifiedAt: number;
}

export class QuotaManager {
    private data: QuotaData = { accounts: {}, activeEmail: null };
    private pollingInterval: NodeJS.Timeout | null = null;
    public onChange: vscode.EventEmitter<QuotaData> = new vscode.EventEmitter<QuotaData>();

    // Notification spam prevention
    private notificationStates: Map<string, NotificationState> = new Map();

    constructor(private context: vscode.ExtensionContext) {
        this.loadData();
    }

    public async startTracking() {
        await this.fetchLocalApis();
        this.pollingInterval = setInterval(() => this.fetchLocalApis(), 15000);
    }

    public stopTracking() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
        }
    }

    public getData(): QuotaData {
        return this.data;
    }

    public forceScan() {
        this.fetchLocalApis();
    }

    private loadData() {
        const stored = this.context.globalState.get<QuotaData>('agq.nativeDataV3');
        if (stored) {
            this.data = stored;
            if (!this.data.accounts) this.data.accounts = {};
        }
    }

    private async saveData() {
        await this.context.globalState.update('agq.nativeDataV3', this.data);
        this.onChange.fire(this.data);
        this.evaluateNotifications();
    }

    // ========================
    // Smart Notifications
    // ========================
    private evaluateNotifications() {
        const config = vscode.workspace.getConfiguration('agq');
        const enabled = config.get<boolean>('enableNotifications', true);
        if (!enabled) return;

        const warningThreshold = config.get<number>('notificationWarningThreshold', 20);

        for (const email of Object.keys(this.data.accounts)) {
            const acc = this.data.accounts[email];
            for (const model of acc.models) {
                const key = `${email}::${model.name}`;
                const prev = this.notificationStates.get(key);
                
                let currentLevel: NotificationState['level'];
                if (model.percentage === 0) currentLevel = 'empty';
                else if (model.percentage < warningThreshold) currentLevel = 'warning';
                else currentLevel = 'ok';

                // Only notify on state transition
                if (prev && prev.level === currentLevel) continue;

                if (currentLevel === 'empty' && (!prev || prev.level !== 'empty')) {
                    vscode.window.showErrorMessage(
                        `🔴 Quota depleted! ${model.name} (${email}) — 0% remaining`,
                        'Open Dashboard'
                    ).then(choice => {
                        if (choice === 'Open Dashboard') {
                            vscode.commands.executeCommand('agq.openDashboard');
                        }
                    });
                } else if (currentLevel === 'warning' && (!prev || prev.level === 'ok')) {
                    vscode.window.showWarningMessage(
                        `⚠️ Quota running low! ${model.name} (${email}) — ${model.percentage}% remaining`
                    );
                } else if (currentLevel === 'ok' && prev && (prev.level === 'empty' || prev.level === 'critical')) {
                    vscode.window.showInformationMessage(
                        `✅ Quota restored! ${model.name} (${email}) — ${model.percentage}%`
                    );
                }

                this.notificationStates.set(key, { level: currentLevel, notifiedAt: Date.now() });
            }
        }
    }

    // ========================
    // History tracking
    // ========================
    private recordHistory(existingModels: NativeModelQuota[] | undefined, newModels: NativeModelQuota[]): void {
        const now = Date.now();
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours

        for (const model of newModels) {
            // Find existing model to carry over history
            const existing = existingModels?.find(m => m.name === model.name);
            const prevHistory = existing?.history || [];

            // Prune old data (older than 24h)  
            const prunedHistory = prevHistory.filter(h => (now - h.timestamp) < maxAge);

            // Only add new point if percentage changed or last point is older than 1 hour
            const lastPoint = prunedHistory[prunedHistory.length - 1];
            const shouldAdd = !lastPoint
                || lastPoint.percentage !== model.percentage
                || (now - lastPoint.timestamp) >= 3600000; // 1 hour

            if (shouldAdd) {
                prunedHistory.push({ timestamp: now, percentage: model.percentage });
            }

            model.history = prunedHistory;
        }
    }

    // ========================
    // Utility
    // ========================
    private formatResetTime(resetTimeStr: string): string {
        const resetDate = new Date(resetTimeStr);
        if (Number.isNaN(resetDate.getTime())) return 'unknown';
        const ms = resetDate.getTime() - Date.now();
        if (ms <= 0) return 'Available';
        const minutes = Math.floor(ms / 60000);
        if (minutes < 60) return `${minutes} min`;
        
        const d = Math.floor(minutes / 1440);
        const h = Math.floor((minutes % 1440) / 60);
        const m = minutes % 60;
        
        const parts = [];
        if (d > 0) parts.push(`${d}d`);
        if (h > 0) parts.push(`${h}h`);
        if (m > 0) parts.push(`${m}m`);
        
        return parts.join(' ');
    }

    private parseStatusResponse(json: any): AccountQuota | null {
        const userStatus = json?.userStatus;
        if (!userStatus) return null;

        const email = userStatus.email;
        if (!email) return null;

        const planStatus = userStatus.planStatus || {};
        const planInfo = planStatus.planInfo || {};
        const tier = userStatus.userTier?.name || planInfo.teamsTier || 'Unknown';

        let credits: CreditInfo | null = null;
        if (planStatus.monthlyPromptCredits !== undefined && planStatus.availablePromptCredits !== undefined) {
            const pTot = Number(planStatus.monthlyPromptCredits);
            const pAvail = Number(planStatus.availablePromptCredits);
            const pUsed = Math.max(0, pTot - pAvail);
            const pPct = pTot > 0 ? Math.round((pUsed / pTot) * 100) : 0;

            let fTot = 0, fAvail = 0, fUsed = 0, fPct = 0;
            if (planStatus.monthlyFlowCredits !== undefined && planStatus.availableFlowCredits !== undefined) {
                fTot = Number(planStatus.monthlyFlowCredits);
                fAvail = Number(planStatus.availableFlowCredits);
                fUsed = Math.max(0, fTot - fAvail);
                fPct = fTot > 0 ? Math.round((fUsed / fTot) * 100) : 0;
            }

            credits = {
                promptUsed: pUsed,
                promptTotal: pTot,
                promptPercent: pPct,
                flowUsed: fUsed,
                flowTotal: fTot,
                flowPercent: fPct
            };
        }

        const models: NativeModelQuota[] = [];
        const clientConfigs = userStatus.cascadeModelConfigData?.clientModelConfigs || [];
        for (const config of clientConfigs) {
            if (config.quotaInfo) {
                models.push({
                    name: config.label || config.modelOrAlias?.model || 'Unknown Model',
                    percentage: Math.round((config.quotaInfo.remainingFraction ?? 0) * 100),
                    resetIn: this.formatResetTime(config.quotaInfo.resetTime),
                    history: []  // Will be populated by recordHistory
                });
            }
        }

        return {
            email,
            tier,
            lastUpdated: Date.now(),
            models,
            credits
        };
    }

    // ========================
    // API Fetch
    // ========================
    private fetchStatus(port: number, csrfToken: string, protocol: 'https' | 'http'): Promise<any> {
        return new Promise((resolve) => {
            const payload = JSON.stringify({ metadata: { ideName: 'antigravity', extensionName: 'antigravity', locale: 'en' } });
            const client = protocol === 'https' ? https : http;
            const options = {
                hostname: '127.0.0.1',
                port,
                path: '/exa.language_server_pb.LanguageServerService/GetUserStatus',
                method: 'POST',
                headers: {
                    'Connect-Protocol-Version': '1',
                    'X-Codeium-Csrf-Token': csrfToken,
                    'Content-Type': 'application/json'
                },
                timeout: 5000,
                rejectUnauthorized: false // Local self-signed certificates
            };
            const req = client.request(options, (res) => {
                let data = '';
                res.on('data', c => data += c);
                res.on('end', () => {
                    if (res.statusCode === 200) {
                        try {
                            resolve(JSON.parse(data));
                        } catch (e) {
                            resolve(null);
                        }
                    } else {
                        resolve(null);
                    }
                });
            });
            req.on('error', () => resolve(null));
            req.write(payload);
            req.end();
        });
    }

    // ========================
    // Windows: netstat + wmic
    // ========================
    private async findAndFetchWindows() {
        return new Promise<void>((resolve) => {
            cp.exec('netstat -ano | findstr LISTEN', async (err, netstatOut) => {
                const pidPortsMap: Record<number, number[]> = {};
                if (!err && netstatOut) {
                    const lines = netstatOut.split('\n');
                    for (const l of lines) {
                        const parts = l.trim().split(/\s+/);
                        if (parts.length >= 5) {
                            const portMatch = parts[1].match(/:(\d+)$/);
                            const pid = parseInt(parts[parts.length - 1], 10);
                            if (portMatch) {
                                if (!pidPortsMap[pid]) pidPortsMap[pid] = [];
                                pidPortsMap[pid].push(parseInt(portMatch[1], 10));
                            }
                        }
                    }
                }

                cp.exec('wmic process get processid,commandline /format:csv', { maxBuffer: 1024 * 1024 * 10 }, async (err, wmicOut) => {
                    if (err || !wmicOut) return resolve();

                    const lines = wmicOut.split('\n').filter(l => l.includes('language_server') && l.includes('--csrf_token'));
                    let anyUpdates = false;

                    for (const l of lines) {
                        const match = l.match(/,([^,]+),(\d+)\s*$/);
                        if (!match) continue;
                        const pid = parseInt(match[2], 10);
                        const csrfMatch = l.match(/--csrf_token[=\s]+([a-zA-Z0-9\-_.]+)/);
                        if (!csrfMatch) continue;
                        const csrfToken = csrfMatch[1];
                        
                        const ports = pidPortsMap[pid] || [];
                        for (const port of ports) {
                            let resp = await this.fetchStatus(port, csrfToken, 'https');
                            if (!resp) {
                                resp = await this.fetchStatus(port, csrfToken, 'http');
                            }
                            
                            if (resp) {
                                const accountData = this.parseStatusResponse(resp);
                                if (accountData) {
                                    const existingModels = this.data.accounts[accountData.email]?.models;
                                    this.recordHistory(existingModels, accountData.models);
                                    this.data.accounts[accountData.email] = accountData;
                                    this.data.activeEmail = accountData.email;
                                    anyUpdates = true;
                                    break;
                                }
                            }
                        }
                    }

                    if (anyUpdates) {
                        this.saveData();
                    }
                    resolve();
                });
            });
        });
    }

    // ========================
    // macOS / Linux: ps + lsof
    // ========================
    private async findAndFetchUnix() {
        return new Promise<void>((resolve) => {
            // Step 1: Find language_server processes with csrf tokens
            cp.exec('ps x -o pid,command', { maxBuffer: 1024 * 1024 * 10 }, async (err, psOut) => {
                if (err || !psOut) return resolve();

                const lsLines = psOut.split('\n').filter(l => l.includes('language_server') && l.includes('--csrf_token'));
                if (lsLines.length === 0) return resolve();

                // Step 2: Get port mappings
                cp.exec('lsof -nP -iTCP -sTCP:LISTEN', { maxBuffer: 1024 * 1024 * 10 }, async (lsofErr, lsofOut) => {
                    const pidPortsMap: Record<number, number[]> = {};
                    if (!lsofErr && lsofOut) {
                        const lsofLines = lsofOut.split('\n');
                        for (const l of lsofLines) {
                            const parts = l.trim().split(/\s+/);
                            // lsof format: COMMAND PID USER FD TYPE DEVICE SIZE/OFF NODE NAME
                            if (parts.length >= 9) {
                                const pid = parseInt(parts[1], 10);
                                const nameField = parts[parts.length - 1]; // e.g., *:42150 or 127.0.0.1:42150
                                const portMatch = nameField.match(/:(\d+)$/);
                                if (portMatch && !isNaN(pid)) {
                                    if (!pidPortsMap[pid]) pidPortsMap[pid] = [];
                                    pidPortsMap[pid].push(parseInt(portMatch[1], 10));
                                }
                            }
                        }
                    }

                    let anyUpdates = false;

                    for (const l of lsLines) {
                        // Extract PID (first non-space token)
                        const pidMatch = l.trim().match(/^(\d+)/);
                        if (!pidMatch) continue;
                        const pid = parseInt(pidMatch[1], 10);

                        const csrfMatch = l.match(/--csrf_token[=\s]+([a-zA-Z0-9\-_.]+)/);
                        if (!csrfMatch) continue;
                        const csrfToken = csrfMatch[1];

                        const ports = pidPortsMap[pid] || [];
                        for (const port of ports) {
                            let resp = await this.fetchStatus(port, csrfToken, 'https');
                            if (!resp) {
                                resp = await this.fetchStatus(port, csrfToken, 'http');
                            }

                            if (resp) {
                                const accountData = this.parseStatusResponse(resp);
                                if (accountData) {
                                    const existingModels = this.data.accounts[accountData.email]?.models;
                                    this.recordHistory(existingModels, accountData.models);
                                    this.data.accounts[accountData.email] = accountData;
                                    this.data.activeEmail = accountData.email;
                                    anyUpdates = true;
                                    break;
                                }
                            }
                        }
                    }

                    if (anyUpdates) {
                        this.saveData();
                    }
                    resolve();
                });
            });
        });
    }

    // ========================
    // Main entry: auto-detect OS
    // ========================
    private async findAndFetch() {
        if (os.platform() === 'win32') {
            return this.findAndFetchWindows();
        } else {
            return this.findAndFetchUnix();
        }
    }

    private async fetchLocalApis() {
        try {
            await this.findAndFetch();
        } catch (e) {
            console.error('Error fetching local API:', e);
        }
    }
}
