"""Run with agent_browser.py on a leased tab after onboarding the QA-only localhost app."""
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
KEY='memorize-all.state.v1'
async def main(session):
 page=session.page()
 errors=[]
 page.on('pageerror',lambda error:errors.append(str(error)))
 data=json.loads((ROOT/'src/content/catalog.json').read_text())
 questions={q['id']:q for q in data['questions']}
 async def state(): return await page.evaluate('(key)=>JSON.parse(localStorage.getItem(key))',KEY)
 await page.get_by_test_id('start-daily').click()
 st=await state(); item=st['session']['items'][0];q=questions[item['questionId']]
 wrong=next(o['id'] for o in q['options'] if o['id']!=q['answerId'])
 await page.get_by_test_id('answer-'+wrong).click()
 await page.get_by_role('button',name='다음으로',exact=True).wait_for()
 await page.screenshot(path=str(ROOT/'docs/qa-feedback.png'))
 st=await state(); assert len(st['attempts'])==1 and st['attempts'][0]['grade']=='wrong'
 await page.reload()
 await page.get_by_role('button',name='다음으로',exact=True).wait_for()
 assert (await state())['attempts']==st['attempts']
 await page.get_by_role('button',name='다음으로',exact=True).click()
 for _ in range(10):
  st=await state();item=st['session']['items'][st['session']['cursor']];q=questions[item['questionId']]
  await page.get_by_test_id('answer-'+q['answerId']).click()
  await page.get_by_role('button',name='다음으로',exact=True).click()
 await page.get_by_role('button',name='도감에서 보기',exact=True).wait_for()
 await page.screenshot(path=str(ROOT/'docs/qa-complete.png'))
 st=await state();assert len(st['progress'])==10 and len(st['attempts'])==11
 assert all(p['stage']!='remembered' for p in st['progress'].values())
 await page.get_by_role('button',name='도감에서 보기',exact=True).click()
 await page.get_by_test_id('tab-settings').click()
 await page.get_by_role('button',name='English',exact=True).click()
 st=await state();assert len(st['progress'])==10 and st['locale']=='en'
 await page.get_by_role('button',name='Flashcards',exact=True).click()
 async with page.expect_download() as download_info:
  await page.get_by_role('button',name='Export backup',exact=True).click()
 download=await download_info.value
 backup=ROOT/'docs/qa-backup.json'
 await download.save_as(str(backup))
 saved=json.loads(backup.read_text());assert len(saved['attempts'])==11
 await page.get_by_test_id('tab-today').click()
 await page.get_by_test_id('start-daily').click()
 await page.get_by_role('button',name='Reveal answer',exact=True).click()
 await page.get_by_role('button',name='I was unsure',exact=True).click()
 await page.get_by_test_id('flashcard-front').wait_for()
 await page.get_by_role('button',name='← Take a break',exact=True).click()
 await page.get_by_test_id('tab-settings').click()
 async with page.expect_file_chooser() as chooser_info:
  await page.get_by_role('button',name='Import backup',exact=True).click()
 chooser=await chooser_info.value
 await chooser.set_files(str(backup))
 await page.get_by_role('button',name='Confirm restore',exact=True).click()
 await page.get_by_role('button',name='Dismiss',exact=True).click()
 st=await state();assert st==saved
 # Browser runtime robustness: same-page network failure, no network dependency for learning.
 await page.route('**/*',lambda route:route.abort())
 await page.get_by_test_id('tab-today').click()
 await page.get_by_test_id('start-daily').click()
 await page.get_by_role('button',name='Reveal answer',exact=True).click()
 await page.get_by_role('button',name='I remembered',exact=True).click()
 await page.get_by_test_id('flashcard-front').wait_for()
 await page.unroute('**/*')
 # Small view and 200% font approximation; native Dynamic Type remains a separate gate.
 await page.set_viewport_size({'width':320,'height':568})
 await page.add_style_tag(content='[dir="auto"] {font-size:200% !important;line-height:1.4 !important;}')
 await page.screenshot(path=str(ROOT/'docs/qa-small-large-text.png'))
 overflow=await page.evaluate('document.documentElement.scrollWidth > innerWidth')
 assert not overflow
 assert not errors,errors
 return {'passed':['wrong answer and one retry','restart with feedback preserved','10 facts not 11','same-session not mastered','language preserves progress','flashcard unsure','backup export and confirmed restore','network requests blocked during learning','320px / enlarged text no horizontal overflow'],'runtimeErrors':errors}
