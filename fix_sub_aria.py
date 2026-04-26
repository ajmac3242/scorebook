file_path = 'frontend/src/pages/GameMode.tsx'
with open(file_path, 'r') as f:
    content = f.read()

# Look for the Sub button
search = """              aria-label="Quick Player Substitution"
            >
              Sub"""
replace = """              aria-label="Quick Player Substitution"
            >
              Quick Sub"""

if search in content:
    content = content.replace(search, replace)
    with open(file_path, 'w') as f:
        f.write(content)
    print("Fixed sub label")
else:
    print("Sub label not found")
