"""Check generated catalog without modifying the working copy."""
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

if __name__ == '__main__':
    root = Path(__file__).resolve().parents[1]
    with tempfile.TemporaryDirectory() as folder:
        generated = Path(folder)
        (generated / 'scripts').mkdir()
        (generated / 'src/content').mkdir(parents=True)
        shutil.copy(root / 'scripts/build-catalog.py', generated / 'scripts/build-catalog.py')
        shutil.copytree(root / 'content', generated / 'content')
        subprocess.run([sys.executable, str(generated / 'scripts/build-catalog.py')], check=True, capture_output=True)
        if (root / 'src/content/catalog.json').read_bytes() != (generated / 'src/content/catalog.json').read_bytes():
            raise SystemExit('Catalog differs from reviewed source. Rebuild and review the changed items; working copy was not overwritten.')
    print('Catalog matches its reviewed source and approval hashes.')
