file_path = 'frontend/src/pages/GameMode.tsx'
with open(file_path, 'r') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if i > 4300 and line.strip() == "/**":
        if i + 1 < len(lines) and "const EditClockDialog" in lines[i+1]:
             lines[i] = "" # Remove the stray comment start
        elif i + 2 < len(lines) and "const EditClockDialog" in lines[i+2]:
             lines[i] = ""
             lines[i+1] = ""

with open(file_path, 'w') as f:
    f.writelines(lines)
