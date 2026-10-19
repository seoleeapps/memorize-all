import importlib.util
import unittest
from pathlib import Path

SPEC = importlib.util.spec_from_file_location(
    'artifact', Path(__file__).resolve().parents[1] / 'scripts/verify-android-artifact.py'
)
artifact = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(artifact)


class RelroTests(unittest.TestCase):
    def test_shared_writable_load_needs_aligned_relro_end(self):
        load = dict(type=1, flags=6, offset=0x680, address=0x4680, size=0x5980, alignment=0x4000)
        relro = dict(type=0x6474e552, flags=4, offset=0x680, address=0x4680, size=0x980, alignment=1)
        self.assertTrue(artifact.elf_problems([load, relro]))

    def test_own_load_and_separate_writable_page_is_safe(self):
        headers = [
            dict(type=1, flags=6, offset=0x680, address=0x4680, size=0x980, alignment=0x4000),
            dict(type=1, flags=6, offset=0x4000, address=0x8000, size=0x200, alignment=0x4000),
            dict(type=0x6474e552, flags=4, offset=0x680, address=0x4680, size=0x980, alignment=1),
        ]
        self.assertEqual(artifact.elf_problems(headers), [])
        headers[2]['size'] = 0x1000
        self.assertEqual(artifact.elf_problems(headers), [])
        headers[1]['address'] = 0x5000
        headers[1]['offset'] = 0x1000
        self.assertTrue(artifact.elf_problems(headers))

    def test_load_alignment_and_absent_relro(self):
        header = dict(type=1, flags=5, offset=0, address=0, size=0x680, alignment=0x4000)
        self.assertEqual(artifact.elf_problems([header]), [])
        header['alignment'] = 0x1000
        self.assertTrue(artifact.elf_problems([header]))


if __name__ == '__main__':
    unittest.main()
