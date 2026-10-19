"""Isolated browser regression for the exported RN Web app; no native SDK claims."""
import asyncio
import datetime
import json
import os
from pathlib import Path
from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'build/qa-web'
KEY = 'memorize-all.state.v1'
URL = os.environ.get('QA_URL', 'http://127.0.0.1:18766')

async def main():
 OUT.mkdir(parents=True, exist_ok=True)
 started = datetime.datetime.now(datetime.timezone.utc).isoformat()
 data = json.loads((ROOT/'src/content/catalog.json').read_text())
 questions = {q['id']:q for q in data['questions']}
 checks = []
 async with async_playwright() as pw:
  browser = await pw.chromium.launch(**({} if os.environ.get("CI") else {"channel":"msedge"}))
  context = await browser.new_context(viewport={'width':390,'height':844}, locale='en-US', accept_downloads=True)
  page = await context.new_page()
  errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  async def state():return await page.evaluate('(key)=>JSON.parse(localStorage.getItem(key))',KEY)
  async def saved(expression):await page.wait_for_function('(key)=>{const s=JSON.parse(localStorage.getItem(key));return s && ('+expression+');}',arg=KEY)
  async def snap(name):await page.screenshot(path=str(OUT/(name+'.png')),full_page=True)
  async def button(name):await page.get_by_role('button',name=name,exact=True).click()
  await page.goto(URL)
  await page.get_by_role('button',name='◎  Geography',exact=True).click()
  await button('Start learning')
  await page.get_by_test_id('start-daily').wait_for()
  await snap('today')
  await page.get_by_test_id('tab-explore').click()
  assert await page.get_by_role('button',name='View pack',exact=True).count()==5
  assert await page.get_by_text('Planned',exact=True).count()==0
  await snap('explore')
  await page.goto(URL+'/pack?category=history')
  await page.get_by_text('Pack not found',exact=True).wait_for()
  await button('Back to Explore')
  await page.get_by_test_id('tab-today').click()
  checks.append('onboarding, five populated topics, old empty topic link recovery')
  await page.get_by_test_id('start-daily').click()
  await saved('s.session !== null')
  st=await state();q=questions[st['session']['items'][0]['questionId']]
  wrong=next(o['id'] for o in q['options'] if o['id']!=q['answerId'])
  await page.get_by_test_id('answer-'+wrong).click()
  await saved('s.attempts.length === 1')
  await snap('quiz-feedback')
  before=await state()
  await page.reload()
  await page.get_by_role('button',name='Continue',exact=True).wait_for()
  assert (await state())==before
  legacy={**before,'interests':['history','geography']}
  await page.evaluate('([key,value])=>localStorage.setItem(key,JSON.stringify(value))',[KEY,legacy])
  await page.reload()
  await page.get_by_role('button',name='Continue',exact=True).wait_for()
  # Loading does not rewrite the original file; the next explicit commit saves
  # normalized interests while preserving the answered feedback and records.
  assert (await state())==legacy
  await button('Continue')
  upgraded=await state()
  assert upgraded['interests']==['geography']
  assert upgraded['progress']==before['progress'] and upgraded['attempts']==before['attempts']
  for _ in range(20):
   st=await state()
   if st['session']['cursor']>=len(st['session']['items']):break
   q=questions[st['session']['items'][st['session']['cursor']]['questionId']]
   await page.get_by_test_id('answer-'+q['answerId']).click()
   await button('Continue')
  await page.get_by_role('button',name='See my collection',exact=True).wait_for()
  st=await state()
  assert len(st['progress'])==10 and len(st['attempts'])==11
  assert all(p['stage']!='remembered' for p in st['progress'].values())
  await snap('complete')
  await button('See my collection')
  await snap('collection')
  await page.get_by_role('button',name='Read fact',exact=True).first.click()
  await page.get_by_role('button',name='View source ↗',exact=True).wait_for()
  await snap('detail')
  checks.append('wrong answer, one retry, exact restart restoration, ten unique facts, atlas and source detail')
  await page.goto(URL+'/settings')
  await button('한국어')
  await saved("s.locale === 'ko'")
  assert len((await state())['progress'])==10
  await button('English')
  await button('Flashcards')
  await saved("s.mode === 'card'")
  backup=OUT/'backup.json'
  async with page.expect_download() as download:
   await button('Export backup')
  await (await download.value).save_as(backup)
  original=json.loads(backup.read_text())
  await page.get_by_test_id('tab-today').click()
  await page.get_by_test_id('start-daily').click()
  await button('Reveal answer')
  await snap('card-back')
  await button('I was unsure')
  await page.get_by_test_id('flashcard-front').wait_for()
  await button('← Take a break')
  await page.get_by_test_id('tab-settings').click()
  async with page.expect_file_chooser() as chooser:
   await button('Import backup')
  await (await chooser.value).set_files(backup)
  await button('Cancel')
  assert (await state())!=original
  async with page.expect_file_chooser() as chooser:
   await button('Import backup')
  await (await chooser.value).set_files(backup)
  await button('Confirm restore')
  await button('Dismiss')
  assert (await state())==original
  legacy_backup=OUT/'legacy-backup.json'
  legacy_backup.write_text(json.dumps({**original,'interests':['geography','history']}))
  async with page.expect_file_chooser() as chooser:
   await button('Import backup')
  await (await chooser.value).set_files(legacy_backup)
  await button('Confirm restore')
  await button('Dismiss')
  assert (await state())==original
  await page.reload()
  await page.get_by_test_id('tab-settings').click()
  await page.get_by_role('button',name='Export backup',exact=True).wait_for()
  assert (await state())==original
  invalid=OUT/'invalid.json';invalid.write_text('{invalid')
  async with page.expect_file_chooser() as chooser:
   await button('Import backup')
  await (await chooser.value).set_files(invalid)
  await page.get_by_text('Choose a valid backup',exact=False).wait_for()
  assert (await state())==original
  await button('Dismiss')
  checks.append('language continuity, flashcard unsure, backup export, import cancel, restore and invalid backup')
  checks.append('schema 1 retired interests: restart and backup import preserve progress and normalize only retired selections')
  await page.evaluate("() => {window.qaSetItem = Storage.prototype.setItem; Storage.prototype.setItem = function(){throw new DOMException('QA quota','QuotaExceededError')};}")
  await button('한국어')
  await page.get_by_text('Could not save.',exact=False).wait_for()
  assert (await state())==original
  await snap('save-failure')
  await page.evaluate('Storage.prototype.setItem=window.qaSetItem;delete window.qaSetItem')
  await button('한국어')
  await saved("s.locale === 'ko'")
  good=await page.evaluate('(key)=>localStorage.getItem(key)',KEY)
  await page.evaluate('(key)=>localStorage.setItem(key,"{invalid")',KEY)
  await page.reload()
  await page.get_by_role('button',name='다시 시도 / Retry',exact=True).wait_for()
  assert await page.evaluate('(key)=>localStorage.getItem(key)',KEY)=='{invalid'
  await page.evaluate('([key,value])=>localStorage.setItem(key,value)',[KEY,good])
  await button('다시 시도 / Retry')
  await page.get_by_test_id('tab-today').wait_for()
  checks.append('failed write keeps state, retry persists, corrupt load preserves raw data and recovers')
  await page.goto(URL+'/settings');await button('English')
  # The browser clock advances only this isolated QA context.
  await page.clock.install(time=datetime.datetime.now()+datetime.timedelta(days=8))
  await page.reload()
  await page.get_by_test_id('tab-today').click()
  await page.get_by_role('button',name='Review 10 due facts first',exact=True).wait_for()
  await button('Review 10 due facts first')
  assert all(item['knowledgeId'] in original['progress'] for item in (await state())['session']['items'])
  await page.route('**/*',lambda route:route.abort())
  await button('Reveal answer');await button('I remembered')
  await page.get_by_test_id('flashcard-front').wait_for()
  await page.unroute('**/*')
  checks.append('eight-day due review selection and offline learning')
  await page.set_viewport_size({'width':320,'height':568})
  await page.add_style_tag(content='[dir="auto"]{font-size:200% !important;line-height:1.4 !important;}')
  await button('Reveal answer')
  await page.get_by_role('button',name='I remembered',exact=True).scroll_into_view_if_needed()
  assert not await page.evaluate('document.documentElement.scrollWidth > innerWidth')
  await snap('small-large-text')
  await page.set_viewport_size({'width':768,'height':1024})
  await button('I remembered');await button('← Take a break')
  assert not await page.evaluate('document.documentElement.scrollWidth > innerWidth')
  await snap('large-screen')
  checks.append('320px enlarged text and 768px layout; native font scaling unrun')
  assert not errors,errors
  await browser.close()
 report={'startedAt':started,'completedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'passed':checks,'runtimeErrors':errors,'nativeSdk':'unrun','isolatedData':'fresh browser context; localhost origin; synthetic backup'}
 (OUT/'results.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(report,ensure_ascii=False))

asyncio.run(main())
