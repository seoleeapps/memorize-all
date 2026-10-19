"""Run on a fresh, QA-only localhost origin with agent_browser.py --file.

Uses actual UI actions for progression. Only corruption/quota/cancel events are
injected, on the QA origin, to exercise recovery. No user origin is reset.
"""
import json
from playwright.async_api import expect
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
URL = 'http://localhost:18826'
KEY = 'memorize-all.state.v1'

async def run_checks(session):
 page = session.page()
 def testid(name): return page.locator(f'[data-testid="{name}"]:visible')
 errors = []
 page.on('pageerror', lambda error: errors.append(str(error)))
 questions = {q['id']:q for q in json.loads((ROOT/'src/content/catalog.json').read_text())['questions']}
 shots = {}
 stamp = datetime.now().strftime('%Y%m%d-%H%M%S')
 async def capture(name):
  path = await session.screenshot(f'{stamp}-{name}.png')
  destination = ROOT/'docs/qa-ui'/f'{name}.png'
  destination.write_bytes(Path(path).read_bytes())
  shots[name] = str(destination.relative_to(ROOT))
 async def state():
  return await page.evaluate('(key)=>JSON.parse(localStorage.getItem(key))', KEY)
 async def cursor(value):
  await page.wait_for_function('([key,value])=>JSON.parse(localStorage.getItem(key)).session.cursor===value', arg=[KEY,value])
 await page.goto(URL)
 await page.set_viewport_size({'width':390,'height':844})
 assert await state() is None, 'Use a fresh QA-only port. Never reset existing records.'
 await page.get_by_role('button',name='지리',exact=False).click()
 await page.get_by_role('button',name='1개 분야로 시작',exact=True).click()
 await testid('start-daily').wait_for()
 await capture('home')
 # Interest edits are a draft and cancel preserves the saved choices.
 await page.get_by_role('button',name='바꾸기',exact=True).click()
 await page.get_by_role('button',name='달',exact=False).click()
 await page.get_by_role('button',name='취소',exact=True).click()
 assert (await state())['interests']==['geography']
 await testid('start-daily').click()
 await testid('mode-card').click()
 await testid('flashcard-front').wait_for()
 original = await state()
 assert original['session']['mode']=='card'
 assert await page.locator('[data-testid^="answer-"]').count()==0
 await capture('card-front')
 # Switching away, settings change, and resuming preserve the same queue.
 await page.get_by_role('button',name='← 잠시 쉬기',exact=True).click()
 await testid('tab-settings').click()
 await testid('mode-quiz').click()
 await testid('tab-today').click()
 await testid('start-daily').click()
 assert (await state())['session']['items']==original['session']['items']
 assert await page.locator('[data-testid^="answer-"]').count()==4
 st=await state();q=questions[st['session']['items'][0]['questionId']]
 wrong=next(o['id'] for o in q['options'] if o['id']!=q['answerId'])
 await testid('answer-'+wrong).click()
 await page.get_by_role('button',name='다음으로',exact=True).wait_for()
 answered=await state()
 await testid('mode-card').click()
 assert (await state())['session']['mode']=='quiz'
 await page.reload()
 await page.get_by_role('button',name='다음으로',exact=True).wait_for()
 assert (await state())['attempts']==answered['attempts']
 await page.get_by_role('button',name='다음으로',exact=True).click()
 await testid('flashcard-front').wait_for()
 # Storage failure keeps the revealed card and allows a retry of the same grade.
 await testid('flashcard-front').click()
 await testid('mode-quiz').click()
 assert await page.locator('[data-testid^="answer-"]:visible').count()==4
 await testid('mode-card').click()
 await testid('flashcard-front').wait_for()
 await page.get_by_role('button',name='답 확인하기',exact=True).click()
 await capture('card-back')
 await page.get_by_role('button',name='출처 보기',exact=True).click()
 await page.get_by_role('button',name='출처 확인 ↗',exact=True).wait_for()
 await page.get_by_role('button',name='출처 보기',exact=True).click()
 await page.evaluate("() => {window.qaSetItem=Storage.prototype.setItem; Storage.prototype.setItem=function(){throw new DOMException('QA quota','QuotaExceededError')};}")
 before=await state()
 await testid('grade-unsure').click()
 await page.get_by_text('저장하지 못했어요.',exact=False).wait_for()
 assert await state()==before
 assert await testid('flashcard-back').count()==1
 await capture('save-error')
 await page.evaluate('Storage.prototype.setItem=window.qaSetItem; delete window.qaSetItem')
 await testid('grade-unsure').click()
 await cursor(2)
 assert (await state())['attempts'][-1]['mode']=='card'
 assert (await state())['session']['feedback'] is None
 assert await page.get_by_role('button',name='다음으로',exact=True).count()==0
 await page.reload()
 await testid('flashcard-front').wait_for()
 assert (await state())['session']['cursor']==2
 # Complete cards, including each incorrect/unsure retry, through visible buttons.
 while (await state())['session']['cursor'] < len((await state())['session']['items']):
  st=await state();i=st['session']['cursor']
  await page.get_by_role('button',name='답 확인하기',exact=True).click()
  await testid('grade-correct').click()
  await cursor(i+1)
 await page.get_by_role('button',name='도감에서 보기',exact=True).wait_for()
 st=await state()
 assert len(st['progress'])==10 and len(st['attempts'])==12
 assert all(p['stage']!='remembered' for p in st['progress'].values())
 await capture('complete')
 await page.get_by_role('button',name='도감에서 보기',exact=True).click()
 await page.get_by_role('button',name='오래 기억함',exact=True).click()
 await page.get_by_role('button',name='전체 보기',exact=True).click()
 await page.get_by_role('button',name='지식 살펴보기',exact=True).first.click()
 await capture('detail')
 await page.get_by_role('button',name='← 도감',exact=True).click()
 await testid('tab-settings').click()
 await page.get_by_role('button',name='English',exact=True).click()
 assert len((await state())['progress'])==10
 # Export/import confirmation + cancelling preserves the current records.
 async with page.expect_download() as download_info:
  await page.get_by_role('button',name='Export backup',exact=True).click()
 downloaded=await session.save_download(await download_info.value,f'{stamp}-backup.json')
 saved=json.loads(Path(downloaded).read_text())
 async with page.expect_file_chooser() as chooser_info:
  await page.get_by_role('button',name='Import backup',exact=True).click()
 chooser=await chooser_info.value
 await chooser.set_files(str(downloaded))
 await page.get_by_role('button',name='Cancel',exact=True).click()
 assert await state()==saved
 # Headless chooser cannot drive the OS cancel button; dispatch its documented event.
 async with page.expect_file_chooser():
  await page.get_by_role('button',name='Import backup',exact=True).click()
 await page.locator('input[type=file]').dispatch_event('cancel')
 await page.wait_for_function('document.querySelector("input[type=file]")===null')
 await expect(page.get_by_role('button',name='Import backup',exact=True)).to_be_enabled()
 # Invalid files show a recoverable error and do not modify records.
 async with page.expect_file_chooser() as chooser_info:
  await page.get_by_role('button',name='Import backup',exact=True).click()
 await (await chooser_info.value).set_files({'name':'bad.json','mimeType':'application/json','buffer':b'{}'})
 await page.get_by_role('button',name='Dismiss',exact=True).click()
 assert await state()==saved
 async with page.expect_file_chooser() as chooser_info:
  await page.get_by_role('button',name='Import backup',exact=True).click()
 await (await chooser_info.value).set_files(str(downloaded))
 await page.get_by_role('button',name='Confirm restore',exact=True).click()
 await page.get_by_role('button',name='Dismiss',exact=True).click()
 assert await state()==saved
 # Finish the second half of this pack, then manually practice its learned facts.
 await testid('tab-explore').click()
 await capture('explore')
 await page.get_by_role('button',name='View pack',exact=True).first.click()
 await page.get_by_role('button',name='Study this pack',exact=True).click()
 while (await state())['session']['cursor'] < len((await state())['session']['items']):
  st=await state();i=st['session']['cursor']
  await page.get_by_role('button',name='Reveal answer',exact=True).click()
  await testid('grade-correct').click()
  await cursor(i+1)
 await page.get_by_role('button',name='See my collection',exact=True).click()
 assert len((await state())['progress'])==20
 await testid('tab-explore').click()
 await page.get_by_role('button',name='View pack',exact=True).first.click()
 await page.get_by_role('button',name='Practice this pack again',exact=True).click()
 assert all(item.get('practice') for item in (await state())['session']['items'])
 await page.route('**/*',lambda route:route.abort())
 await page.get_by_role('button',name='Reveal answer',exact=True).click()
 await testid('grade-correct').click()
 await cursor(1)
 await page.unroute('**/*')
 # Key small-screen states and enlarged text: no horizontal clipping, actions work.
 await page.set_viewport_size({'width':320,'height':568})
 await capture('small-card-front')
 await page.add_style_tag(content='[dir="auto"] {font-size:200% !important;line-height:1.4 !important;}')
 await testid('flashcard-front').click()
 await capture('large-text')
 assert not await page.evaluate('document.documentElement.scrollWidth>innerWidth')
 await testid('grade-wrong').click()
 await cursor(2)
 # Missing detail must never silently open settings.
 await page.goto(URL+'/detail?id=missing')
 await page.get_by_role('button',name='Back to collection',exact=True).click()
 assert not errors, errors
 result={'passed':['mode change during active study','quiz options visible','card front and reveal','switching back hides the revealed answer','card source disclosure','grade advances once','quiz feedback survives mode change and reload','interest edit cancellation','save failure and retry','restart and resume','two bounded retries','no immediate mastery','filtered collection empty state','language preserves facts','backup export/restore/cancel/error','completed pack practice','offline interactions','320px and enlarged text','missing fact recovery'],'screenshots':shots,'runtimeErrors':errors}
 (ROOT/'docs/qa-ui/results.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
 return result

async def main(session):
 import traceback
 try:
  return await run_checks(session)
 except Exception:
  return {"error":traceback.format_exc()}
