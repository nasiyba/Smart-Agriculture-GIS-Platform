path = 'src/map/mapViewFactory.ts'
with open(path) as f:
    content = f.read()

broken = "    padX = (xmax - xmin) * 0.4 or 0.0008"
fixed = "    const padX = (xmax - xmin) * 0.4 || 0.0008;\n    const padY = (ymax - ymin) * 0.4 || 0.0008;"

if broken not in content:
    print('WARNING: broken line not found exactly as expected - paste the current file content and I will look again')
else:
    content = content.replace(broken, fixed)
    with open(path, 'w') as f:
        f.write(content)
    print('Repaired successfully')
