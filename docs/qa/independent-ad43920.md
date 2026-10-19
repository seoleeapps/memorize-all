# 독립 L3 개발 환경 전체 회귀

후보 `ad439207a29b4a8d4c809ef99a0219418e6931cb`에서 전체 여섯 기능을 새로 실행해 통과했다. 구현자 `root`와 다른 실행자 `content_review`가 새 Edge headless context와 합성 데이터만 사용했다. 제품 코드, 커밋, push와 마켓 상태는 변경하지 않았다.

- 계획: `2026-10-19T16:42:48.287548Z`
- 시작: `2026-10-19T16:42:48.343302Z`
- 완료: `2026-10-19T16:44:24.653426Z`
- 환경: `dev`, `http://127.0.0.1:18767`
- 기능: `onboarding`, `study`, `collection`, `settings-backup`, `advertising`, `content`
- 승인 계획: `docs/design/2026-10-20-android-public/test-plan.json`
- 중앙 정본 SHA: `37447a7ed225d957b75ceb24cc8f2331f236a0d8`

작성자 identity만 정정된 새 커밋의 tree SHA는 `d1a8b1f2fd4d72ec874b4c725d241b7ba36e6d47`이며 `f542483`과 같다. 같은 파일이라는 이유로 이전 근거의 source SHA를 바꾸지 않았다. 기존 raw 80개와 보고서 2개의 해시가 그대로임을 확인했다. 이번 실행은 별도 폴더 `build/qa-independent/ad43920`에 기록했다.

| 실행 | 결과 | 근거 |
|---|---|---|
| `npm run check` | lint와 TypeScript, Node 28개, Python 7개, 지식 100개와 문제 200개, 구조와 canonical 재생성 비교 통과 | `build/qa-independent/ad43920/check.log` |
| `npm run check:release` | 소스 출시 검사 통과 | `build/qa-independent/ad43920/check-release.log` |
| `npm run export:web` | 통과 | `build/qa-independent/ad43920/export-web.log` |
| `QA_URL=http://127.0.0.1:18767 $PLAYWRIGHT_PYTHON scripts/test-web.py` | 7개 시나리오군 통과 | `build/qa-independent/ad43920/web/results.json` |
| 기존 추가 분야와 화면 script | 7개 시나리오군 통과 | `build/qa-independent/ad43920/web/independent-extra-results.json` |
| 기존 과거 관심 호환 script | 3개 시나리오군 통과 | `build/qa-independent/ad43920/legacy-browser-results.json` |
| 실제 옛 선택지 parser와 browser script | 원본 parser 허용, 현행 복구와 새 학습 통과 | `build/qa-independent/ad43920/old-options-parse-results.json`, `build/qa-independent/ad43920/old-options-browser-results.json` |

모든 실행은 첫 시도에 통과했다. 이전 검수 script의 시나리오와 assertion은 유지하고 출력 폴더 경로만 바꿨다. 관심 선택, 다섯 분야 팩, 퀴즈 오답과 재시도, 고유 지식 10개, 카드, 8일 뒤 복습, 한영 전환, 재시작 복원, 도감과 출처, 백업 내보내기와 가져오기, 취소, 잘못된 파일, 저장 실패와 재시도, 손상 데이터 복구, 오프라인 학습을 실행했다. 브라우저 runtime error는 모두 0이다.

과거 분야 11개는 Node 검사에서 각각 확인했다. 브라우저에서는 과거 분야만 선택된 상태가 지식 10개를 현행 5개 분야에서 학습하고 완료 저장까지 진행했다. 혼합 관심의 유효 세션은 진도, 시도, 완료, 한국어, 카드 선호와 정답 피드백을 보존했다. 알 수 없는 ID, 과거 ID 중복, 현행 ID 중복, 손상 cursor와 잘못된 JSON은 기존 저장과 입력 파일을 바꾸지 않고 거부했다.

실제 0.1.1의 `moon.maria.forward` 선택지를 넣은 합성 세션은 원본 parser에서 전체 상태 그대로 유효했다. 현행 앱에서는 맞지 않는 세션만 비우고 과거 관심만 제거했다. 진도 10개, 시도 11개, 완료 1개, 영어와 퀴즈 선호는 유지했다. 새 10개 세션은 현재 선택지를 썼고 첫 정답 후 시도 12개, 다음 문제 cursor 1까지 진행했다. 두 합성 입력 파일도 바뀌지 않았다. 원본 두 커밋의 catalog, learning parser, storage loader와 16개 분야 목록 동일성을 다시 대조했다. 지식 100개 ID와 factRevision, 문제 200개 ID와 knowledgeId는 같고 문제 10개의 오답 선택지 집합만 달라진 것도 재확인했다.

새 캡처 28개를 직접 확인했다. 320px와 CSS 글자 200%, 390px, 768px에서 내용과 주요 동작을 읽고 스크롤로 도달할 수 있었다. CSS 확대는 Android OS 글자 확대 검수가 아니다. preview index와 bundle도 새 `dist/web`와 바이트가 같았다. bundle SHA-256은 `e2ce2062497644f70193161c087a96d5e6e4d10d9313163bb9e3d80268c9a0cf`이다.

광고 6개 검사는 대체 port를 쓴 순수 `AdsSession` 상태 검사다. 실제 UMP와 AdMob 배너 실행은 미실행이다. RELRO 관련 Python 검사 3개도 검사기 단위 검증이며 최종 AAB 통과를 뜻하지 않는다. 사용자 지시에 따라 네이티브 SDK, 기기와 에뮬레이터, Android 공유와 파일 선택기, OS 글자 확대와 접근성, Play 설치 실행, 16KB 실행, 이 SHA의 최종 AAB는 미실행으로 남겼다. 빌드, 업로드, 심사, 승인, 공개와 실제 배너 표시는 별도 상태다.

[전체 JSON](independent-ad43920.json)에 명령별 실제 시각과 결과, 파일 SHA-256, 미실행 범위를 기록했다. 공개 보고서의 Python 실행기 경로만 `$PLAYWRIGHT_PYTHON`으로 치환했고 raw 로그는 원래 경로로 보존했다. 이전 `f542483` 근거와 실제 사용자 파일은 변경하지 않았다.
