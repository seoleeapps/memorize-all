"""Capture actual RN Web screens using synthetic local progress, not native-device proof."""
import asyncio
import base64
import json
import os
from pathlib import Path
from playwright.async_api import async_playwright
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'play-store/screenshots/phone'
async def main():
 OUT.mkdir(parents=True,exist_ok=True)
 async with async_playwright() as pw:
  browser=await pw.chromium.launch(**({} if os.environ.get('CI') else {'channel':'msedge'}))
  for language in ['en','ko']:
   context=await browser.new_context(viewport={'width':360,'height':640},device_scale_factor=3,locale='en-US' if language=='en' else 'ko-KR')
   page=await context.new_page();await page.goto('http://127.0.0.1:18766')
   await page.get_by_role('button',name='◎  Geography' if language=='en' else '◎  지리',exact=True).click()
   await page.get_by_role('button',name='Start with 1 topics' if language=='en' else '1개 분야로 시작',exact=True).click()
   await page.get_by_test_id('start-daily').wait_for()
   await page.screenshot(path=str(OUT/f'today-{language}.png'))
   await page.get_by_test_id('tab-explore').click()
   await page.screenshot(path=str(OUT/f'explore-{language}.png'))
   await page.get_by_role('button',name='View pack' if language=='en' else '묶음 보기',exact=True).nth(1).click()
   await page.get_by_role('button',name='Study this pack' if language=='en' else '이 묶음 학습하기',exact=True).click()
   await page.locator('[data-testid^="answer-"]').first.wait_for()
   await page.screenshot(path=str(OUT/f'quiz-{language}.png'))
   await page.get_by_role('button',name='Flashcards' if language=='en' else '플래시카드',exact=True).click()
   await page.get_by_role('button',name='Reveal answer' if language=='en' else '답 확인하기',exact=True).click()
   await page.screenshot(path=str(OUT/f'card-{language}.png'))
   await context.close()
  # Render the existing vector mark without a rounded background mask.
  page=await browser.new_page(viewport={'width':1024,'height':1024})
  svg=(ROOT/'assets/brand.svg').read_text().replace(' rx="220"','')
  await page.set_content('<body style="margin:0">'+svg+'</body>')
  await page.screenshot(path=str(ROOT/'play-store/icon-source.png'))
  image=base64.b64encode((OUT/'quiz-en.png').read_bytes()).decode()
  await page.set_viewport_size({'width':1024,'height':500})
  await page.set_content('''<body style="margin:0;background:#245C45;color:#F7F5EF;font-family:Arial,sans-serif"><div style="width:1024px;height:500px;display:flex;align-items:center;gap:60px;padding:50px 70px;box-sizing:border-box"><div style="flex:1"><div style="font-size:52px;font-weight:700;line-height:1.1">Memorize<br>All</div><div style="font-size:24px;line-height:1.4;margin-top:25px">Small discoveries.<br>Lasting memories.</div><div style="font-size:18px;margin-top:25px;color:#D6E5D5">100 facts · 5 topics</div></div><img style="height:420px;width:236px;object-fit:cover;object-position:top;border-radius:18px" src="data:image/png;base64,'''+image+'"></div></body>')
  await page.screenshot(path=str(ROOT/'play-store/feature-source.png'))
  await browser.close()
asyncio.run(main())
