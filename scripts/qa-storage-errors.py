async def main(session):
 page=session.page()
 await page.reload()
 await page.get_by_role('button',name='← Take a break',exact=True).or_(page.get_by_test_id('tab-settings')).first.wait_for()
 if await page.get_by_role('button',name='← Take a break',exact=True).count():
  await page.get_by_role('button',name='← Take a break',exact=True).click()
 await page.get_by_test_id('tab-settings').click()
 await page.get_by_role('button',name='한국어',exact=True).click()
 await page.get_by_role('button',name='선택형 퀴즈',exact=True).click()
 # Force a write failure in this QA origin only. It must not advance UI or overwrite progress.
 original=await page.evaluate("localStorage.getItem('memorize-all.state.v1')")
 await page.evaluate("() => {window.qaSetItem = Storage.prototype.setItem; Storage.prototype.setItem=function(){throw new DOMException('QA quota','QuotaExceededError')};}")
 await page.get_by_role('button',name='English',exact=True).click()
 await page.get_by_text('저장하지 못했어요.',exact=False).wait_for()
 assert await page.evaluate("localStorage.getItem('memorize-all.state.v1')")==original
 await page.evaluate('Storage.prototype.setItem=window.qaSetItem; delete window.qaSetItem')
 await page.get_by_role('button',name='English',exact=True).click()
 assert await page.evaluate("JSON.parse(localStorage.getItem('memorize-all.state.v1')).locale")=='en'
 # Malformed storage is a load error, not a reset. Preserve and restore this QA state.
 good=await page.evaluate("localStorage.getItem('memorize-all.state.v1')")
 try:
  await page.evaluate("localStorage.setItem('memorize-all.state.v1','{invalid')")
  await page.reload()
  await page.get_by_role('button',name='다시 시도 / Retry').wait_for()
  assert await page.evaluate("localStorage.getItem('memorize-all.state.v1')")=='{invalid'
  await page.screenshot(path=str(Path(__file__).resolve().parents[1]/'docs/qa-storage-error.png'))
 finally:
  await page.evaluate("s=>localStorage.setItem('memorize-all.state.v1',s)",good)
 await page.get_by_role('button',name='다시 시도 / Retry').click()
 await page.get_by_test_id('tab-today').wait_for()
 return {'passed':['failed write preserves progress and UI','retry persists','corrupt data not overwritten','load retry recovers']}
