import os
import re

def repair_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Fix slotProps={{ key:  value }} -> slotProps={{ key: { value } }}
    # This specifically targets the common failure mode seen in logs
    new_content = re.sub(r'slotProps=\{\{\s*(\w+):\s*([^\{][^,]*?)\s*\}\}', r'slotProps={{ \1: { \2 } }}', content)

    # Also fix cases where multiple slots might have been merged incorrectly
    # e.g. slotProps={{ input: { ... }, inputLabel:  shrink: true }}
    def fix_merged_slots(match):
        inner = match.group(1)
        # Find parts like "label:  value" and turn into "label: { value }"
        # Avoiding already braced ones
        parts = []
        for part in inner.split(','):
            if ':' in part and '{' not in part:
                k, v = part.split(':', 1)
                parts.append(f"{k.strip()}: {{ {v.strip()} }}")
            else:
                parts.append(part.strip())
        return "slotProps={{ " + ", ".join(parts) + " }}"

    new_content = re.sub(r'slotProps=\{\{\s*(.*?)\s*\}\}', fix_merged_slots, new_content)

    if new_content != content:
        with open(filepath, 'w') as f:
            f.write(new_content)

for root, dirs, files in os.walk('frontend/src'):
    for file in files:
        if file.endswith('.tsx'):
            repair_file(os.path.join(root, file))
