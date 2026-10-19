# 콘텐츠 운영

첫 공개판은 지리, 원소, 달, 커피, 와인 각 20개, 총 지식 100개와 문제 200개다. 2026-10-20 전수 검수 결과와 항목별 근거는 [검수 기록](content-review.md)에 있다. 번역과 문제 변형은 별도 지식으로 세지 않는다.

`python3 scripts/build-catalog.py`로 생성하고 `npm run check:content -- --release`로 검사한다. 지리의 최신 P36 대조는 `python3 scripts/verify-geography.py`, 개별 항목 확인은 `python3 scripts/review-content.py show elements.sodium`을 사용한다.

승인은 content/reviews.json의 정확한 해시와 일치할 때만 반영한다. 사실, 문제나 번역이 바뀌면 해당 항목을 다시 검수한다. 정답 변경은 factRevision, 문장 변경은 textRevision을 올린다. 지식 ID와 저장 schema 1은 유지한다.

원천 문장, 표, 로고와 사진을 복제하지 않는다. Wikidata는 CC0 구조화 사실만 사용하며 다른 기관의 사이트 전체를 공개 라이선스로 보지 않는다. 항목별 출처와 이용 범위는 검수 근거에 기록한다.

자동 검사는 의미가 겹치는 복수 정답을 판정하지 못하므로 한영 질문과 보기의 의미 검수를 함께 수행한다. 개별 시간을 측정하지 않은 배치는 개별 검수 시간과 예상 인건비를 계산하지 않는다. 수도처럼 바뀔 수 있는 사실은 다음 출시 전에 다시 조회한다.
