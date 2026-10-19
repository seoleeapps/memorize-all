"""Record a timed editorial review tied to the exact bilingual fact and variants.
No record is created by merely viewing an item. Candidate data stays candidate.
"""
import argparse, hashlib, json, datetime
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
p=argparse.ArgumentParser()
p.add_argument('command',choices=['show','record','report'])
p.add_argument('id',nargs='?')
p.add_argument('--seconds',type=int)
p.add_argument('--reviewer')
p.add_argument('--source-url')
p.add_argument('--usage')
p.add_argument('--fact',action='store_true');p.add_argument('--ko',action='store_true');p.add_argument('--en',action='store_true');p.add_argument('--unique-answer',action='store_true');p.add_argument('--rights',action='store_true');p.add_argument('--revised',action='store_true')
a=p.parse_args()
data=json.loads((ROOT/'src/content/catalog.json').read_text())
path=ROOT/'content/reviews.json';records=json.loads(path.read_text()) if path.exists() else {}
if a.command=='report':
 values=list(records.values());seconds=sum(v['seconds'] for v in values)
 print(json.dumps({'reviewed':len(values),'meanSeconds':seconds/len(values) if values else None,'revisionRate':sum(v['revised'] for v in values)/len(values) if values else None,'projectedHoursFor1000':seconds/len(values)*1000/3600 if values else None},indent=2));raise SystemExit
k=next((k for k in data['knowledge'] if k['id']==a.id),None)
if not k:p.error('Unknown knowledge ID')
questions=[q for q in data['questions'] if q['knowledgeId']==k['id']]
if a.command=='show':print(json.dumps({'knowledge':k,'questions':questions},ensure_ascii=False,indent=2));raise SystemExit
if not all([a.seconds and a.seconds>0,a.reviewer,a.source_url and a.source_url.startswith('https://'),a.usage,a.fact,a.ko,a.en,a.unique_answer,a.rights]):p.error('Record requires measured seconds, reviewer, item-level source URL, usage conditions and all five review checks')
# Preserve the candidate snapshot hash. Build merges approval only while the candidate is identical.
payload=json.dumps({'knowledge':{key:k.get(key) for key in ['id','factRevision','textRevision','title','explanation','visual']},'questions':questions},ensure_ascii=False,sort_keys=True).encode()
records[k['id']]={'sha256':hashlib.sha256(payload).hexdigest(),'seconds':a.seconds,'reviewer':a.reviewer,'sourceUrl':a.source_url,'usage':a.usage,'checkedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'revised':a.revised}
path.write_text(json.dumps(records,ensure_ascii=False,indent=2)+'\n')
print('Review recorded; rebuild the catalog and run check:content.')
