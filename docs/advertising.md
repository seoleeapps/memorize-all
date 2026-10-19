# 배너광고와 Android 빌드 — 2026-10-05

사용자가 수익모델을 배너광고만으로 변경했다. 구독 안내, 제안 가격, 유료 지식 권한과 콘텐츠의 무료/유료 구분을 제거했다. 학습 기록의 스키마·지식 ID·사실 버전은 그대로여서 기존 저장·백업을 유지한다.

## 광고 구현

- `react-native-google-mobile-ads` 17.2.0, Expo SDK 57. Expo Go는 이 SDK를 포함하지 않는다.
- 루트 레이아웃에서 배너 한 개를 유지한다. 모든 경로에 적용되며 경로 이동으로 광고를 다시 생성하지 않는다.
- 320×50 고정 배너와 구분선·간격·광고 라벨을 사용한다. 학습 버튼·탭을 덮지 않고 시스템 하단 안전 영역을 확보한다. 광고 로드 전후의 영역 높이는 같다.
- UMP 개인정보 선택을 갱신한 뒤 `canRequestAds`가 허용할 때만 SDK를 초기화하고 배너를 요청한다. 갱신 실패 시 SDK가 저장한 이전 허용 여부를 확인한다. 상태를 학습 저장 파일에 복제하지 않는다.
- 개인정보 선택이 필요한 지역에서는 설정에 변경 버튼을 제공한다. 변경 중 배너를 제거하고 변경된 허용 여부를 다시 적용한다.
- SDK 초기화·동의 확인 실패는 학습과 저장을 막지 않는다. 설정에서 다시 확인할 수 있다. 광고 재고 부족·오프라인 상태에서 임의의 가짜 광고를 표시하지 않는다.
- `AD_MODE=test`는 Google 공식 테스트 배너 ID를 사용한다. 실제 앱 ID는 동의 확인에도 쓰이므로 테스트 빌드에도 이 앱의 등록된 ID를 사용한다. `AD_MODE=live`는 실제 배너 ID를 검증하며 테스트 ID로 대체하지 않는다.
- 웹은 UI 검수용으로 SDK·배너를 불러오지 않는다. 네이티브 구현과 웹 검수 구현은 플랫폼 파일로 분리한다.

광고 요청에 학습 기록·정답·관심 분야를 전달하지 않는다. Google SDK 자체의 광고 식별자·기기 정보·진단 등의 처리는 개인정보처리방침과 스토어 데이터 보안 선언에 반영해야 한다.

## 확인한 외부 등록

