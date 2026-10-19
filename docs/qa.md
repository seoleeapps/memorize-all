# 검증 기록 — 2026-10-04

이 문서는 2026-10-04의 개발 검증 기록이다. 이후 UI 수정은 [UI 검수](ui-qa.md), 2026-10-05 배너광고 전환·계정 등록·Android 빌드의 현재 상태는 [광고와 빌드](advertising.md)를 따른다. 구독 기능은 이후 제품 범위에서 제거됐다. 정식 출시 후보로 판정하지 않았다.

## 자동 검사

- `npm run check`: ESLint, TypeScript, 코어 테스트 15개, 콘텐츠 도구 테스트 3개, 콘텐츠 구조·아키텍처 검사 통과.
- `npm run format:check`: 통과.
- `npx expo-doctor`: 21/21 검사 통과.
- `npm run export:web`: 웹 번들 생성.
- `npm run export:native`: iOS/Android Hermes 번들 생성. 서명된 IPA/APK/AAB가 아니다.
- 제품 원장 schema 검사 통과. 전체 준비 상태 검사는 통과하지 않음.
- `npm run check:release`: 실패가 정상인 현재 상태. 미검수 콘텐츠와 미연결 구독/동기화, 실기기 QA, 공개 승인 등을 구체적으로 출력한다.

코어 검증에는 오답 재시도 상한, 정답 위치/질문 방향 변경, 같은 세션 재시도와 7일 지연 응답 구분, 정답 정정에 따른 평가 무효화, 번역 변경 후 진도 보존, 구독 만료 이후 기존 지식 복습, 잘못된 백업 차단과 중복 응답 방지가 포함된다. 구독 규칙 테스트는 실제 스토어 결제·복원 검증이 아니다.

## 실행 화면 및 기능

공용 Playwright의 세션 전용 탭, Chrome headless, 390×844와 320×568. 최종 Expo Router 경로를 대상으로 학습 흐름을 다시 실행했다.

- 관심 선택 → 처음 10개 → 오답 1개 → 같은 세션 재시도 1개 → 도감. 지식 10개/응답 11개로 보존되고 오래 기억함은 0개.
- 오답 해설 화면에서 새로고침 후 선택한 답과 보기 순서·해설 복구. 응답이 중복 저장되지 않음.
- 한국어→영어 전환 후 진도 보존. 플래시카드 답 확인·헷갈림 기록.
- 백업 파일 다운로드, 다른 응답 추가, 파일 가져오기, 교체 확인 후 백업 내용으로 정확히 복구.
- 페이지의 네트워크 요청을 차단한 상태에서 학습 응답/저장 성공. 다시 연결해 학습 지속. 이는 웹 콜드 스타트 오프라인 보장이 아니며, 네이티브 오프라인 앱 시작은 별도 검증 필요.
- 320px 화면, CSS 200% 글자 확대에서 가로 넘침 없음. 본문 스크롤 허용. 실제 iOS Dynamic Type/Android 글꼴 배율 검증을 대체하지 않음.
- localStorage 쓰기에 `QuotaExceededError` 주입: 기존 저장값·언어 상태 보존, 오류 표시, 재시도 성공.
- 손상 JSON 주입: 자동 초기화/덮어쓰기 없음, 읽기 오류와 재시도 표시. 원래 QA 데이터를 복구한 뒤 정상 진입.
- 브라우저 핵심 흐름 중 수집한 런타임 오류 0건.

QA에서 수정한 저장소는 `http://127.0.0.1:18765`와 `http://127.0.0.1:18766`의 `localStorage['memorize-all.state.v1']`뿐이다. 새 앱의 합성 학습 기록이며 실제 사용자 기록이 아니다. 오류 테스트는 조작 전 QA 값을 보관하고 되돌렸다. 시스템 마우스·키보드나 사람용 브라우저 프로필을 사용하지 않았다.

실행 스크립트: `scripts/qa-browser.py`, `scripts/qa-storage-errors.py`. `~/.agent/scripts/agent_browser.py --profile play-primary acquire`로 배정한 세션에 `run --session <id> --file <파일>`로 실행하고 끝나면 `release`한다. 스크립트 안의 ROOT는 현재 체크아웃의 경로다.

설계 대조: 홈에서 주요 학습 버튼이 첫 화면에 보인다. 탐색·도감·설정은 분리되어 있다. 정답과 선택한 오답이 글자로 구분되고 원소 기호는 타일로 표시한다. 빈 성장 기록은 실측값 0/미수집 안내로 표현한다. 글자 확대에서는 스크롤하여 다음 행동에 접근한다. 긴 영문 분야명이 카드에서 부자연스럽게 끊어지는 것을 확인해 제목 크기를 조정하고, 350px 미만/큰 네이티브 글꼴에서는 한 열로 표시하게 수정했다.

| 증거 | 화면 |
|---|---|
| [홈](qa-home.png) | 한국어 / 초기 실제 데이터 0개 |
| [해설](qa-feedback.png) | 선택한 오답과 정답 비교 |
| [완료](qa-complete.png) | 첫 응답과 즉시 재시도 분리 |
| [원소](qa-element.png) | 최종 원소 타일과 다음 행동 |
| [달](qa-moon.png) | 위상 모식도와 관찰 기준 |
| [탐색](qa-explore.png) | 준비된 묶음과 예정 분야 구분 |
| [큰 글자](qa-small-large-text.png) | 320px / 글자 확대 상태 |
| [읽기 오류](qa-storage-error.png) | 손상 데이터 보존 및 재시도 |

## 네이티브에서 확인하지 못한 것

iPhone 16 Pro / iOS 18.1 Simulator에 Expo Go SDK 57을 설치하고 프로젝트를 열었다. 첫 연결 시 IPv6 localhost와 IPv4 manifest 주소가 달라 서버 접속이 실패했다. `NODE_OPTIONS=--dns-result-order=ipv4first`로 개발 서버를 시작하여 프로젝트 실행과 Expo 개발 메뉴 진입을 확인했다.

이후 idb 1.1.8 터치 실행은 `SimulatorKit.framework`의 예전 `Contents/Developer/Library/PrivateFrameworks` 경로를 요구해 실패했다. 실제 프레임워크는 현재 Xcode의 `Contents/SharedFrameworks`에 있다. Xcode 파일이나 시스템 입력 설정을 수정하지 않았다. 따라서 iOS 학습 터치, VoiceOver, 실제 큰 글자, 시스템 파일 공유/선택, 독립 앱 시작 화면은 미검증이다. Android는 `adb devices`에서 연결 기기가 없었다. 실기기 QA는 남아 있다.

## 콘텐츠와 외부 의존성

- 100개 표본은 모두 candidate. 자동 구조 검사와 수도 20개 원천 대조를 전수 편집 승인으로 부르지 않는다.
- 검수 기록이 아직 없으므로 항목당 검수 비용·수정률은 null. 실제 사용자 7일 기억률/재방문/매출도 미측정.
- `npm audit`는 마지막 조회에서 high 19 / moderate 12 / critical 0을 보고했다. Expo/Metro 도구 체인 및 Router의 전이 의존성에 걸친 집계다. `braces`, `node-forge`, `uuid`, `decode-uri-component` 경로를 확인했다. 호환 가능한 자동 수정은 적용했지만 SDK를 과거 major로 내리는 `--force`는 사용하지 않았다. 경고가 남아 있어 보안 검사 통과로 보고하지 않는다.
- 실제 상품·결제 검증 서버·동기화 서버가 없어 구독/복원/만료/환불 통합 테스트를 하지 않았다.
- 원격 저장소·CI·스토어 등록·업로드·심사·배포는 없다.
