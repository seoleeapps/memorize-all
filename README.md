# memorize-all

호기심 많은 성인을 위한 **지식 수집·복습 앱**. React Native + Expo 57 / Expo Router / TypeScript.
Android·iOS를 대상으로 개발하며, 브라우저는 빠른 기능 검수용으로 지원한다.

현재 상태는 **100개 지식으로 학습 흐름을 검증하는 개발 버전**이다. 수익모델은 배너광고만이며, 현재 공개 출시판은 아니다.

## 실행

Node.js 22.13 이상.

```sh
npm ci
npm start
# 웹 검수
npm run web
# 네이티브 개발 빌드 — 광고 SDK는 Expo Go에서 실행되지 않음
npm run android
npm run ios
# 앱 전용 서명 파일을 지정한 뒤 내부 테스트용 AAB 생성
MEMORIZE_ALL_ANDROID_SIGNING_FILE=<카탈로그의 signing.json 경로> npm run build:android:internal
```

공개 이름은 `Memorize All`, Android/iOS 식별자는 `com.seorilabs.memorizeall`이다. 광고 SDK는 전용 네이티브 빌드가 필요하다. 사용자 선택에 따라 EAS 계정 없이 로컬 Android 빌드를 사용한다.

## 구현된 흐름

- 가입 없이 관심 분야 최대 3개 선택 → 오늘의 최대 10개 학습.
- 한영 전환, 진행 중 퀴즈/플래시카드 전환, 카드 앞면·답 공개·자기 평가 후 다음 카드.
- 정답 해설·출처, 원소 타일·달 위상·나라와 수도 관계·커피 열매 단면·발효 흐름.
- 마친 묶음 다시 연습. 지연 복습 정답률과 별도로 기록.
- 틀리거나 헷갈린 항목은 같은 학습에서 한 번 재시도하고 다음 날부터 간격 복습.
- 보기 순서와 질문 방향 변경. 첫 응답/재시도/7일 이상 지연 복습 기록 분리.
- 오늘·탐색·도감·설정. 16개 분야를 표시하되 학습 가능한 것은 5개 분야 × 20개.
- 기기 저장, 중단 후 재개, JSON 백업 내보내기/검증/확인 후 복원.
- 저장 실패 시 진도를 앞서 표시하지 않음. 손상된 데이터는 자동 초기화하지 않음.
- 사실 정정 시 기존 평가 분리, 문구 수정은 진도 유지.
- 결제·유료 제한 없는 전체 학습. 네이티브 모든 화면에 공통 하단 배너 한 개.
- 광고 개인정보 선택 확인 → SDK 초기화 → 광고 요청. 설정에서 필요한 지역의 개인정보 선택 변경.

## 구조

| 위치 | 책임 |
|---|---|
| `src/core` | SDK 없는 복습·평가·백업 규칙 |
| `src/app` | Expo Router 경로 및 최상위 상태 공급 |
| `src/ui` | 화면, 접근성 라벨, 저장 상태 연결 |
| `src/adapters` | AsyncStorage, 시스템 파일 선택/공유, 광고 동의·초기화 |
| `src/content/catalog.json` | 버전 있는 한영 지식·문제·출처 |
| `scripts` / `content` | 후보 변환, Wikidata 대조, 검수 기록/시간 집계 |
| `release` | 출시 전 미확인 항목과 근거 |

Google AdMob 배너 SDK를 연결했다. 학습 기록은 기기에 저장하며 광고 SDK에 전달하지 않는다. Google은 광고 제공을 위해 광고 식별자·기기 정보 등을 처리할 수 있다. 서버·원격 학습 분석은 연결하지 않았다. 출처를 열거나 백업을 공유할 때는 사용자가 선택한 외부 앱을 이용한다.

## 검사

```sh
npm run check            # lint + TypeScript + core tests + content + architecture
npx expo-doctor
npm run export:web      # dist/web
npm run export:native   # dist/native — JS/Hermes 번들, APK/IPA가 아님
python3 scripts/serve-preview.py  # http://127.0.0.1:18766
npm run check:release   # 지금은 의도적으로 실패: 공개 조건 미충족
```

[광고·Android 빌드 설정](docs/advertising.md), [이전 Expo Go 실기기 실행](docs/android-run.md), [UI 수정 검증](docs/ui-qa.md), [화면 기준](docs/ui-design.md), [초기 검증 기록](docs/qa.md), [제품 기준](docs/product.md), [콘텐츠 검수 절차](docs/content.md).

## 아직 제공하지 않는 범위

계정/다기기 동기화, 원격 콘텐츠 배포, 1,000개 공개 카탈로그는 미구현이다. 결제·구독은 제품 범위에서 제거했다. 100개 표본은 전수 사실·한영·이용 조건 검수를 마칠 때까지 `candidate`다.

실사용자의 7일 기억률·재방문·광고 수익은 아직 측정하지 않았다. 콘텐츠 검수 시간도 전수 검수를 실제 수행하며 기록해야 한다. 값이 없을 때 0으로 표시하지 않는다.

Android `0.1.1 (2)`를 로컬에서 서명 빌드하고 Google Play 내부 테스트에 출시했다. [Android 네이티브 검수](docs/android-native-qa.md)에서 에뮬레이터의 테스트 배너·퀴즈·카드·진도 복구·작은 화면·큰 글자를 확인했다. 콘텐츠 승인, 실기기 Play 설치, 지역별 광고 동의·화면 읽기·iOS 검수, 16KB 라이브러리 호환성 수정, 정책 설정과 공개 출시 승인이 남아 있다. 원격 Git 저장소가 없어 PR·CI는 실행하지 않았다. 빌드·업로드의 현재 상태는 [광고·Android 빌드 문서](docs/advertising.md)를 따른다.
