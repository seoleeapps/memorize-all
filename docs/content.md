# 콘텐츠 운영

현재 100개 지식은 모두 공개 전 검수 후보다. 200개 문제 변형과 번역을 별도 지식으로 세지 않는다. 20개 수도의 Wikidata P36 관계를 직접 조회했고 영어 정답 20개가 일치했다. 조회 시각·원천 revision·수도 entity ID는 `content/evidence/geography.json`에 있다. 이는 번역·이용 조건·문제 품질까지 승인했다는 뜻이 아니다.

- `python3 scripts/build-catalog.py`: 한영 100개/변형 200개를 일관된 규약으로 생성.
- `python3 scripts/verify-geography.py`: Wikidata 사실을 읽기 전용 대조. 네트워크 실패는 불일치와 구분해 error 기록.
- `npm run check:content`: 중복 ID, 없는 정답, 중복 보기, 번역 누락, 출처 누락 검사.
- `python3 scripts/review-content.py show elements.sodium`: 한 항목의 양방향 문제·한영 문장·출처를 검토.
- `python3 scripts/review-content.py record <id> --seconds <실측초> --reviewer <검수자> --source-url <항목별URL> --usage <이용조건> --fact --ko --en --unique-answer --rights`: 실제 수행한 검수만 기록. 수정한 항목이면 `--revised`.
- `python3 scripts/review-content.py report`: 검수 평균 시간·수정 비율·1,000개 예상 작업 시간. 표본이 없으면 null로 두며 0시간으로 해석하지 않는다.

원천에는 Wikidata(CC0 구조화 사실), IUPAC(원소 이름·기호), NASA(달의 사실), NCA/WSET(설명 검토 후보)을 연결했다. 기관의 문장·도표·로고·사진은 복제하지 않는다. NCA/WSET 자료 자체가 공개 라이선스라고 간주하지 않는다. 이용 조건은 검수 시 항목별로 확인한다. 커피 메뉴·와인 용어 일부는 아직 일반 페이지 연결이며 정확한 근거로 보강해야 한다.

생성기는 `content/reviews.json`의 해시와 현재 후보가 일치할 때만 승인 상태를 반영한다. 사실/문제/번역이 바뀌면 기존 검수는 다시 수행해야 한다. 사실 정답 변경은 factRevision, 문장만 변경은 textRevision을 올린다. 실행 중 세션이 구버전 정답을 가리키면 취소하고 과거 응답 이력은 보존하되 새 평가에서 제외한다.

현재 알려진 한계: 후보 데이터는 전수 의미 검수를 마치지 않았다. 자동 검사는 복수 정답의 의미적 모호함을 판정하지 못한다. 글 중심 용어 표본을 실제 비교 그림으로 보강하는 작업도 정식 콘텐츠 검수 범위다. 문화권별 달 별칭이나 관찰 방향 의존 그림은 아직 포함하지 않았다.
