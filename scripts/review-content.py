"""Record an editorial review tied to the exact bilingual fact and variants.
No record is created by merely viewing an item. Candidate data stays candidate.
"""
import argparse, hashlib, json, datetime
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
p=argparse.ArgumentParser()
p.add_argument('command',choices=['show','record','report'])
p.add_argument('id',nargs='?')
p.add_argument('--seconds',type=int)
p.add_argument('--batch-id')
p.add_argument('--evidence',help='Completed batch evidence under content/evidence; no per-item time is inferred')
p.add_argument('--reviewer')
p.add_argument('--source-url')
p.add_argument('--usage')
p.add_argument('--fact',action='store_true');p.add_argument('--ko',action='store_true');p.add_argument('--en',action='store_true');p.add_argument('--unique-answer',action='store_true');p.add_argument('--rights',action='store_true');p.add_argument('--revised',action='store_true')
a=p.parse_args()
data=json.loads((ROOT/'src/content/catalog.json').read_text())
path=ROOT/'content/reviews.json';records=json.loads(path.read_text()) if path.exists() else {}
if a.command=='report':
 values=list(records.values());timed=[v for v in values if v.get('seconds') is not None];seconds=sum(v['seconds'] for v in timed)
 batches={}
 for v in values:
  if v.get('batchId') and v.get('evidence'):
   batch=json.loads((ROOT/v['evidence']).read_text())
   batches[v['batchId']]={'elapsedSeconds':batch['elapsedSeconds'],'reviewed':len(batch['results'])}
 print(json.dumps({'reviewed':len(values),'individuallyTimed':len(timed),'meanSeconds':seconds/len(timed) if timed else None,'revisionRate':sum(v['revised'] for v in values)/len(values) if values else None,'projectedHoursFor1000':seconds/len(timed)*1000/3600 if timed else None,'batches':batches,'timingNote':'Batch elapsed time is reported once. It is not divided into fabricated per-item durations.'},indent=2));raise SystemExit
k=next((k for k in data['knowledge'] if k['id']==a.id),None)
if not k:p.error('Unknown knowledge ID')
questions=[q for q in data['questions'] if q['knowledgeId']==k['id']]
if a.command=='show':print(json.dumps({'knowledge':k,'questions':questions},ensure_ascii=False,indent=2));raise SystemExit
if not all([a.reviewer,a.source_url and a.source_url.startswith('https://'),a.usage,a.fact,a.ko,a.en,a.unique_answer,a.rights]):p.error('Record requires reviewer, item-level source URL, usage conditions and all five review checks')
# Preserve the candidate snapshot hash. Build merges approval only while the candidate is identical.
payload=json.dumps({'knowledge':{key:k.get(key) for key in ['id','factRevision','textRevision','title','explanation','visual']},'questions':questions},ensure_ascii=False,sort_keys=True).encode()
sha256=hashlib.sha256(payload).hexdigest()
timing={}
if a.batch_id or a.evidence:
 if a.seconds is not None or not (a.batch_id and a.evidence):p.error('Use either measured --seconds or both --batch-id and --evidence')
 evidence_path=(ROOT/a.evidence).resolve()
 if not evidence_path.is_relative_to((ROOT/'content/evidence').resolve()):p.error('Batch evidence must be under content/evidence')
 try:
  batch=json.loads(evidence_path.read_text())
  start=datetime.datetime.fromisoformat(batch['startedAt']);end=datetime.datetime.fromisoformat(batch['completedAt'])
  elapsed=(end-start).total_seconds()
  item=next(r for r in batch['results'] if r['knowledgeId']==k['id'])
  valid=batch['batchId']==a.batch_id and batch['status']=='complete' and start.tzinfo and end.tzinfo and end<=datetime.datetime.now(datetime.timezone.utc) and elapsed>0 and abs(batch['elapsedSeconds']-elapsed)<1
  valid=valid and item['sha256']==sha256 and item['sourceUrl']==a.source_url and all(item['checks'].get(c) is True for c in ['fact','ko','en','uniqueAnswer','rights'])
 except (OSError,KeyError,ValueError,StopIteration,TypeError):valid=False
 if not valid:p.error('Batch must be complete, have measured timestamps and contain matching source, hash and all five review checks for this item')
 timing={'batchId':a.batch_id,'evidence':str(evidence_path.relative_to(ROOT))}
elif a.seconds is None or a.seconds<=0:p.error('Record requires positive measured --seconds or completed batch evidence')
records[k['id']]={'sha256':sha256,'seconds':a.seconds,'reviewer':a.reviewer,'sourceUrl':a.source_url,'usage':a.usage,'checkedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'revised':a.revised,**timing}
path.write_text(json.dumps(records,ensure_ascii=False,indent=2)+'\n')
print('Review recorded; rebuild the catalog and run check:content.')
