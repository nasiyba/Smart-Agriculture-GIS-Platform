import re
import glob

files = glob.glob('src/styles/*.css') + glob.glob('src/components/**/*.css', recursive=True)

total_removed = 0
for path in files:
    with open(path) as f:
        content = f.read()

    before = content
    content = re.sub(r'[ \t]*-?webkit-backdrop-filter\s*:\s*[^;]+;\n?', '', content)
    content = re.sub(r'[ \t]*backdrop-filter\s*:\s*[^;]+;\n?', '', content)

    if content != before:
        removed = before.count('backdrop-filter')
        total_removed += removed
        with open(path, 'w') as f:
            f.write(content)
        print(f'{path}: removed {removed} backdrop-filter declaration(s)')

print(f'\nTotal removed: {total_removed}')
