# Memorize All

성인을 위한 로컬 학습 앱. 지리, 원소, 달, 커피, 와인의 지식 100개와 문제 200개를 한국어와 영어로 배운다. 퀴즈, 플래시카드, 간격 복습, 도감, JSON 백업을 지원한다. 무료이며 하단 배너 한 개를 사용한다. 로그인, Firebase와 원격 이용 통계는 없다.

```sh
npm ci
npm run check
npm run web
```

Expo SDK 57과 Expo Router를 사용한다. core는 프레임워크 없는 학습 규칙, content는 검수된 지식, adapters는 저장과 광고 경계, ui는 화면을 맡는다. 저장 키 memorize-all.state.v1과 schema 1을 유지한다.

일반 PR과 main은 Linux 검사와 RN Web 회귀를 실행한다. v1.0.0 같은 릴리스 태그에서만 기존 앱 전용 업로드 키로 서명 AAB를 만든다. 서명 원본은 저장소 밖의 자격증명 카탈로그에 보관하며 GitHub에는 실행 사본만 둔다. 앱 비밀정보를 소스에 넣지 않는다.

[출시 설계](docs/design/2026-10-20-android-public/design.md), [콘텐츠 검수](docs/content-review.md), [현재 출시 상태](release/market-launch-state.json)를 참고한다. 웹 회귀는 실제 네이티브 광고, 공유 수신, Play 설치와 16KB 런타임의 통과 근거가 아니다. 이번 출시 작업에서는 에뮬레이터와 실기기를 사용하지 않는다.
