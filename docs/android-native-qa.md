# Android 내부 테스트와 네이티브 검수 — 2026-10-05

`Memorize All / com.seorilabs.memorizeall`의 로컬 서명 AAB `0.1.1 (2)`를 Play 내부 테스트에 출시했다. 콘솔의 **활성 / 내부 테스터에게 제공됨 / 검토되지 않음** 상태를 읽었다. 이 결과는 공개 출시나 Play 설치 검수 완료를 뜻하지 않는다.

## 빌드와 내부 배포

| 항목 | 확인 결과 |
| --- | --- |
| 소스 | `29ab776577e02209c7d6a55f2d141441c3e50968` |
| 버전·SDK | `0.1.1 (2)`, minSdk 24 / targetSdk 36 |
| 빌드 | Java 21, Android SDK, Expo CNG, Gradle 로컬 release AAB |
| 서명 | 앱 전용 업로드 키, jarsigner 검증 및 등록 인증서 비교 통과 |
| 실행 APK | bundletool 1.18.3으로 해당 AAB에서 추출, apksigner 검증 통과 |
| 광고 모드 | 포함된 앱 설정 `test`, 실제 Google 테스트 배너 표시 |
| Play | Seolee Apps 개인 계정 `5547060480954653351`, 앱 ID `4974075050392290867` |
| 내부 트랙 | `4701156134419290610`, 버전 코드 **2만** 활성 |
| 테스터 | `Memorize All owner QA`, `[private account]` 한 명 |
| 공개 상태 | 미심사·미출시, 임시 이름 `com.seorilabs.memorizeall (unreviewed)` |

[내부 테스트 참여](https://play.google.com/apps/internaltest/4701156134419290610). 초대 화면까지 읽었으며 대신 참여 수락하거나 실제 기기에 설치하지 않았다. 콘솔 반영 후 다운로드가 제공되기까지 시간이 걸릴 수 있다.

[AAB·APK 해시와 서명 근거](qa-advertising/android-artifact.json), [내부 출시 조회 근거](qa-advertising/play-internal-readback.json). 이전 `0.1.0 (1)`은 업로드 처리만 확인한 뒤 출시 초안에서 제외했다. 해당 파일·서명 기록은 버전별로 보관한다.

## 실제 실행 검사

사용자 실기기 없이 진행한다는 선택에 따라 전용 `MemorizeAll_QA_API36` Android 16 / API 36 ARM64 에뮬레이터에 로컬 APK를 설치했다. 기본 화면은 1080×2400 / dpi 420이며 메모리 페이지는 **4096바이트**다. 기존 사용자 기기의 데이터는 초기화하지 않았다. 아래 기록은 전용 에뮬레이터의 합성 학습 기록이다.

| 흐름 | 관찰 결과·근거 |
| --- | --- |
| 퀴즈 | [선택지 4개](qa-advertising/android-v2-quiz.png), 정답 후 [해설·원소 도식·다음 버튼](qa-advertising/android-v2-feedback.png) 확인 |
| 플래시카드 | 같은 미응답 문제에서 방식 전환 → [앞면](qa-advertising/android-v2-card-front.png) → [답·도식·평가 3개](qa-advertising/android-v2-card-back.png) → 평가 후 다음 항목 확인 |
| 언어·진도 | 영어 리튬 카드 4/12에서 한국어로 변경해 [동일 항목·진도 유지](qa-advertising/android-v2-korean-resumed.png) |
| 오프라인 복구 | 비행기 모드 → 강제 종료 → 콜드 스타트 → 이어서 학습. [한국어 리튬 4/12 복원](qa-advertising/android-v2-offline-restored.png), 답 공개와 평가도 오프라인 저장 성공 |
| 광고 재연결 | 오프라인에서 배너 로드 실패가 학습을 막지 않음. 네트워크 복구 후 [실제 테스트 배너 재표시](qa-advertising/android-v2-reconnected.png) |
| 전 화면 배너 | [오늘](qa-advertising/android-v2-today.png), [탐색](qa-advertising/android-v2-explore.png), [도감](qa-advertising/android-v2-collection.png), [설정](qa-advertising/android-v2-settings.png), 위 학습 화면에서 확인. 첫 관심 선택 화면의 배너는 이전 동일 구현 빌드에서 확인 |
| 작은 화면·큰 글자 | 320×568 논리 크기 / 글자 1.5배. [이전 홈 버튼 밀림](qa-advertising/android-small-large-text-before.png)을 수정하여 [첫 화면 버튼 표시](qa-advertising/android-small-large-text.png) 확인. 손가락 스크롤 후 [카드 평가 3개](qa-advertising/android-small-card-grades.png)가 광고와 겹치지 않음 |
| 업데이트 | `adb install -r`로 버전 1→2 업데이트 후 학습 2개·진행 위치 유지. 이후 추가 학습으로 5개 수집 |
| 오류 로그 | 오프라인 재시작 후 현재 앱 PID의 AndroidRuntime:E / ReactNativeJS:E 출력 없음. [조회 기록](qa-advertising/android-v2-error-log.txt) |

카드의 답을 공개한 상태 자체는 저장하지 않는다. 강제 종료 후에는 동일 미응답 카드의 앞면을 다시 보여 주며, 이미 저장한 평가·진도는 보존한다. 테스트 광고를 클릭하거나 운영 광고 수익을 발생시키지 않았다. 테스트를 마친 뒤 화면 크기와 글자 크기를 기본값으로 복구했다.

## 남은 검사

- 실기기의 Play 설치와 배너·터치·백업 파일 선택/공유. 사용자가 기기 없이 빌드부터 선택하여 이번에는 수행하지 않았다.
- TalkBack·VoiceOver, iOS 네이티브 실행. UI 라벨 조회를 화면 읽기 앱의 검수로 처리하지 않는다.
- 동의 양식을 요구하는 지역의 UMP 선택 변경, 최초 오프라인·이전 동의 없음의 실제 SDK 복구, AdMob 개인정보 메시지와 운영 광고 승인. 동의 상태 로직의 단위 테스트는 통과했으나 지역별 양식은 미검수다.
- 16KB 페이지 기기 호환성. AAB ZIP 요청 `PAGE_ALIGNMENT_16K`, APK `zipalign -c -P 16 4`는 통과했다. 64비트 `.so` 46개 모두 LOAD 정렬은 통과했지만 **37개 RELRO 끝 주소가 16KB 미정렬**이다. [정적 결과](qa-advertising/elf-check.json), [공식 검사 기준](https://developer.android.com/guide/practices/page-sizes#check-relro). 관련 네이티브 라이브러리를 갱신·재빌드하고 `getconf PAGE_SIZE = 16384`인 환경에서 실행해야 한다. 16KB 환경은 이번에 실행하지 않았다.
- 콘텐츠 100개 전수 검수, 스토어 이미지·정책·데이터 보안·등급·대상 연령, 공개 출시 승인. 테스트 광고 모드 빌드는 공개 출시 후보로 사용하지 않는다.

lint·typecheck·TypeScript 테스트 25개·콘텐츠 도구 테스트 3개·콘텐츠/구조 검사·Expo Doctor 21개를 통과했다. 공개 등록 검사는 미완료 정책·이미지 등으로 막힌 상태를 유지한다. 원격 저장소가 없어 PR·원격 CI는 실행하지 않았다.
