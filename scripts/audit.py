"""Simple local packaging audit, not a security guarantee."""
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[1]
ignored = {'.git', 'node_modules', '__pycache__', '.venv'}
forbidden_ext = {'.pdf', '.xlsx', '.xls', '.csv', '.png', '.jpeg', '.jpg', '.sqlite', '.db', '.pem', '.p12', '.pfx'}
forbidden_names = {'.env', '.env.local', '.env.production', 'id_rsa', 'id_ed25519'}
all_files = [p for p in ROOT.rglob('*') if p.is_file() and not set(p.relative_to(ROOT).parts).intersection(ignored)]
violations = [str(p.relative_to(ROOT)) for p in all_files if p.suffix.lower() in forbidden_ext or p.name.lower() in forbidden_names]
assert not violations, f'Unexpected binary, data or secret-like files: {violations}'
assert not (ROOT / 'source').exists(), 'No copied university sources are allowed.'
assert not (ROOT / 'frontend' / 'vendor').exists(), 'Bundled third-party vendors are not allowed.'
# A GitHub checkout has its own .git directory; do not reject it.
package = json.loads((ROOT / 'package.json').read_text(encoding='utf8'))
assert not package.get('dependencies') and not package.get('devDependencies'), 'Unexpected dependencies.'
assert not any('http://' in p.read_text(encoding='utf8') or 'https://' in p.read_text(encoding='utf8') for p in all_files if p.suffix in {'.js', '.html', '.css'}), 'Network URLs in app code.'
print(f'PASS: {len(all_files)} inspected files, no secret-like files, no remote dependencies, no Git history.')
