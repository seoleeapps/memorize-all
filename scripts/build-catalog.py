"""Build deterministic bilingual candidate cards. Sources are linked, not copied.
Editorial promotion is separate: changing this script never approves a candidate.
"""
import hashlib, json
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
def bi(ko,en): return {'ko':ko,'en':en}
names = [('geography','지리','Geography','◎'),('elements','원소','Elements','Na'),('moon','달','The Moon','◐'),('coffee','커피','Coffee','☕'),('wine','와인','Wine','◇')]
catalog = {'version':'2026.10.20.1','categories':[{'id':id,'title':bi(ko,en),'mark':mark} for id,ko,en,mark in names], 'knowledge':[], 'questions':[]}

def add_group(category, rows, source, source_label, usage):
    data=[r.split('|') for r in rows.strip().splitlines()]
    assert len(data)==20, (category,len(data))
    for i,row in enumerate(data):
        key,ko,en,answer_ko,answer_en,*extra=row
        id=f'{category}.{key}'
        url=extra[0] if extra else source
        if category=='geography':
            title=bi(f'{ko}의 수도',f'Capital of {en}')
            explanation=bi(f'{ko}의 수도는 {answer_ko}입니다.',f'{answer_en} is the capital of {en}.')
            prompt=bi(f'{ko}의 수도는 어디일까요?',f'What is the capital of {en}?')
            reverse=bi(f'수도가 {answer_ko}인 나라는?',f'Which country has {answer_en} as its capital?')
        elif category=='elements':
            title=bi(f'{ko} ({answer_en})',f'{en} ({answer_en})')
            explanation=bi(f'{ko}의 원소 기호는 {answer_en}입니다. 대문자와 소문자를 구별해요.',f'The chemical symbol for {en.lower()} is {answer_en}. Letter case matters.')
            prompt=bi(f'{ko}의 원소 기호는?',f'What is the chemical symbol for {en.lower()}?')
            reverse=bi(f'원소 기호 {answer_en}에 해당하는 원소는?',f'Which element has the symbol {answer_en}?')
        else:
            title=bi(ko,en); explanation=bi(answer_ko,answer_en)
            prompt=bi(f'“{ko}”의 뜻으로 가장 알맞은 것은?',f'Which definition best matches “{en}”?')
            reverse=bi(f'{answer_ko}\n이 뜻을 가장 잘 나타내는 용어는?',f'{answer_en}\nWhich term best matches this definition?')
        catalog['knowledge'].append({'id':id,'category':category,'pack':f'{category}.intro','factRevision':1,'textRevision':1,'title':title,'explanation':explanation,'source':{'url':url,'label':source_label,'checkedAt':None,'usage':usage},'review':'candidate'})
        if category=='elements': catalog['knowledge'][-1]['visual']={'kind':'element','symbol':answer_en,'atomicNumber':i+1}
        if category=='moon' and i<8: catalog['knowledge'][-1]['visual']={'kind':'moonPhase','phase':i}
        # Do not test a broad concept against one of its subtypes or tools.
        overlaps = {
            'coffee.bean': {'coffee.green'},
            'coffee.extraction': {'coffee.espresso', 'coffee.filter', 'coffee.immersion', 'coffee.french-press', 'coffee.cold-brew'},
            'coffee.immersion': {'coffee.french-press', 'coffee.cold-brew'},
            'coffee.espresso': {'coffee.filter', 'coffee.extraction'},
            'moon.maria': {'moon.crater'},
        }
        excluded = overlaps.get(id, set())
        choices = [i]
        for offset in [1, 7, 13, *range(2, 20)]:
            idx = (i + offset) % 20
            if idx not in choices and f'{category}.{data[idx][0]}' not in excluded:
                choices.append(idx)
            if len(choices) == 4:
                break
        for direction,p in [('forward',prompt),('reverse',reverse)]:
            options=[]
            for idx in choices:
                r=data[idx]
                text=bi(r[3],r[4]) if direction=='forward' else bi(r[1],r[2])
                options.append({'id':f'{category}.{r[0]}','text':text})
            catalog['questions'].append({'id':f'{id}.{direction}','knowledgeId':id,'prompt':p,'options':options,'answerId':id})

