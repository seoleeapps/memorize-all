# 독립 L3 개발 환경 전체 회귀

후보 `f542483e6f84827f0b5ca05e350e8848aefd845b`에서 여섯 기능 전체 회귀를 통과했다. 구현자 `root`와 다른 실행자 `content_review`가 합성 데이터와 새 Edge headless context만 사용했다. 저장 호환 결함 수정 후 회귀이며 재설계 추가 회차가 아니다. 제품 코드, 커밋, push와 마켓 상태는 변경하지 않았다.

- 계획: `2026-10-19T16:32:44.653017Z`
- 시작: `2026-10-19T16:32:56.040352Z`
- 첫 전체 회귀 완료: `2026-10-19T16:38:06.561726Z`
- 추가 사례 포함 최종 완료: `2026-10-19T16:39:43.343933Z`
- 환경: `dev`, `http://127.0.0.1:18767`
- 기능: `onboarding`, `study`, `collection`, `settings-backup`, `advertising`, `content`
- 승인 계획: `docs/design/2026-10-20-android-public/test-plan.json`
- 중앙 정본 SHA: `37447a7ed225d957b75ceb24cc8f2331f236a0d8`

| 실행 | 결과 | 근거 |
|---|---|---|
| `npm run check` | 통과, lint와 TypeScript, Node 28개, Python 7개, 지식 100개와 문제 200개, 구조와 canonical 재생성 비교 | `build/qa-independent/f542483/check.log` |
| `npm run check:release` | 소스 출시 검사 통과 | `build/qa-independent/f542483/check-release.log` |
| `npm run export:web` | 통과 | `build/qa-independent/f542483/export-web.log` |
| `QA_URL=http://127.0.0.1:18767 $PLAYWRIGHT_PYTHON scripts/test-web.py` | 7개 시나리오군 통과, runtime error 0 | `build/qa-independent/f542483/web/results.json` |
| 추가 분야와 화면 실행 | 7개 시나리오군 통과, runtime error 0 | `build/qa-independent/f542483/web/independent-extra-results.json` |
| 추가 과거 저장 호환 실행 | 3개 시나리오군 통과, runtime error 0 | `build/qa-independent/f542483/legacy-browser-results.json` |

관심 선택, 퀴즈 오답과 한 번 재시도, 고유 지식 10개, 카드 자가 평가, 8일 뒤 복습, 한국어와 영어 전환, 진행 세션 재시작 복원, 도감과 출처, 백업 내보내기와 가져오기, 취소, 저장 실패와 재시도, 손상 저장 복구, 오프라인 학습을 실행했다. 각 분야 팩도 새 context에서 시작해 첫 정답까지 확인했다.

캡처 26개를 직접 확인했다. 320px와 CSS 글자 200%에서 스크롤로 선택지와 동작에 도달했고, 390px와 768px에서도 내용과 주요 동작을 읽을 수 있었다. CSS 글자 확대를 Android 글자 설정 검수로 기록하지 않았다. 근거 목록과 각 파일 SHA-256은 [JSON](independent-f542483.json)에 있다.

## 과거 저장 호환

0.1.1 fixture의 16개 분야 가운데 제거된 11개 ID를 Node 회귀에서 각각 확인했다. 과거 유효 파서에서 허용된 상태를 현행 파서로 읽을 때 관심 목록만 정규화하고 나머지 기록과 원본 문자열을 보존했다. 알 수 없는 ID와 중복 ID는 계속 거부했다.

브라우저에서는 온보딩이 끝났고 과거 분야만 선택된 초기 상태를 불러왔다. 읽기만으로 원본 저장을 덮어쓰지 않았고, 학습을 시작하면 관심 목록이 빈 배열로 정규화됐다. 현행 5개 분야의 고유 지식 10개를 풀고 컬렉션으로 이동해 시도 10개와 완료 1개 저장을 확인했다.

과거 분야와 현행 분야가 섞인 합성 백업은 정답 피드백이 있는 진행 세션, 진도, 시도, 완료, 한국어, 카드 학습 선호를 보존했다. 파일 내보내기, 가져오기, 재시작 뒤 모든 필드를 비교했으며 진행 중 퀴즈 모드도 유지됐다. 입력 파일 바이트도 변하지 않았다. 알 수 없는 ID, 과거 ID 중복, 현행 ID 중복, 손상 세션 cursor, 잘못된 JSON의 다섯 가져오기는 저장 기록과 입력 파일을 바꾸지 않고 거부했다.

