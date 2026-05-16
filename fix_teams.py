import re
content = open('frontend/src/pages/Teams.tsx').read()
content = content.replace('Grid2 as Grid', 'Grid')
content = content.replace('theme.shape.borderRadius', '((theme.shape.borderRadius as any) as number)')
content = content.replace('item xs={12} md={6} xl={4}', 'size={{ xs: 12, md: 6, xl: 4 }}')
content = content.replace('item xs={6} sm={3}', 'size={{ xs: 6, sm: 3 }}')
content = content.replace('inputProps={{ min: 1 }}', 'slotProps={{ htmlInput: { min: 1 } }}')
content = content.replace('PaperProps={{', 'slotProps={{ paper: {')
# Need to be careful with nested braces
content = re.sub(r'InputProps={{([\s\S]*?)}}', r'slotProps={{ input: {\1} }}', content)
# Special case for the multi-line slotProps.paper closing brace
# Search:
#         slotProps={{ paper: {
#           sx: {
#             borderRadius: cardRadius,
#             bgcolor: "background.paper",
#           },
#         }}
# To:
#         slotProps={{
#           paper: {
#             sx: {
#               borderRadius: cardRadius,
#               bgcolor: "background.paper",
#             },
#           },
#         }}
# My previous sed was a bit crude.
open('frontend/src/pages/Teams.tsx', 'w').write(content)