- Google Play 로그인: `[private account]`. 선택된 개발자: `Seolee Apps`, 개인 계정, ID `5547060480954653351`.
- 사용자가 선택한 앱 이름: `Memorize All`. 영구 Android 패키지명과 iOS 번들명: `com.seorilabs.memorizeall`.
- Play 앱 생성 완료. 콘솔 앱 ID: `4974075050392290867`. `0.1.1 (2)` AAB 업로드·처리와 내부 테스트 출시가 완료됐다. 2026-10-05 14:15 KST 콘솔에서 활성·내부 테스터에게 제공됨·검토되지 않음을 확인했다.
- 선택된 테스터 목록은 `Memorize All owner QA`이며 `[private account]` 한 명이다. [참여 링크](https://play.google.com/apps/internaltest/4701156134419290610)를 열어 초대 화면을 확인했다. 참여 수락과 Play 설치는 수행하지 않았다.
- 내부 테스트에는 버전 코드 2만 제공한다. 이전 코드 1은 출시하지 않고 초안에서 제외했다. 공개 등록·심사가 끝나기 전에는 `com.seorilabs.memorizeall (unreviewed)` 임시 이름이 표시된다.
- AdMob 로그인: `[private account]`, 게시자 `pub-9932778305312246`. Android/iOS 앱과 플랫폼별 `all-screens-banner` 단위를 생성하고 성공 화면에서 ID를 확인했다.
- 공개 광고 ID는 `config/advertising.json`에 있다. 광고 ID는 서명 키나 API 인증정보가 아니다.
- Android AdMob 앱 개요는 `검토 필요` 상태였다. 등록·ID 발급은 실제 광고 표시·스토어 연결·앱 심사 통과의 증거가 아니다.
- Play 앱 대시보드에는 12명·14일 비공개 테스트 요구가 보이지 않았다. 초기 설정과 프로덕션 심사는 남는다. 배너광고가 테스트 면제를 만드는 것은 아니다.

## 로컬 AAB

사용자가 Expo 계정 없이 로컬 빌드를 선택했다. CNG 설정 플러그인이 생성된 Gradle 파일의 개발용 release 서명을 앱 전용 upload 서명으로 바꾼다. 생성된 `android/` 파일을 손으로 수정하지 않는다.

`app/memorize-all/google-play/upload-key`가 등록된 뒤 해당 `signing.json` 경로를 지정한다. 파일에는 `storeFile`, `storePassword`, `keyAlias`, `keyPassword`, `certificateSha256`가 있어야 한다. 비밀 파일은 저장소·앱 설정·로그에 넣지 않는다. 앱 전용 업로드 키를 생성해 카탈로그에 등록했다. 암호화 백업 후 로컬과 BeeStation 백업을 각각 임시 복원하여 검증했다. 등록된 인증서와 AAB 서명 인증서의 SHA-256이 일치해야 빌드 스크립트가 결과물을 확정한다.

```sh
MEMORIZE_ALL_ANDROID_SIGNING_FILE=<카탈로그의 signing.json 경로> npm run build:android:internal
```

내부 테스트용 AAB는 테스트 광고를 사용한다. 공개 빌드는 `build:android:production`이며 공개 출시 검사와 실제 광고 ID 검사를 먼저 통과해야 한다. 결과물은 `dist/android/`에 놓인다. 서명 확인, Play 처리, 트랙 적용, 테스터 설치와 공개 출시는 각각 따로 확인한다.

## 검증과 현재 제약

광고 동의·초기화 순서, 중복 초기화 방지, 동의 없음, 오프라인 이전 동의, 초기화 실패 후 재시도, 개인정보 선택 변경을 포함한 TypeScript 테스트 25개와 콘텐츠 파이프라인 테스트 3개가 통과했다. lint·typecheck·콘텐츠·구조 검사와 Expo Doctor 21개도 통과했다. Android/iOS Hermes·웹 번들을 생성했다.

로컬 업로드 서명 플러그인과 빌드 스크립트를 포함한 lint·typecheck·25개 코드 테스트·3개 콘텐츠 테스트·구조 검사도 통과했다. 처음 오프라인으로 시작하여 이전 동의가 없는 경우에도 광고 설정 재시도가 표시되고, 재연결하면 요청을 준비할 수 있다.

Android 네이티브 빌드·서명·Play 내부 출시가 완료됐다. 광고 SDK의 Expo 플러그인에서 공식 `androidSdk: classic` 옵션을 명시했다. SDK의 기본 Android backend 조회가 Expo 구성에서 없는 값을 읽던 문제를 공식 설정으로 해결했다. 생성 Gradle의 release 블록은 앱 전용 upload 서명을 사용한다. 밝은 테마와 배경색은 SDK 57의 `expo-system-ui` 구성 플러그인을 통해 적용한다.

최종 빌드 소스는 `29ab776577e02209c7d6a55f2d141441c3e50968`, 버전은 `0.1.1 (2)`, minSdk 24 / targetSdk 36이다. AAB SHA-256은 `2e4f34ca833cc1563c276bc10edeb5a51ae16585f75ddd2e35e219ad62c6ab7d`다. AAB 서명과 AAB에서 만든 APK 서명이 등록된 앱 업로드 인증서와 일치한다. 인증서가 자체 서명이라는 jarsigner 안내는 업로드 키의 특성이며 검증 결과는 `jar verified`다. 결과물은 `dist/android/memorize-all-internal.aab`와 `.apk`다. EAS 로그인이나 클라우드 빌드는 사용하지 않았다.

Play 미리보기에는 버전 코드 2의 가독화 파일 안내 한 건만 남았다. R8/proguard 난독화를 켜지 않은 현재 빌드에서 업로드·출시 오류는 없었다. 내부 출시 노트는 en-US 한 언어로 저장됐다. [아티팩트 기록](qa-advertising/android-artifact.json)과 [Play 조회 기록](qa-advertising/play-internal-readback.json)에 근거를 보관했다.

[Android 네이티브 검수](android-native-qa.md)에서 실제 테스트 배너, 퀴즈 선택지·해설, 카드 앞뒤·평가, 언어 전환, 종료 후 오프라인 진도 복구와 재연결 후 배너 표시를 확인했다. 작은 화면 320×568 / 글자 1.5배에서 홈 버튼이 아래로 밀리는 문제를 수정하고 같은 조건으로 재검수했다. 이 검수는 API 36 에뮬레이터의 로컬 APK 설치 기준이다.

공개 등록 정보의 정본은 `play-store/google-play.config.json`이다. 현재 등록 검사에는 정책 URL·데이터 보안·등급·대상 연령·스토어 이미지 등 공개 등록 미완료 항목 12건이 남는다. 이 검사 결과를 내부 테스트용 AAB 빌드 성공이나 공개 출시 준비 완료로 혼동하지 않는다.

실기기는 사용자의 선택에 따라 이번에 연결하지 않았다. Play 설치·실기기·TalkBack/iOS 검수, 동의 양식을 요구하는 지역의 개인정보 선택 변경과 AdMob 개인정보 메시지 설정·운영 광고 심사는 미완료다. 100개 콘텐츠 후보도 공개 승인 전이다.

16KB 기기 호환성 검사에서 64비트 라이브러리 46개의 LOAD 정렬은 통과했으나 37개의 RELRO 끝 주소가 16KB에 정렬되지 않았다. AAB의 ZIP 정렬 요청과 APK zipalign은 통과했다. 4KB 에뮬레이터 실행 성공을 16KB 호환으로 처리하지 않는다. [공식 Android 설명](https://developer.android.com/guide/practices/page-sizes#check-relro)과 [정적 검사 결과](qa-advertising/elf-check.json)를 근거로 라이브러리 갱신·재빌드와 16KB 런타임 검수를 공개 출시 전 항목으로 남긴다.

## 공식 자료

- [Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/)
- [Expo에서 광고 SDK 설치](https://docs.page/invertase/react-native-google-mobile-ads/installation/expo)
- [배너 형식](https://docs.page/invertase/react-native-google-mobile-ads/ad-formats/banner)
- [UMP 개인정보 선택](https://developers.google.com/admob/android/privacy)
- [개인 개발자 계정 테스트 요건](https://support.google.com/googleplay/android-developer/answer/14151465?hl=en)
