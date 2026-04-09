import * as vscode from 'vscode';
import { QuotaManager, QuotaData } from './quotaManager';

export class StatusBarController {
    private statusBarItem: vscode.StatusBarItem;

    constructor(private context: vscode.ExtensionContext, private quotaManager: QuotaManager) {
        this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
        this.statusBarItem.command = 'agq.openDashboard';
        this.context.subscriptions.push(this.statusBarItem);
        
        this.quotaManager.onChange.event((data) => this.update(data));
        this.update(this.quotaManager.getData());
    }

    public update(data: QuotaData) {
        if (!data.activeEmail || !data.accounts[data.activeEmail]) {
            this.statusBarItem.text = '$(sync~spin) AGQ: Syncing...';
            this.statusBarItem.tooltip = 'Scanning for native IDE quotas...';
            this.statusBarItem.show();
            return;
        }

        const activeAccount = data.accounts[data.activeEmail];
        let lowestPercent = 100;

        let formattedTier = activeAccount.tier || 'Unknown';

        const md = new vscode.MarkdownString();
        md.isTrusted = true;
        md.supportThemeIcons = true;
        
        md.appendMarkdown(`### $(dashboard) Native Quota Monitor\n\n`);
        md.appendMarkdown(`$(account) &nbsp;**${data.activeEmail}**&nbsp;&nbsp;|&nbsp;&nbsp;$(verified-filled) *${formattedTier}*\n\n---\n\n`);

        activeAccount.models.forEach(m => {
            if (m.percentage < lowestPercent) lowestPercent = m.percentage;
            let icon = m.percentage < 20 ? '$(error)' : m.percentage < 50 ? '$(warning)' : '$(pass)';
            md.appendMarkdown(`${icon} **${m.name}**\n\n`);
            md.appendMarkdown(`&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;$(pie-chart) **${m.percentage}%** remaining &nbsp;•&nbsp; $(clock) *Resets in ${m.resetIn}*\n\n`);
        });

        const otherEmails = Object.keys(data.accounts).filter(e => e !== data.activeEmail);
        if (otherEmails.length > 0) {
            md.appendMarkdown('---\n\n#### $(organization) Offline Accounts\n\n');
            otherEmails.forEach(e => {
                md.appendMarkdown(`$(circle-outline) ${e}\n\n`);
            });
        }

        md.appendMarkdown('---\n\n[$(link-external) Open Full Dashboard](command:agq.openDashboard "Launch the interactive dashboard panel")');

        const alertIcon = lowestPercent < 20 ? '$(error)' : lowestPercent < 50 ? '$(warning)' : '$(check)';
        this.statusBarItem.text = `${alertIcon} AGQ: ${lowestPercent}%`;
        
        if (lowestPercent < 20) {
            this.statusBarItem.color = new vscode.ThemeColor('errorForeground');
        } else if (lowestPercent < 50) {
            this.statusBarItem.color = new vscode.ThemeColor('charts.yellow');
        } else {
            this.statusBarItem.color = new vscode.ThemeColor('testing.iconPassed');
        }

        this.statusBarItem.tooltip = md;
        this.statusBarItem.show();
    }

    public dispose() {
        this.statusBarItem.dispose();
    }
}
