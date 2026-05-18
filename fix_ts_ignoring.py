import re
import os

def fix_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Primary Playmaker/Finisher labels
    content = re.sub(
        r'shotChartJerseyMap\.get\(assistNetwork\.primaryPlaymakerId\)',
        'shotChartJerseyMap.get(assistNetwork.primaryPlaymakerId as string)',
        content
    )
    content = re.sub(
        r'shotChartJerseyMap\.get\(assistNetwork\.primaryFinisherId\)',
        'shotChartJerseyMap.get(assistNetwork.primaryFinisherId as string)',
        content
    )

    # Any other obvious cast fixes
    content = content.replace('.get(p.id)', '.get(p.id!)')
    content = content.replace('game.opponent', 'game.opponent as string')
    content = content.replace('game.location', 'game.location as string')
    content = content.replace('game.opponentLogoUrl', 'game.opponentLogoUrl as string')

    with open(filepath, 'w') as f:
        f.write(content)

fix_file('frontend/src/pages/GameStats.tsx')