수정 전 red 로그 `docs/qa/legacy-backup/red.log`의 2개 실패는 보존했다. 추가 브라우저 첫 시도 역시 실패 로그를 보존했다. 이 검수 스크립트는 완료 화면에서 `See my collection`을 누르기 전에 완료 기록을 요구했다. 제품의 기존 `finish()` 호출 시점에 맞춰 검수 스크립트만 고친 후 새 context에서 재실행해 통과했다. 근거는 `build/qa-independent/f542483/legacy-browser-attempt1.*`와 `build/qa-independent/f542483/legacy-browser.json`이다.

원본 저장소의 `29ab776577e02209c7d6a55f2d141441c3e50968`과 fixture 출처 `9cbeb20dbf011cac768a4901fbc6bff862947bcd`에서 `git show`로 추출한 catalog, learning parser, storage loader는 파일 바이트와 SHA-256이 각각 같았다. fixture의 분야 목록도 같은 16개 항목이다. 이 확인은 세 파일과 목록 범위이며 전체 소스나 네이티브 실행의 동일성 주장은 아니다. 근거는 `build/qa-independent/f542483/legacy-provenance.json`이다.

## 광고와 미실행 범위

광고 6개 검사는 대체 port를 쓴 순수 `AdsSession` 상태 검사다. 동의 전 초기화 방지, 요청 불허, 이전 동의, 오프라인 재시도, 초기화 실패 복구, 동의 변경 후 요청 차단을 확인했다. 실제 UMP나 AdMob 배너 실행 근거로 사용하지 않는다. Android 정적 검사기의 RELRO 관련 Python 검사 3개도 통과했으나 최종 AAB 검사를 대신하지 않는다.

사용자 지시에 따라 기기와 에뮬레이터는 조회하거나 실행하지 않았다. 네이티브 SDK, Android 공유와 파일 선택기, OS 글자 확대와 접근성, Play 설치 실행, 16KB 실행, 이 SHA의 최종 서명 AAB는 미실행이다. 빌드, 업로드, 심사, 승인, 공개와 실제 배너 표시는 별도 상태로 남는다.

preview의 index와 JS bundle은 새 `dist/web`와 바이트까지 같았다. bundle SHA-256은 `e2ce2062497644f70193161c087a96d5e6e4d10d9313163bb9e3d80268c9a0cf`이다. 원본 로그는 `build/qa-independent/f542483`에 보존했고 공개 JSON의 Python 실행기 경로만 `$PLAYWRIGHT_PYTHON`으로 치환했다. 이전 후보의 검수 근거와 실제 사용자 파일은 건드리지 않았다.

## 실제 옛 선택지가 남은 세션 추가 검수

추가 계획 `2026-10-19T16:38:33.667856Z`, 실행 시작 `2026-10-19T16:39:08.957653Z`, 완료 `2026-10-19T16:39:43.343933Z`. 첫 회귀 완료 근거는 `build/qa-independent/f542483/pre-option-session/`에 보존했다.

원본 0.1.1과 현재 catalog의 지식 100개 ID와 factRevision, 문제 200개 ID와 knowledgeId는 같았다. 정답 유일성 검수 과정에서 문제 10개의 오답 선택지 ID 집합은 바뀌었다. 이 경우 현재 문제에 없는 선택지를 담은 진행 세션은 기존 reconcile 규칙에 따라 비우는 것이 기대 동작이다.

실제 0.1.1의 `moon.maria.forward` 선택지를 넣은 합성 파일을 원본 커밋에서 추출한 parser와 catalog로 읽어 전체 상태가 그대로 유효함을 확인했다. 현재 parser와 브라우저에서는 이 세션만 비우고 과거 관심 `history`만 제거했다. 진도 10개, 시도 11개, 완료 1개, 영어와 퀴즈 선호는 유지했다. 읽기만으로 원본 저장을 덮어쓰지 않았으며 정규화한 백업도 기대 상태와 일치했다. 새 학습은 현재 선택지로 10개 세션을 만들었고 첫 정답 후 시도 12개, 다음 문제 cursor 1까지 진행했다. 합성 입력 파일 두 경로 모두 바이트가 변하지 않았다.

추가 실행과 화면 2개도 통과했고 runtime error는 0이었다. 직접 본 캡처는 합계 28개다. 근거는 `build/qa-independent/f542483/old-options-parse-results.json`, `build/qa-independent/f542483/old-options-browser-results.json`, `build/qa-independent/f542483/old-catalog-diff.json`과 `build/qa-independent/f542483/old-options-visual-inspection.json`이다. 제품 코드와 후보 SHA는 그대로다.
