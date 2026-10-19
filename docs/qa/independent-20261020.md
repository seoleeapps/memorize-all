# 독립 L3 전체 회귀

후보 `c6d3019ad285986a2f3b41b86d05f7f449f8b7c1`의 개발 환경 전체 회귀가 통과했다. 실행자는 구현 담당 `root`와 다른 `content_review`다. 제품 코드 수정과 커밋은 하지 않았다. 새 후보에서 단수 문구 수정과 마켓 메타데이터 정정이 예정되어 있으며, 이 결과는 현재 후보에만 해당한다.

계획 시각과 실행 시작은 2026-10-19 15:55:19 UTC, 완료는 15:58:20 UTC다. 계획은 `docs/design/2026-10-20-android-public/test-plan.json`의 L3, 개발 환경, 기반 기능 재실행과 하한 조정을 따른다. 최신 중앙 정본 `37447a7ed225d957b75ceb24cc8f2331f236a0d8`을 읽었다.

| 확인 | 결과 | 근거 |
| --- | --- | --- |
| `npm run check` | 통과, lint와 TypeScript, Node 25개, Python 6개, 콘텐츠와 구조 검사 | `build/qa-independent/c6d3019/check.log` |
| `npm run check:release` | 소스 검사 통과 | `build/qa-independent/c6d3019/check-release.log` |
| `npm run export:web` | 749개 모듈과 웹 번들 생성 | `build/qa-independent/c6d3019/export-web.log` |
| 공용 Python으로 `scripts/test-web.py` | 전체 흐름 6개 묶음 통과, 화면 실행 오류 0개 | `build/qa-independent/c6d3019/web/results.json` |
| 추가 브라우저 검수 | 5개 분야별 시작과 첫 정답, 320px 한국어 상세 그림, 큰 글자의 다섯째 분야 접근 통과 | `build/qa-independent/c6d3019/web/independent-extra-results.json` |

관심 선택과 빈 선택 차단, 빈 분야의 옛 주소 복구, 퀴즈 오답과 1회 재시도, 10개 지식 집계, 카드 자가 평가, 8일 뒤 복습, 도감과 출처 상세, 한영 변경, 재시작 시 응답과 보기 순서 복원, 백업 내보내기와 복원, 취소와 잘못된 파일, 저장 실패와 재시도, 손상 데이터 보존과 복구, 실행 중 오프라인 학습을 확인했다. 새 Edge headless context와 localhost의 가상 저장만 사용했다. 8일 뒤 시계 변경도 해당 context에만 적용했다.

캡처 21개를 직접 보았다. 320px 화면과 CSS 글자 200%에서 가로 잘림 없이 학습 버튼에 도달했고, 768px 화면도 확인했다. 화면보다 긴 내용은 스크롤하며 확인했다. 이는 네이티브 OS 글자 크기나 접근성 검수가 아니다. 서버가 제공한 index와 번들의 바이트도 이번 내보내기 결과와 일치했다. 상세 파일 경로와 SHA-256은 [JSON 기록](independent-20261020.json)에 있다.

관찰된 경미한 문구 문제는 영문 첫 화면에서 분야 한 개를 고르면 `Start with 1 topics`로 표시되는 것이다. 선택과 학습 시작은 동작한다. 부모 작업에 전달했으며 이 후보의 관찰 사실을 보존한다.

광고 6개 검사는 `tests/ads-session.test.ts`에서 가상 포트를 사용한 순수 상태 검사다. 동의 전 요청 금지, 초기화 순서와 중복 호출, 동의 및 초기화 실패, 재시도, 동의 변경 뒤 요청 차단을 확인했다. 실제 UMP 창, 네이티브 AdMob 초기화와 배너 표시는 실행하지 않았다.

과거 AAB `0.1.1 (2)`, 해시 `2e4f34ca833cc1563c276bc10edeb5a51ae16585f75ddd2e35e219ad62c6ab7d`의 재검사 근거는 64비트 라이브러리 46개, 실패 0개다. [Android 공식 RELRO 예외](https://developer.android.com/guide/practices/page-sizes#check-relro)를 확인했고, 독립 LOAD의 RELRO와 다른 쓰기 영역의 분리, 공유 쓰기 영역, LOAD 정렬과 RELRO 부재를 다루는 테스트 3개가 통과했다. 이 AAB는 과거 SHA의 테스트 광고 빌드이므로 최종 1.0.0 AAB의 검증을 대신하지 않는다.

사용자가 제외한 에뮬레이터와 실기기는 조회하거나 사용하지 않았다. 네이티브 광고, OS 공유와 파일 선택, Play 설치 실행, OS 글자 크기와 접근성, 16KB 런타임은 미실행이다. 최종 서명 AAB의 패키지, 버전, 서명, 운영 광고 ID와 정렬 검사도 이번 실행에서 미실행이며 별도 근거가 필요하다.
