# 최종 후보 독립 L3 전체 회귀

후보 `399073475b094fcffc8ec7678e9eab487d44a7c4`의 개발 환경 L3 전체 회귀가 통과했다. 구현 담당 `root`와 다른 실행자 `content_review`가 전체 명령과 실제 브라우저 흐름을 다시 실행했다. 제품 코드 수정과 커밋은 하지 않았다. [이전 후보 기록](independent-20261020.json)은 원래 결과 그대로 보존했다.

계획 시각은 `2026-10-19T15:59:30.901539Z`, 실행 시작은 `2026-10-19T15:59:40.237103Z`, 완료는 `2026-10-19T16:01:25.182211Z`다. 승인 계획은 `docs/design/2026-10-20-android-public/test-plan.json`이며, 최신 중앙 정본 `37447a7ed225d957b75ceb24cc8f2331f236a0d8`을 읽었다.

| 실행 | 결과 | 근거 |
| --- | --- | --- |
| `npm run check` | lint, TypeScript, Node 테스트 25개, Python 테스트 6개, 콘텐츠와 구조 검사 통과 | `build/qa-independent/3990734/check.log` |
| `npm run check:release` | 소스 검사 통과 | `build/qa-independent/3990734/check-release.log` |
| `npm run export:web` | 웹 내보내기 통과 | `build/qa-independent/3990734/export-web.log` |
| 공용 Playwright Python으로 `scripts/test-web.py` | 전체 흐름 6개 묶음 통과, 화면 실행 오류 0개 | `build/qa-independent/3990734/web/results.json` |
| 같은 Python으로 추가 브라우저 검수 | 5개 분야별 시작과 정답, 한국어 상세 그림, 큰 글자의 마지막 분야 접근 통과 | `build/qa-independent/3990734/web/independent-extra-results.json` |

실제 실행 기능은 `onboarding`, `study`, `collection`, `settings-backup`, `advertising`, `content`다. 관심 선택과 빈 선택 차단, 빈 분야의 옛 주소 복구, 퀴즈 오답과 재시도, 10개 지식 집계, 카드 평가, 8일 뒤 복습, 도감과 출처, 한영 변경, 재시작 복원, 백업 내보내기와 복원, 취소와 잘못된 파일, 저장 실패와 재시도, 손상 데이터 보존과 복구, 실행 중 오프라인 학습을 확인했다. 광고는 아래의 순수 경계 검사 범위다.

새 Edge headless context에서 localhost의 가상 저장만 사용했다. 원본 저장이나 사용자 계정은 사용하지 않았다. 8일 뒤 시계 변경도 해당 context에만 적용했다. 이번 export의 index와 JS 번들 바이트가 서버 응답과 일치했고, 검사 뒤에도 HEAD와 제품 코드가 같은 상태임을 확인했다.

캡처 22개를 직접 보았다. 320px 작은 화면과 CSS 글자 200%, 390px 기본 화면, 768px 화면에서 학습과 탐색이 가능했다. 세로로 긴 내용은 스크롤하며 확인했고 가로 잘림을 발견하지 않았다. 원소, 달, 커피와 와인의 한국어 상세 그림도 읽을 수 있다. 이전 후보의 `Start with 1 topics`는 `Start learning`으로 수정됐고, 무선택 때 비활성, 한 개 선택 때 활성 상태도 확인했다.

광고 테스트 6개는 가상 포트를 주입한 `AdsSession` 상태 검사다. 동의 확인과 초기화 순서, 요청 금지, 실패와 재시도, 동의 변경 후 차단을 검사했다. 실제 UMP 창이나 AdMob 배너가 표시된 근거로 사용하지 않는다.

과거 AAB `0.1.1 (2)`의 정적 재검사 자료는 64비트 라이브러리 46개, 실패 0개다. [공식 RELRO 예외](https://developer.android.com/guide/practices/page-sizes#check-relro)에 맞춰 독립 LOAD와 다른 쓰기 영역의 분리를 확인하는 검사 테스트 3개도 이번 SHA에서 통과했다. 과거 AAB는 테스트 광고와 다른 소스 SHA의 산출물이므로 최종 1.0.0 빌드의 패키지, 버전, 서명, 운영 광고 ID, 정렬 검사를 대신하지 않는다.

사용자가 제외한 에뮬레이터와 실기기는 조회하거나 사용하지 않았다. 네이티브 UMP와 AdMob, OS 공유와 파일 선택, Play 설치 실행, OS 글자 크기와 접근성, 16KB 런타임은 미실행이다. 최종 후보 AAB 정적 검증도 이번 독립 실행에서는 미실행이다. 실행한 개발 환경 범위에서 남은 제품 결함은 발견하지 않았다.

명령별 실제 시작과 종료 시각, 중앙 근거에 넣을 `runs` 항목, 여섯 기능 ID와 파일별 SHA-256은 [최종 JSON](independent-20261020-final.json)에 있다. 로그와 캡처는 `build/qa-independent/3990734`에 보존했다.
