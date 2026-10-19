# 의존성 검사

2026-10-20 Expo SDK 57 권장 패치를 적용하고 expo-doctor 21개 검사를 통과했다. `npm audit`은 31개 경고를 보고한다. 중복 전파를 제외한 원천 권고는 braces, decode-uri-component, node-forge, uuid 네 개다. npm이 제시한 Expo 44, React Native 0.72 등의 하향 변경은 현재 SDK와 호환되지 않아 적용하지 않았다.

- braces: 빌드 도구의 glob 패턴 처리. 제어된 저장소 입력만 사용한다. 공개된 패치 버전 없음.
- node-forge: Expo 서명 인증서 도구의 RSA 검증. 앱 학습 런타임에서 사용하지 않는다. 공개된 패치 버전 없음.
- uuid: Xcode 설정 도구가 사용하는 버전. Android 학습 런타임에서 버퍼를 전달하는 v3, v5, v6 경로를 사용하지 않는다.
- decode-uri-component: Expo Router의 query-string 의존성. 잘못된 퍼센트 인코딩에 대한 처리 시간 문제가 보고되었고 0.5.0에서 수정됐다. Expo가 지원하는 의존성 범위 밖의 강제 교체는 적용하지 않았다. 스토어 공개 전 잔여 위험으로 기록한다.

출처: https://github.com/advisories/GHSA-vfj7-8cjw-p6xm , https://github.com/advisories/GHSA-vcc3-ghjq-m6fr , https://github.com/advisories/GHSA-86w9-cpqp-85rv , https://github.com/advisories/GHSA-w5hq-g745-h8pq
