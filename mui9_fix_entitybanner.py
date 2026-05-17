import re

with open('frontend/src/components/EntityBanner.tsx', 'r') as f:
    content = f.read()

# 1. Grid item and breakpoints to size
def fix_grid_size(match):
    tag = match.group(1)
    props = match.group(2)

    sizes = {}
    for bp in ['xs', 'sm', 'md', 'lg', 'xl']:
        bp_match = re.search(fr'\b{bp}=\s*({{[^}}]+}}|\"[^\"]+\"|\d+|true|false)', props)
        if bp_match:
            val = bp_match.group(1).strip('{}')
            sizes[bp] = val
            props = props.replace(bp_match.group(0), '')

    if sizes:
        size_str = ", ".join([f"{k}: {v}" for k, v in sizes.items()])
        size_prop = f'size={{{{{size_str}}}}}'
        props = props.replace('item', '')
        return f'<{tag} {props.strip()} {size_prop}'
    return match.group(0)

content = re.sub(r'<(Grid)\s+([^>]+)', fix_grid_size, content)

# 2. Alignment props to sx
def fix_alignments(match):
    tag = match.group(1)
    props = match.group(2)
    sx_entries = []

    for prop in ['alignItems', 'justifyContent']:
        prop_match = re.search(fr'\b{prop}=\s*({{[^}}]+}}|\"[^\"]+\")', props)
        if prop_match:
            val = prop_match.group(1).strip('{}')
            sx_entries.append(f"{prop}: {val}")
            props = props.replace(prop_match.group(0), '')

    if not sx_entries:
        return match.group(0)

    sx_match = re.search(r'sx=\{\{(.*?)\}\}', props)
    if sx_match:
        merged_sx = f'sx={{{{{", ".join(sx_entries)}, {sx_match.group(1)}}}}}'
        props = props.replace(sx_match.group(0), merged_sx)
    else:
        props += f' sx={{{{{", ".join(sx_entries)}}}}}'

    return f'<{tag} {props.strip()}'

content = re.sub(r'<(Stack|Grid)\s+([^>]+)', fix_alignments, content)

# 3. InputProps
# Careful replacement for EntityBanner.tsx
content = re.sub(r'InputProps=\{\{\s*(.*?)\s*\}\}', r'slotProps={{ input: { \1 } }}', content, flags=re.DOTALL)

with open('frontend/src/components/EntityBanner.tsx', 'w') as f:
    f.write(content)
