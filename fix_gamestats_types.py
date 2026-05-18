import re

with open('frontend/src/pages/GameStats.tsx', 'r') as f:
    content = f.read()

# Fix liveQuery return types and Promise.resolve
content = content.replace('Promise.resolve(undefined)', 'undefined')
content = content.replace('Promise.resolve([])', '[]')

# Fix Typography display/textAlign movement (standard fixer missed some multi-props)
content = content.replace('display="block"', 'sx={{ display: "block" }}')
content = content.replace('textAlign="center"', 'sx={{ textAlign: "center" }}')

# Resolve Property 'id' does not exist on type 'never' in filter
content = content.replace(
    'markers={shotChartMarkers.filter((m) => m.playerId === selectedPlayerId)}',
    'markers={shotChartMarkers.filter((m: any) => m.playerId === selectedPlayerId)}'
)

# Merge adjacent sx
def merger(match):
    return f'sx={{{{{match.group(1).strip()}, {match.group(2).strip()}}}}}'

while '}} sx={{' in content:
    content = re.sub(r'sx=\{\{(.*?)\}\}\s+sx=\{\{(.*?)\}\}', merger, content, flags=re.DOTALL)

with open('frontend/src/pages/GameStats.tsx', 'w') as f:
    f.write(content)
