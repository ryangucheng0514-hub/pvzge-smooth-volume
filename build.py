"""Build an importable GP-Next ZIP with Python's standard library."""
from pathlib import Path
import json
import zipfile

root = Path(__file__).resolve().parent
manifest = json.loads((root / 'pack.json').read_text(encoding='utf-8'))
destination = root / 'dist' / f"pvzge-smooth-volume-{manifest['version']}.zip"
destination.parent.mkdir(exist_ok=True)
members = ['pack.json', 'scripts/main.js', '使用说明.txt']
assert manifest['js']['entry'] in members
with zipfile.ZipFile(destination, 'w', zipfile.ZIP_DEFLATED) as archive:
    for name in members:
        archive.writestr(name, (root / name).read_bytes())
with zipfile.ZipFile(destination) as archive:
    assert archive.testzip() is None
print(destination)
