import { getAllAccounts, updateAccount, getStats } from '../data/accounts.js';
import { exec } from 'child_process';
import util from 'util';
const execPromise = util.promisify(exec);

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const accounts = await getAllAccounts();
    
    // Process Antigravity/Cursor Accounts
    for (const acc of accounts) {
      if (acc.provider === 'antigravity' && acc.credential) {
        try {
          const isGoogleToken = acc.credential.startsWith('ya29.');
          let data = null;

          if (!isGoogleToken) {
            const apiRes = await fetch('https://api2.cursor.sh/exa.language_server_pb.LanguageServerService/GetUserStatus', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/connect+json',
                'Authorization': `Bearer ${acc.credential}`,
                'User-Agent': 'Cursor/0.45.0'
              },
              body: JSON.stringify({})
            });
            if (apiRes.ok) data = await apiRes.json();
          } else {
             // Mock Google Cloud Code (Antigravity) Limits since it does not use a strict numerical quota backend
             // Try to read real quota from local Antigravity state.vscdb if running locally!
             try {
                const pyScript = `
import sqlite3, json, sys
try:
  conn = sqlite3.connect(r'C:\\Users\\Gman\\AppData\\Roaming\\Antigravity\\User\\globalStorage\\state.vscdb', uri=True)
  cursor = conn.cursor()
  cursor.execute("SELECT value FROM ItemTable WHERE key='n2ns.antigravity-panel'")
  row = cursor.fetchone()
  if row:
      data = json.loads(row[0])
      print(json.dumps(data.get('tfa.lastSnapshot', {})))
except Exception as e:
  sys.exit(1)
`;
                const { stdout } = await execPromise(`python -c "${pyScript.replace(/\n/g, ' ')}"`);
                const snapshot = JSON.parse(stdout.trim());
                if (snapshot && snapshot.data) {
                   const sData = snapshot.data;
                   
                   // Find exact models from the snapshot
                   const findModel = (name) => sData.models?.find(m => m.label && m.label.includes(name));
                   const geminiProModel = findModel('Gemini 3.1 Pro');
                   const claudeModel = findModel('Claude');
                   
                   const promptCurrent = sData.promptCredits?.available ?? 500;
                   const promptMax = sData.promptCredits?.monthly ?? 50000;
                   const flowCurrent = sData.flowCredits?.available ?? 100;
                   const flowMax = sData.flowCredits?.monthly ?? 150000;

                   await updateAccount(acc.id, {
                      status: 'active',
                      models: {
                        ...acc.models,
                        geminiPro: { 
                          percent: geminiProModel ? geminiProModel.remainingPercentage : 'N/A', 
                          time: geminiProModel ? geminiProModel.timeUntilReset : 'N/A', 
                          color: 'text-emerald-400' 
                        },
                        claude: { 
                          percent: claudeModel ? claudeModel.remainingPercentage : 'N/A', 
                          time: claudeModel ? claudeModel.timeUntilReset : 'N/A', 
                          color: 'text-amber-500' 
                        }
                      },
                      credits: {
                        prompt: { current: promptCurrent, max: promptMax },
                        flow: { current: flowCurrent, max: flowMax }
                      }
                   });
                   continue; // Skip the default block
                }
             } catch(pythonErr) {
                console.log('Local DB sync failed, falling back to proxy tracking mock', pythonErr.message);
             }

             data = { stripe: { usage: { fastRequestsLimit: 1500, fastRequestsUsage: acc.credits.prompt.max - acc.credits.prompt.current, claudeOpusLimit: 500, claudeOpusUsage: 0 } } };
          }

          if (data) {
            // Extract Quotas
            const stripeInfo = data.stripe || {};
            const usage = stripeInfo.usage || {};
            
            // Default mapping, Antigravity might inject usage differently.
            // Using typical Cursor Usage fields:
            const fastLimit = usage.fastRequestsLimit ?? 1500;
            const fastUsage = usage.fastRequestsUsage ?? 0;
            const claudeLimit = usage.claudeOpusLimit ?? 500;
            const claudeUsage = usage.claudeOpusUsage ?? 0;
            const gpt4Usage = usage.gpt4Usage ?? 0;
            
            const fastPercent = fastLimit > 0 ? ((fastUsage / fastLimit) * 100).toFixed(1) : 'N/A';
            const claudePercent = claudeLimit > 0 ? ((claudeUsage / claudeLimit) * 100).toFixed(1) : 'N/A';
            // Mapping fast requests to Gemini Pro, Claude Opus to Claude
            
            await updateAccount(acc.id, {
              status: fastUsage >= fastLimit ? 'warning' : 'active',
              models: {
                ...acc.models,
                geminiPro: { 
                  percent: isNaN(fastPercent) ? 'N/A' : (100 - parseFloat(fastPercent)).toFixed(1), 
                  time: `Used ${fastUsage}/${fastLimit}`, 
                  color: 'text-emerald-400' 
                },
                claude: { 
                  percent: isNaN(claudePercent) ? 'N/A' : (100 - parseFloat(claudePercent)).toFixed(1), 
                  time: `Used ${claudeUsage}/${claudeLimit}`, 
                  color: 'text-amber-500' 
                }
              },
              credits: {
                prompt: { current: Math.max(0, fastLimit - fastUsage), max: fastLimit },
                flow: { current: acc.credits.flow.current, max: acc.credits.flow.max }
              }
            });
          } else {
             await updateAccount(acc.id, { status: 'error' });
          }
        } catch (e) {
          console.error(`Error fetching quota for ${acc.id}:`, e);
          await updateAccount(acc.id, { status: 'error' });
        }
      }
    }

    const updatedStats = await getStats();
    const updatedAccounts = await getAllAccounts();

    return res.status(200).json({
      accounts: updatedAccounts,
      stats: updatedStats,
      refreshedAt: new Date().toISOString(),
      message: 'Quotas refreshed successfully',
    });
  } catch (err) {
    console.error('Refresh Error:', err);
    return res.status(500).json({ error: 'Failed to refresh quotas' });
  }
}
