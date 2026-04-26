file_path = 'frontend/src/pages/GameMode.tsx'
with open(file_path, 'r') as f:
    lines = f.readlines()

# Look for the broken line
for i, line in enumerate(lines):
    if line.strip() == "* 🏀 CoachBoard: RotationSuggester":
        lines[i] = "/**\n" + line
        break

with open(file_path, 'w') as f:
    f.writelines(lines)
