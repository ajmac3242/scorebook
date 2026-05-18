import re

def fix_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Primary playmaker/finisher fix again
    content = re.sub(
        r'shotChartJerseyMap\.get\(assistNetwork\.primaryPlaymakerId as string\)',
        'shotChartJerseyMap.get(assistNetwork.primaryPlaymakerId as any)',
        content
    )
    content = re.sub(
        r'shotChartJerseyMap\.get\(assistNetwork\.primaryFinisherId as string\)',
        'shotChartJerseyMap.get(assistNetwork.primaryFinisherId as any)',
        content
    )

    # Fix implicit any
    content = content.replace('(tp) =>', '(tp: any) =>')
    content = content.replace('(p) =>', '(p: any) =>')
    content = content.replace('(play) =>', '(play: any) =>')
    content = content.replace('(g) =>', '(g: any) =>')
    content = content.replace('(opponent) =>', '(opponent: any) =>')

    with open(filepath, 'w') as f:
        f.write(content)

fix_file('frontend/src/pages/GameStats.tsx')
fix_file('frontend/src/pages/OpponentScoutingReport.tsx')
fix_file('frontend/src/pages/Opponents.tsx')
