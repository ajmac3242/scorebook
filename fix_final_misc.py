import re
import os

def fix_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # PaperProps to slotProps.paper
    content = content.replace('PaperProps={{', 'slotProps={{ paper: {')

    # Typography fontWeight bare prop to sx
    def fix_typo(match):
        tag = match.group(1)
        props = match.group(2)
        if 'fontWeight=' in props and 'sx=' not in props:
            props = props.replace('fontWeight=', 'sx={{ fontWeight: ')
            # This is simple and might break if complex, but lets try
            props = re.sub(r'sx=\{\{\s*fontWeight:\s*({[^}]+}|"[^"]+"|\d+)', r'sx={{ fontWeight: \1 }}', props)
        return f'<{tag} {props}'

    # Actually let's use a simpler replacement for known files
    if 'LivePreviewStrip.tsx' in filepath:
        content = content.replace('fontWeight={600}', 'sx={{ fontWeight: 600 }}')

    if 'SideNav.tsx' in filepath:
        content = content.replace('primaryTypographyProps={{', 'slotProps={{ primary: {')

    with open(filepath, 'w') as f:
        f.write(content)

fix_file('frontend/src/components/layout/SideNav.tsx')
fix_file('frontend/src/components/search/OmniSearch.tsx')
fix_file('frontend/src/components/theme/LivePreviewStrip.tsx')
