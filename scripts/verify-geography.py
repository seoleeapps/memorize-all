"""Read-only Wikidata P36 verification; never promotes editorial status automatically."""
import concurrent.futures
import datetime
import json
import urllib.request
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
catalog=json.loads((ROOT/'src/content/catalog.json').read_text())
questions={q['knowledgeId']:q for q in catalog['questions'] if q['id'].endswith('.forward')}
def fetch(qid):
 req=urllib.request.Request(f'https://www.wikidata.org/wiki/Special:EntityData/{qid}.json',headers={'User-Agent':'MemorizeAllContentReview/0.1 (local research)'})
 with urllib.request.urlopen(req,timeout=20) as r: return json.load(r)['entities'][qid]
def check(k):
 try:
  qid=k['source']['url'].rsplit('/',1)[-1];entity=fetch(qid)
  claims=[c for c in entity['claims'].get('P36',[]) if c.get('rank')!='deprecated' and not c.get('qualifiers',{}).get('P582')]
  preferred=[c for c in claims if c.get('rank')=='preferred'];claims=preferred or claims
  capitals=[c['mainsnak']['datavalue']['value']['id'] for c in claims if 'datavalue' in c['mainsnak']]
  expected=next(o['text']['en'] for o in questions[k['id']]['options'] if o['id']==k['id'])
  labels=[fetch(id)['labels'].get('en',{}).get('value') for id in capitals]
  return {'knowledgeId':k['id'],'entity':qid,'revision':entity['lastrevid'],'property':'P36','capitalIds':capitals,'labels':labels,'expected':expected,'match':expected in labels}
 except Exception as e:return {'knowledgeId':k['id'],'error':type(e).__name__,'match':False}
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
 results=list(pool.map(check,[k for k in catalog['knowledge'] if k['category']=='geography']))
out={'observedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'license':'CC0','results':results}
(ROOT/'content/evidence/geography.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'matched':sum(r['match'] for r in results),'total':len(results)}))
