import re

with open('frontend/src/pages/PlayerStats.tsx', 'r') as f:
    content = f.read()

# 1. Grid size and item
content = content.replace('size={{ xs: 12 }} xl={4}', 'size={{ xs: 12, xl: 4 }}')
content = content.replace('size={{ xs: 12 }} xl={8}', 'size={{ xs: 12, xl: 8 }}')
content = content.replace('item xs={6}', 'size={{ xs: 6 }}')

# 2. PaperProps to slotProps.paper
content = re.sub(r'PaperProps=\{\{\s*sx:\s*\{\s*borderRadius:\s*shellRadius,\s*\},?\s*\}\}',
                 r'slotProps={{ paper: { sx: { borderRadius: shellRadius } } }}', content)

# 3. Stack alignments and justifyContent
def replace_props_with_sx(match):
    tag = match.group(1)
    props = match.group(2)
    sx_content = []

    # Extract justifyContent
    jc_match = re.search(r'justifyContent="([^"]+)"', props)
    if jc_match:
        sx_content.append(f'justifyContent: "{jc_match.group(1)}"')
        props = props.replace(jc_match.group(0), '')

    # Extract alignItems (string or object)
    ai_match = re.search(r'alignItems="([^"]+)"', props)
    if ai_match:
        sx_content.append(f'alignItems: "{ai_match.group(1)}"')
        props = props.replace(ai_match.group(0), '')
    else:
        ai_obj_match = re.search(r'alignItems=\{\{(.*?)\}\}', props)
        if ai_obj_match:
            sx_content.append(f'alignItems: {{ {ai_obj_match.group(1)} }}')
            props = props.replace(ai_obj_match.group(0), '')

    if not sx_content:
        return match.group(0)

    # Check if sx already exists
    sx_match = re.search(r'sx=\{\{(.*?)\}\}', props)
    if sx_match:
        merged_sx = f'sx={{{{{", ".join(sx_content)}, {sx_match.group(1)}}}}}'
        props = props.replace(sx_match.group(0), merged_sx)
    else:
        props += f' sx={{{{{", ".join(sx_content)}}}}}'

    return f'<{tag} {props}'

content = re.sub(r'<(Stack|Grid)\s+([^>]+)', replace_props_with_sx, content)

with open('frontend/src/pages/PlayerStats.tsx', 'w') as f:
    f.write(content)
