import re
import os

def fix_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Use generic type for useLiveQuery to avoid complicated return type mismatches
    content = re.sub(r'useLiveQuery\(', 'useLiveQuery<any>(', content)

    # Remove Promise.resolve(undefined) and Promise.resolve([])
    content = content.replace('Promise.resolve(undefined)', 'undefined')
    content = content.replace('Promise.resolve([])', '[]')

    # Fix parseFloat(row.delta) issues
    content = content.replace('parseFloat(row.delta)', 'parseFloat(row.delta || "0")')

    with open(filepath, 'w') as f:
        f.write(content)

targets = [
    'frontend/src/pages/GameStats.tsx',
    'frontend/src/pages/OpponentScoutingReport.tsx',
    'frontend/src/pages/Opponents.tsx',
    'frontend/src/pages/PlayerStats.tsx',
    'frontend/src/pages/Players.tsx',
    'frontend/src/pages/Teams.tsx',
    'frontend/src/hooks/useGames.ts',
    'frontend/src/hooks/useTeams.ts'
]

for t in targets:
    if os.path.isfile(t):
        fix_file(t)
