import sqlite3
import json
conn = sqlite3.connect(r'C:\Users\Gman\AppData\Roaming\Antigravity\User\globalStorage\state.vscdb')
cursor = conn.cursor()
cursor.execute("SELECT value FROM ItemTable WHERE key='n2ns.antigravity-panel'")
row = cursor.fetchone()
if row:
    data = json.loads(row[0])
    for k in ['tfa.lastSnapshot', 'tfa.lastDisplayPercentage', 'tfa.lastUsageRate', 'tfa.lastTokenUsage']:
        if k in data:
            print(f"--- {k} ---")
            print(json.dumps(data[k], indent=2))
        
conn.close()
