import sys

file_path = 'frontend/src/pages/GameMode.tsx'
with open(file_path, 'r') as f:
    lines = f.readlines()

# Find RotationSuggester definition
start_idx = -1
end_idx = -1
for i, line in enumerate(lines):
    if "const RotationSuggester" in line:
        start_idx = i - 3 # include comments
    if start_idx != -1 and line.startswith("};") and i > start_idx:
        end_idx = i + 1
        break

if start_idx != -1 and end_idx != -1:
    suggester_code = lines[start_idx:end_idx]
    del lines[start_idx:end_idx]

    # Insert before GameMode
    insert_idx = -1
    for i, line in enumerate(lines):
        if "const GameMode" in line:
            insert_idx = i
            break

    if insert_idx != -1:
        lines[insert_idx:insert_idx] = suggester_code
        with open(file_path, 'w') as f:
            f.writelines(lines)
        print("Moved RotationSuggester")
    else:
        print("GameMode not found")
else:
    print(f"RotationSuggester not found {start_idx} {end_idx}")
