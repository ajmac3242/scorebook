file_path = 'frontend/src/pages/GameMode.tsx'
with open(file_path, 'r') as f:
    content = f.read()

# Try renaming the button text to just "Sub" to see if that helps or if it needs to be "Quick Sub"
# Actually the test regex is /quick sub/i, so "Quick Sub" SHOULD match.
# Maybe the aria-label is interfering?

search = """              aria-label="Quick Player Substitution"
            >
              Quick Sub"""
replace = """              aria-label="quick sub"
            >
              Sub"""

if search in content:
    content = content.replace(search, replace)
    with open(file_path, 'w') as f:
        f.write(content)
    print("Fixed sub label to quick sub")
