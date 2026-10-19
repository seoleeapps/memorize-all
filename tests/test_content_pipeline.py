import json
import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
class ContentReviewTests(unittest.TestCase):
 def setUp(self):
  self.temp=tempfile.TemporaryDirectory();self.addCleanup(self.temp.cleanup);self.root=Path(self.temp.name)
  for folder in ['scripts','src/content','content']:(self.root/folder).mkdir(parents=True,exist_ok=True)
  for script in ['build-catalog.py','review-content.py']:shutil.copy(ROOT/'scripts'/script,self.root/'scripts'/script)
  self.run_script('build-catalog.py')
 def run_script(self,name,*args):
  return subprocess.run(['python3',str(self.root/'scripts'/name),*args],capture_output=True,text=True,check=True)
 def data(self):return json.loads((self.root/'src/content/catalog.json').read_text())
 def test_incomplete_review_is_rejected(self):
  with self.assertRaises(subprocess.CalledProcessError):self.run_script('review-content.py','record','elements.sodium','--seconds','1')
  self.assertFalse((self.root/'content/reviews.json').exists())
 def test_exact_snapshot_only_can_be_promoted(self):
  self.run_script('review-content.py','record','elements.sodium','--seconds','1','--reviewer','unit-test-fixture','--source-url','https://example.test/fact','--usage','synthetic test only','--fact','--ko','--en','--unique-answer','--rights')
  self.run_script('build-catalog.py')
  self.assertEqual(next(k for k in self.data()['knowledge'] if k['id']=='elements.sodium')['review'],'approved')
  script=self.root/'scripts/build-catalog.py';script.write_text(script.read_text().replace('sodium|나트륨|Sodium|Na|Na','sodium|나트륨|Sodium|Xx|Xx'))
  self.run_script('build-catalog.py')
  self.assertEqual(next(k for k in self.data()['knowledge'] if k['id']=='elements.sodium')['review'],'candidate')
 def test_no_review_is_not_zero_cost(self):
  report=json.loads(self.run_script('review-content.py','report').stdout)
  self.assertEqual(report['reviewed'],0);self.assertIsNone(report['projectedHoursFor1000'])
if __name__=='__main__':unittest.main()
