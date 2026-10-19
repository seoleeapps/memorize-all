"""Static 16KB ELF checks. This does not claim native runtime validation."""
import argparse
import hashlib
import json
import struct
import zipfile
from pathlib import Path

PAGE = 0x4000


def elf_problems(headers):
    loads = [h for h in headers if h['type'] == 1]
    problems = []
    for h in loads:
        if h['alignment'] < PAGE or (h['address'] - h['offset']) % PAGE:
            problems.append('LOAD is not 16KB aligned')
    for relro in [h for h in headers if h['type'] == 0x6474e552]:
        end = relro['address'] + relro['size']
        if end % PAGE == 0:
            continue
        # Some linkers pad RELRO beyond the containing LOAD's mapped size.
        # It is still an exclusive RELRO LOAD when all mapped data is covered.
        own = next((h for h in loads if h['address'] == relro['address'] and h['address'] + h['size'] <= end), None)
        protected_start = relro['address'] // PAGE * PAGE
        protected_end = (end + PAGE - 1) // PAGE * PAGE
        overlap = any(h is not own and h['flags'] & 2 and h['address'] < protected_end
                      and h['address'] + h['size'] > protected_start for h in loads)
        if own is None or overlap:
            problems.append('RELRO protection overlaps writable data')
    return problems


def read_headers(data):
    if data[:6] != b'\x7fELF\x02\x01':
        raise ValueError('Expected a little-endian 64-bit ELF')
    offset = struct.unpack_from('<Q', data, 32)[0]
    size, count = struct.unpack_from('<HH', data, 54)
    headers = []
    for index in range(count):
        kind, flags, file_offset, address, _, _, memory_size, alignment = struct.unpack_from('<IIQQQQQQ', data, offset + index * size)
        headers.append(dict(type=kind, flags=flags, offset=file_offset, address=address, size=memory_size, alignment=alignment))
    return headers


def inspect(bundle):
    results = []
    with zipfile.ZipFile(bundle) as archive:
        for name in archive.namelist():
            if name.endswith('.so') and ('/arm64-v8a/' in name or '/x86_64/' in name):
                headers = read_headers(archive.read(name))
                results.append(dict(path=name, problems=elf_problems(headers), headers=headers))
    if not results:
        raise ValueError('No 64-bit native libraries found')
    return dict(artifactSha256=hashlib.sha256(Path(bundle).read_bytes()).hexdigest(), libraries=results,
                passed=all(not r['problems'] for r in results), nativeRuntime='unrun',
                rule='https://developer.android.com/guide/practices/page-sizes#check-relro')


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('bundle')
    parser.add_argument('--output', required=True)
    args = parser.parse_args()
    result = inspect(args.bundle)
    Path(args.output).write_text(json.dumps(result, indent=2) + '\n')
    failures = [r for r in result['libraries'] if r['problems']]
    print(f"64-bit libraries: {len(result['libraries'])}; failed: {len(failures)}; native runtime: unrun")
    raise SystemExit(0 if result['passed'] else 1)
