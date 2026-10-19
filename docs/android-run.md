# Android 실기기 실행 — 2026-10-05

이 문서는 광고 SDK 추가 전 Expo Go 실행 기록이다. 현재 버전은 네이티브 광고 SDK 때문에 Expo Go에서 실행할 수 없다. 해당 Metro 서버는 종료했고, 독립 APK·Play 내부 테스트 빌드와 최신 실행 결과는 [광고·빌드](advertising.md)와 [네이티브 검수](android-native-qa.md)를 따른다.

Seeker / Android 16 · 1200×2670에서 memorize-all 0.1.0의 한국어 관심 선택 화면을 확인했다. Expo Go 57.0.9 / 프로젝트 SDK 57로 실행했다. 별도 패키지의 출시용 앱을 빌드하거나 설치한 결과가 아니다.

## 실행 결과

- 처음에는 USB 장치는 보였으나 ADB 목록이 비어 있었다. 사용자가 연결을 다시 확인한 뒤 `device` 상태로 연결됐다.
- 기기에 Expo Go가 설치되어 있지 않아 프로젝트의 Expo CLI가 공식 SDK 57용 실행 앱을 내려받아 설치했다. 기존 앱 삭제나 데이터 초기화는 수행하지 않았다.
- USB reverse를 이용한 localhost 실행에서 ADB 서버 재시작 및 개발 서버 연결 끊김을 관찰했다. 재시작 원인은 확인하지 않았다.
- Mac과 Seeker가 같은 네트워크에 있음을 확인하고 LAN 연결로 실행했다. Metro의 Android 번들 수신과 실제 전면 화면을 확인했다.
- Expo 개발 메뉴 안내를 닫고 첫 화면을 캡처했다. 관심 분야를 선택하거나 학습 기록을 만들지는 않았다.
- 확인 시 앱 프로세스의 `AndroidRuntime:E` / `ReactNativeJS:E` 출력은 없었다. 기존 로그를 지우지 않았다.
- `npm run lint`와 `npm run typecheck` 통과. 앱 코드 변경 없음.

[실제 첫 화면](qa-android/onboarding-ready.png). 오른쪽 위 원형 도구 버튼은 Expo Go 개발 도구다.

## 다시 실행

```sh
NODE_OPTIONS=--dns-result-order=ipv4first npx expo start --android --lan --port 18082
```

같은 네트워크의 Expo Go에서 Metro가 표시한 `exp://<Mac의 현재 LAN 주소>:18082`를 연다. 실행 확인 당시 개발 서버는 기기에서 계속 사용할 수 있도록 켜 두었다. 주소는 네트워크에 따라 달라지므로 고정하지 않는다.

SDK 57의 `scheme` 미지정 경고가 있었다. 현재 Expo Go 실행은 됐으며, 정식 독립 앱 설정과 실행 검수는 별도 작업으로 남는다. 기기에서 첫 화면이 열리는 것까지 확인했으며 퀴즈/플래시카드 전 과정, 앱 종료 후 복구, 오프라인 콜드 스타트, 큰 글자·화면 읽기·파일 공유 검수를 완료한 것은 아니다.