add_group('geography','''france|프랑스|France|파리|Paris|https://www.wikidata.org/wiki/Q142
japan|일본|Japan|도쿄|Tokyo|https://www.wikidata.org/wiki/Q17
canada|캐나다|Canada|오타와|Ottawa|https://www.wikidata.org/wiki/Q16
australia|오스트레일리아|Australia|캔버라|Canberra|https://www.wikidata.org/wiki/Q408
brazil|브라질|Brazil|브라질리아|Brasília|https://www.wikidata.org/wiki/Q155
egypt|이집트|Egypt|카이로|Cairo|https://www.wikidata.org/wiki/Q79
italy|이탈리아|Italy|로마|Rome|https://www.wikidata.org/wiki/Q38
spain|스페인|Spain|마드리드|Madrid|https://www.wikidata.org/wiki/Q29
portugal|포르투갈|Portugal|리스본|Lisbon|https://www.wikidata.org/wiki/Q45
germany|독일|Germany|베를린|Berlin|https://www.wikidata.org/wiki/Q183
norway|노르웨이|Norway|오슬로|Oslo|https://www.wikidata.org/wiki/Q20
sweden|스웨덴|Sweden|스톡홀름|Stockholm|https://www.wikidata.org/wiki/Q34
finland|핀란드|Finland|헬싱키|Helsinki|https://www.wikidata.org/wiki/Q33
greece|그리스|Greece|아테네|Athens|https://www.wikidata.org/wiki/Q41
kenya|케냐|Kenya|나이로비|Nairobi|https://www.wikidata.org/wiki/Q114
thailand|태국|Thailand|방콕|Bangkok|https://www.wikidata.org/wiki/Q869
vietnam|베트남|Vietnam|하노이|Hanoi|https://www.wikidata.org/wiki/Q881
argentina|아르헨티나|Argentina|부에노스아이레스|Buenos Aires|https://www.wikidata.org/wiki/Q414
peru|페루|Peru|리마|Lima|https://www.wikidata.org/wiki/Q419
new-zealand|뉴질랜드|New Zealand|웰링턴|Wellington|https://www.wikidata.org/wiki/Q664''','', 'Wikidata · P36', 'CC0 structured facts; original wording')
add_group('elements','''hydrogen|수소|Hydrogen|H|H
helium|헬륨|Helium|He|He
lithium|리튬|Lithium|Li|Li
beryllium|베릴륨|Beryllium|Be|Be
boron|붕소|Boron|B|B
carbon|탄소|Carbon|C|C
nitrogen|질소|Nitrogen|N|N
oxygen|산소|Oxygen|O|O
fluorine|플루오린|Fluorine|F|F
neon|네온|Neon|Ne|Ne
sodium|나트륨|Sodium|Na|Na
magnesium|마그네슘|Magnesium|Mg|Mg
aluminium|알루미늄|Aluminium|Al|Al
silicon|규소|Silicon|Si|Si
phosphorus|인|Phosphorus|P|P
sulfur|황|Sulfur|S|S
chlorine|염소|Chlorine|Cl|Cl
argon|아르곤|Argon|Ar|Ar
potassium|칼륨|Potassium|K|K
calcium|칼슘|Calcium|Ca|Ca''','https://iupac.org/what-we-do/periodic-table-of-elements/','IUPAC · Periodic table','Factual names and symbols; no table artwork reproduced')
add_group('moon','''new|삭|New Moon|달의 밤인 면이 지구를 향하는 위상|The phase with the Moon's night side facing Earth.
waxing-crescent|초승달|Waxing crescent|밝은 부분이 커지는 중이며 절반보다 작은 달|An increasing lit fraction smaller than half.
first-quarter|상현달|First quarter|삭 이후 달이 처음 반달 모양으로 보이는 위상|The first half-lit phase after new Moon.
waxing-gibbous|차오르는 볼록달|Waxing gibbous|밝은 부분이 커지는 중이며 절반보다 큰 달|An increasing lit fraction larger than half.
full|보름달|Full Moon|지구를 향한 면이 거의 전부 밝게 보이는 위상|The phase with the Earth-facing side almost fully lit.
waning-gibbous|기우는 볼록달|Waning gibbous|밝은 부분이 줄어드는 중이며 절반보다 큰 달|A decreasing lit fraction larger than half.
last-quarter|하현달|Last quarter|보름달 이후 달이 반달 모양으로 보이는 위상|The half-lit phase after full Moon.
waning-crescent|그믐달|Waning crescent|밝은 부분이 줄어드는 중이며 절반보다 작은 달|A decreasing lit fraction smaller than half.
cycle|위상 주기|Phase cycle|삭에서 다음 삭까지 약 29.5일|About 29.5 days from one new Moon to the next.
reflected|달빛|Moonlight|달 표면에서 반사된 태양빛|Sunlight reflected by the lunar surface.
near|달의 앞면|Near side|지구 쪽을 향하는 달의 면|The lunar hemisphere that faces Earth.|https://science.nasa.gov/moon/facts/
far|달의 뒷면|Far side|지구 반대쪽을 향하며 햇빛도 받는 달의 면|The hemisphere facing away from Earth; it also receives sunlight.|https://science.nasa.gov/moon/facts/
synchronous|동주기 자전|Synchronous rotation|자전 주기와 공전 주기가 같아 같은 면을 향하는 회전|Rotation matching the orbital period, keeping the same side facing the partner.|https://science.nasa.gov/moon/facts/
maria|달의 바다|Lunar maria|옛 용암이 굳어 형성된 어두운 평원|Dark plains formed by ancient lava.|https://science.nasa.gov/moon/facts/
crater|충돌구|Impact crater|천체의 충돌로 생긴 표면의 움푹한 지형|A depression left by an impact.|https://science.nasa.gov/moon/facts/
regolith|달의 표토|Lunar regolith|달 표면을 덮은 부서진 암석과 먼지층|Broken rock and dust covering the Moon.|https://science.nasa.gov/moon/facts/
lunar-eclipse|월식|Lunar eclipse|달이 지구의 그림자를 지나는 현상|The Moon passing through Earth's shadow.|https://science.nasa.gov/moon/eclipses/
solar-eclipse|일식|Solar eclipse|달이 지구에서 보는 태양을 가리는 현상|The Moon blocking the Sun as seen from Earth.|https://science.nasa.gov/moon/eclipses/
spring-tide|사리|Spring tide|삭과 보름 무렵 조차가 크게 나타나는 때|Larger tidal ranges around new and full Moon.|https://science.nasa.gov/moon/tides/
neap-tide|조금|Neap tide|상현과 하현 무렵 조차가 작게 나타나는 때|Smaller tidal ranges around the quarter moons.|https://science.nasa.gov/moon/tides/''','https://science.nasa.gov/moon/moon-phases/','NASA Science · Moon','Facts in original wording; no NASA media or logos')
add_group('coffee','''arabica|아라비카|Arabica|커피나무 종 Coffea arabica를 부르는 이름|The coffee species Coffea arabica.
robusta|로부스타|Robusta|Coffea canephora 종의 커피를 흔히 부르는 이름|The common name for coffee of the species Coffea canephora.
cherry|커피 체리|Coffee cherry|커피 씨앗을 감싸고 있는 열매|The fruit surrounding coffee seeds.
bean|커피 원두|Coffee bean|커피 열매 안의 씨앗|A seed from a coffee fruit.
green|생두|Green coffee|아직 볶지 않은 커피 씨앗|Coffee seeds before roasting.
roasting|로스팅|Roasting|열을 가해 생두의 맛과 향을 발달시키는 과정|Heating green coffee to develop flavour and aroma.
grinding|분쇄|Grinding|볶은 원두를 작은 입자로 부수는 과정|Breaking roasted beans into smaller particles.
extraction|추출|Extraction|물로 커피의 녹는 성분을 끌어내는 과정|Dissolving soluble coffee compounds in water.
espresso|에스프레소|Espresso|압력을 가한 뜨거운 물로 곱게 간 커피를 통과시켜 내리는 방식|Brewing finely ground coffee with hot water under pressure.
filter|필터 커피|Filter coffee|물을 커피 가루와 필터에 통과시켜 내리는 커피|Coffee made by passing water through grounds held in a filter.
immersion|침지 추출|Immersion brewing|커피 가루를 물에 담가 두어 추출하는 방식|Brewing by steeping coffee grounds in water.
french-press|프렌치 프레스|French press|담가 우린 커피 가루를 누름망으로 분리하는 기구|A brewer with a plunger filter that separates steeped grounds.
cold-brew|콜드 브루|Cold brew|차갑거나 상온인 물로 오랜 시간 추출하는 방식|A long extraction using cold or room-temperature water.
americano|아메리카노|Americano|에스프레소에 물을 더한 음료|Espresso diluted with water.
latte|카페 라테|Caffè latte|에스프레소에 스팀 밀크를 넉넉히 더하고 얇은 거품을 얹은 음료|Espresso with plenty of steamed milk and a thin topping of foam.
cappuccino|카푸치노|Cappuccino|에스프레소에 스팀 밀크와 라테보다 두꺼운 우유 거품층을 더한 음료|Espresso with steamed milk and a thicker foam layer than a latte.
decaf|디카페인|Decaffeinated coffee|카페인의 대부분을 제거한 커피로 완전한 무카페인을 뜻하지 않음|Coffee with most caffeine removed, not necessarily zero caffeine.
natural|내추럴 가공|Natural processing|커피 열매를 통째로 말리는 가공 방식|Processing in which the whole coffee fruit is dried.
washed|워시드 가공|Washed processing|건조 전에 과육과 점액질을 제거하는 가공 방식|Processing that removes fruit flesh and mucilage before drying.
blend|블렌드|Blend|서로 다른 커피를 섞은 것|A mixture of different coffees.''','https://www.aboutcoffee.org/','National Coffee Association · About Coffee','Source identification pending item-level review; original candidate wording')
add_group('wine','''fermentation|알코올 발효|Alcoholic fermentation|효모가 당을 알코올과 이산화탄소로 바꾸는 과정|Yeast converting sugar into alcohol and carbon dioxide.
vintage|빈티지|Vintage|와인용 포도를 수확한 해|The year the grapes were harvested.
variety|포도 품종|Grape variety|샤르도네나 메를로처럼 포도를 구분하는 재배 품종|A cultivated type of grape, such as Chardonnay or Merlot.
blend|블렌딩|Blending|다른 와인이나 포도 품종의 와인을 섞는 과정|Combining wines, including wines from different grape varieties.
tannin|타닌|Tannin|입안을 마르게 하는 떫은 감각에 관여하는 성분|Compounds contributing to a drying, astringent sensation.
acidity|산도|Acidity|와인의 신맛과 관련된 산의 특성|The acidic character associated with tartness in wine.
body|바디|Body|입안에서 느껴지는 와인의 무게감|The perceived weight of wine in the mouth.
dry|드라이|Dry|단맛이 없거나 거의 느껴지지 않는 스타일|A style with little or no perceptible sweetness.
residual-sugar|잔당|Residual sugar|발효 후 와인에 남아 있는 당|Sugar remaining in wine after fermentation.
still|스틸 와인|Still wine|스파클링 와인과 달리 뚜렷한 발포가 없는 와인|Wine without the noticeable effervescence of sparkling wine.
sparkling|스파클링 와인|Sparkling wine|용해된 이산화탄소가 기포를 만드는 와인|Wine with bubbles produced by dissolved carbon dioxide.
fortified|주정 강화 와인|Fortified wine|알코올 도수를 높이기 위해 증류주를 더한 와인|Wine to which spirit has been added to increase alcohol content.
rose|로제|Rosé|분홍색 계열을 띠는 와인|A wine with a pink range of colours.
red|레드 와인|Red wine|일반적으로 검은 포도의 껍질과 함께 발효해 색을 얻는 와인|Wine generally gaining colour by fermenting with dark grape skins.
white|화이트 와인|White wine|보통 껍질과 분리한 포도즙으로 발효하는 밝은 색 와인|Light-coloured wine usually fermented from juice separated from skins.
lees|리스|Lees|발효 뒤 가라앉는 효모 등의 침전물|Sediment including yeast cells that settles after fermentation.
oak|오크 숙성|Oak ageing|참나무 용기에서 와인을 숙성하는 과정|Maturing wine in oak containers.
malolactic|젖산 발효|Malolactic conversion|사과산을 젖산으로 바꾸는 과정|The conversion of malic acid into lactic acid.
decanting|디캔팅|Decanting|병의 와인을 다른 용기로 옮겨 담는 작업|Pouring wine from its bottle into another vessel.
appellation|원산지 명칭|Appellation|포도의 지리적 원산지를 나타내는 규정된 명칭|A regulated designation identifying the geographical origin of the grapes.''','https://www.wsetglobal.com/knowledge-centre/','Wine & Spirit Education Trust','Source identification pending item-level review; original candidate wording')
coffee_sources = {
 'arabica':'beans/varieties/', 'robusta':'beans/varieties/',
 'cherry':'origins/what-is-coffee/', 'bean':'origins/what-is-coffee/',
 'green':'beans/roasts/', 'roasting':'beans/roasts/',
 'grinding':'brewing/espresso/', 'espresso':'brewing/espresso/',
 'filter':'brewing/drip-coffee/', 'immersion':'brewing/french-press-coffee/',
 'french-press':'brewing/french-press-coffee/', 'cold-brew':'brewing/cold-brew-coffee/',
 'decaf':'beans/decaf-coffee/', 'natural':'beans/processes/', 'washed':'beans/processes/',
 'blend':'beans/varieties/',
}
wine_styles = 'https://www.wsetglobal.com/knowledge-centre/blog/2023/october/03/how-many-wine-types-and-styles-are-there'
wine_sources = {
    'fermentation': 'https://www.wsetglobal.com/media/13167/wset_l2wines_specification_en_may2023_issue2.pdf',
    'vintage': 'https://www.wsetglobal.com/knowledge-centre/videos/3-minute-wine-school',
    'variety': 'https://www.wsetglobal.com/knowledge-centre/blog/2024/why-do-we-blend-wine/',
    'blend': 'https://www.wsetglobal.com/knowledge-centre/blog/2024/why-do-we-blend-wine/',
    'tannin': 'https://www.wsetglobal.com/knowledge-centre/blog/2021/december/14/what-is-wine',
    'acidity': 'https://www.wsetglobal.com/knowledge-centre/blog/2026/understanding-acidity-in-wine/',
    'body': wine_styles,
    'dry': wine_styles,
    'residual-sugar': 'https://www.wsetglobal.com/knowledge-centre/blog/2021/december/14/what-is-wine',
    'still': wine_styles, 'sparkling': wine_styles, 'fortified': wine_styles, 'rose': wine_styles,
    'red': 'https://www.wsetglobal.com/knowledge-centre/blog/2021/september/23/what-determines-the-colour-of-wine',
    'white': 'https://www.wsetglobal.com/knowledge-centre/blog/2021/september/23/what-determines-the-colour-of-wine',
    'lees': 'https://www.awri.com.au/industry_support/winemaking_resources/winemaking-practices/winemaking-treatment-lees-contact/',
    'oak': wine_styles,
    'malolactic': 'https://www.wsetglobal.com/knowledge-centre/blog/2026/understanding-acidity-in-wine/',
    'decanting': 'https://www.wsetglobal.com/knowledge-centre/blog/2024/july/21/frequently-asked-questions-about-serving-and-decanting-wine/',
    'appellation': 'https://www.ttb.gov/regulated-commodities/beverage-alcohol/wine/appellations-of-origin',
}
for k in catalog['knowledge']:
    category, key = k['id'].split('.')
    # Korean question grammar, definition prompts and overlapping distractors were revised.
    k['textRevision'] = 2
    if category == 'coffee':
        k['source']['usage'] = 'Independently written factual definitions; linked source is copyrighted; no source text, images or logos reproduced'
        if key in coffee_sources:
            k['source']['url'] = 'https://www.aboutcoffee.org/' + coffee_sources[key]
        if key == 'extraction':
            k['source'].update(url='https://sca.coffee/sca-news/coffee-decoded-15-coffee-concentrates', label='Specialty Coffee Association')
        if key in ['americano', 'latte', 'cappuccino']:
            urls = {
                'americano': 'https://www.starbucksathome.com/gb/recipes/caffe-americano',
                'latte': 'https://www.nespresso.com/ie/en/articles/cappuccino-vs-latte',
                'cappuccino': 'https://www.starbucksathome.com/gb/recipes/cappuccino',
            }
            k['source'].update(url=urls[key], label='Nespresso' if key == 'latte' else 'Starbucks Coffee at Home')
    if category == 'wine':
        k['source']['url'] = wine_sources[key]
        k['source']['usage'] = 'Independently written factual definition; linked source is copyrighted; no source text, images or logos reproduced'
        if key == 'lees':
            k['source']['label'] = 'Australian Wine Research Institute'
        if key == 'appellation':
            k['source'].update(label='Alcohol and Tobacco Tax and Trade Bureau', usage='Factual geographical-origin terminology; no label artwork reproduced')
    if category == 'elements':
        k['source']['url'] = 'https://iupac.org/wp-content/uploads/2022/07/IUPAC_Periodic_Table-04May22_CRA.pdf'
    if category == 'moon' and key == 'synchronous':
        k['source']['url'] = 'https://science.nasa.gov/moon/moon-phases/#overview-from-space'
    if category == 'geography':
        evidence_path = ROOT/'content/evidence/geography.json'
        if evidence_path.exists():
            evidence = json.loads(evidence_path.read_text())
            if any(r['knowledgeId'] == k['id'] and r['match'] for r in evidence['results']):
                k['source']['checkedAt'] = evidence['observedAt'][:10]
reviews_path = ROOT/'content/reviews.json'
reviews = json.loads(reviews_path.read_text()) if reviews_path.exists() else {}
for k in catalog['knowledge']:
    record = reviews.get(k['id'])
    questions = [q for q in catalog['questions'] if q['knowledgeId'] == k['id']]
    payload = json.dumps({'knowledge': {key:k.get(key) for key in ['id','factRevision','textRevision','title','explanation','visual']}, 'questions': questions}, ensure_ascii=False, sort_keys=True).encode()
    if record and record['sha256'] == hashlib.sha256(payload).hexdigest():
        k['review'] = 'approved'
        k['source'].update(url=record['sourceUrl'], usage=record['usage'], checkedAt=record['checkedAt'][:10])
(ROOT/'src/content/catalog.json').write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+'\n')
print(f"{len(catalog['knowledge'])} knowledge / {len(catalog['questions'])} variants; {sum(k['review'] == 'approved' for k in catalog['knowledge'])} approved")
