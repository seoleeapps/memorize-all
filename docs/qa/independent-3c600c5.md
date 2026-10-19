# 후보 3c600c5 독립 L3 전체 회귀

후보 `3c600c50f2a63a96976671f6bbcc47963f4ac304`의 개발 환경 L3 전체 회귀가 통과했다. 실행자는 구현 담당 `root`와 다른 `content_review`다. 앞선 두 후보의 근거는 보존했고, 이번 후보에서 전체 명령과 브라우저 흐름을 새로 실행했다. 제품 코드를 수정하거나 커밋하지 않았다.

계획 시각은 `2026-10-19T16:11:23.762741Z`, 실행 시작은 `2026-10-19T16:11:34.082077Z`, 완료는 `2026-10-19T16:13:13.412260Z`다. 승인 계획은 `docs/design/2026-10-20-android-public/test-plan.json`이다. 중앙 정본 원격 SHA가 `37447a7ed225d957b75ceb24cc8f2331f236a0d8`로 같은 것도 다시 확인했다.

| 실행 | 결과 | 근거 |
| --- | --- | --- |
| `npm run check` | lint와 TypeScript, Node 25개와 Python 7개, 콘텐츠와 구조 검사, 생성 콘텐츠 대조 통과 | `build/qa-independent/3c600c5/check.log` |
| `npm run check:release` | 출시 소스 검사 통과 | `build/qa-independent/3c600c5/check-release.log` |
| `npm run export:web` | 웹 내보내기 통과 | `build/qa-independent/3c600c5/export-web.log` |
| 공용 Python으로 `scripts/test-web.py` | 전체 흐름 6개 묶음 통과, 화면 실행 오류 0개 | `build/qa-independent/3c600c5/web/results.json` |
| 공용 Python으로 추가 브라우저 검수 | 5개 분야별 시작과 정답, 320px 한국어 상세 그림과 큰 글자의 마지막 분야 접근 통과 | `build/qa-independent/3c600c5/web/independent-extra-results.json` |

새 콘텐츠 대조 검사는 원본 생성 규칙과 승인 기록에서 임시 폴더에 다시 만든 결과가 현재 catalog와 바이트 단위로 같음을 확인했다. 추가 테스트는 검수 뒤 catalog를 변조하면 거부하고, 그 검사 과정이 파일을 덮어쓰지 않는 것도 확인했다. 지식 100개와 문제 200개에서 미승인 후보는 0개다.

확인한 기능 ID는 `onboarding`, `study`, `collection`, `settings-backup`, `advertising`, `content`다. 새 브라우저 context에서 관심 선택, 빈 선택 차단과 옛 빈 분야 주소 복구, 퀴즈와 오답 재시도, 카드 평가, 8일 뒤 복습, 도감과 출처, 한영 변경, 재시작 복원, 백업 내보내기와 복원, 취소와 잘못된 파일, 저장 실패와 재시도, 손상 데이터 보존과 복구, 실행 중 오프라인 학습을 실행했다. localhost의 가상 저장만 사용했고 사용자 계정이나 원본 저장을 사용하지 않았다.

이번 실행의 캡처 22개를 직접 보았다. 320px과 CSS 글자 200%, 390px 기본 화면, 768px 화면에서 읽기와 조작이 가능했고 가로 잘림을 발견하지 않았다. 세로로 긴 내용은 스크롤로 확인했다. 다섯 분야의 정답 화면과 원소, 달, 커피, 와인의 한국어 상세 그림도 확인했다. 서버가 제공한 index와 번들 바이트는 이번 export와 일치한다.

광고 테스트 6개는 `tests/ads-session.test.ts`의 가상 포트를 사용한 순수 경계 검사다. 동의 확인과 SDK 초기화 순서, 요청 금지, 실패와 재시도, 동의 변경 뒤 차단을 확인했다. 실제 UMP 창과 AdMob 배너 표시 검수가 아니다. 네이티브 SDK, 기기 조회와 실행, OS 공유와 파일 선택, Play 설치 실행, 네이티브 글자 크기와 접근성, 16KB 런타임은 미실행이다.

과거 AAB의 정적 재검사 46개 라이브러리와 실패 0개, 공식 RELRO 예외를 다루는 검사 테스트 3개의 근거는 JSON에 별도로 보존했다. 과거 AAB는 다른 SHA의 테스트 광고 빌드다. 최종 1.0.0 AAB의 패키지, 버전, 서명, 운영 광고 ID와 정렬 검증, Linux 릴리스 빌드, 코드 교차 리뷰 2회차와 마켓 상태는 이번 실행의 통과에 포함하지 않는다.

`release/market-launch-state.json`과 기존 QA 및 `release/evidence`의 미커밋 문서는 작성자 작업으로 보존했다. 이 문서들을 후보 SHA에 포함된 소스나 네이티브 및 공개 완료 근거로 취급하지 않았다. 검사 전후에 고정 SHA와 제품 코드가 같은 것도 확인했다. 실행한 개발 환경 범위에서 남은 제품 결함은 발견하지 않았다.

명령별 실제 시각, 중앙 검증 입력에 사용할 `runs`, 여섯 기능 ID, 로그와 캡처별 SHA-256은 [JSON 기록](independent-3c600c5.json)에 있다. 실행 산출물은 `build/qa-independent/3c600c5`에 보존했다.
