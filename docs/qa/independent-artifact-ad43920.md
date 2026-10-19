# 최종 AAB 독립 정적 검수

후보 `ad439207a29b4a8d4c809ef99a0219418e6931cb`의 실제 AAB를 읽고 정적 검사를 통과했다. 실행자 `content_review`가 작성자 `root`의 `static-validation.json` 결론을 재인용하지 않고 명령을 직접 실행했다. 원본 AAB와 기존 APK set은 해시까지 보존했다.

- 계획: `2026-10-19T17:26:15.676319Z`
- 시작: `2026-10-19T17:26:15.859900Z`
- 완료: `2026-10-19T17:28:53.233198Z`
- AAB SHA-256: `fd8a520c86c5a5b23c4401dadb12637852135f5bf5317cb36cd0b00902492e14`
- 실제 파일: `LOCAL_RELEASE_EVIDENCE/artifact-signed/memorize-all-production.aab`
- raw 근거: `LOCAL_QA_CHECKOUT/build/qa-independent/artifact-ad43920`

| 항목 | 실제 확인 결과 |
|---|---|
| 패키지와 버전 | `com.seorilabs.memorizeall`, `1.0.0`, 코드 `3` |
| 디버그 | `android:debuggable` 속성이 없고 유효 기본값은 `false` |
| 운영 광고 | App ID `ca-app-pub-9932778305312246~8005768438`, 배너 `ca-app-pub-9932778305312246/1437414097`, `production`과 `live` 설정 |
| 서명 | `jarsigner` 검증 통과, 인증서 SHA-256 `4E:35:39:69:2D:9D:81:F9:AC:6C:C5:3B:3D:B4:7E:F4:88:DC:28:1F:4C:D1:6F:3D:67:FC:79:88:69:DE:E9:15` 일치 |
| 서명 내용 | AAB 엔트리 1,409개의 서명 manifest SHA-256 digest를 실제 내용과 대조해 일치 |
| 번들 | `bundletool validate` 통과, `PAGE_ALIGNMENT_16K` |
| ELF | arm64-v8a와 x86_64 총 46개 통과, 실패 0, 독립 RELRO LOAD 예외 37개 |
| APK 정렬 | 기존 `static-universal.apks`의 APK 추출본에서 `zipalign -v -c -P 16 4` 통과 |
| AAB와 APK 비교 | native `.so` 92개, app.config, JS bundle 바이트 동일. APK의 `.so` 92개는 압축되지 않았고 데이터 시작 위치가 모두 16KB 배수 |

비디버그 판정은 실제 dump manifest와 [Android의 기본값 정의](https://developer.android.com/guide/topics/manifest/application-element#debug)를 대조했다. ELF는 LOAD의 16KB alignment와 offset congruence를 검사했다. RELRO 끝이 16KB 배수가 아닌 37개는 RELRO만 포함한 독립 LOAD인지, 보호 페이지에 다른 쓰기 가능한 LOAD가 겹치지 않는지 실제 header로 확인했다. [공식 RELRO 예외](https://developer.android.com/guide/practices/page-sizes#check-relro)를 적용했다. APK 패키징은 [공식 zipalign 검사](https://developer.android.com/tools/zipalign)를 그대로 실행하고 local file header의 data offset도 별도로 계산했다. 이 결과는 정적 호환성 범위다.

배너 ID는 AAB의 `base/assets/app.config`에 있으며 `Constants.expoConfig.extra.advertising.androidBannerId`에서 읽는 구조다. 최초 독립 검사 helper가 Hermes JS에도 ID 전체 문자열이 있어야 한다고 가정해 실패했다. 실패 script와 로그를 보존한 뒤 실제 구조에 맞춰 helper만 수정했다. 포함된 운영 설정, JS의 설정 접근 속성명, 같은 SHA의 광고 소비 코드를 확인했다. 제품 파일이나 산출물은 바꾸지 않았다.

`jarsigner`의 자체 서명 인증서, CA 신뢰 경로 부재, timestamp 부재와 POSIX 속성 비보호 경고를 보존했다. 암호학적 서명 검증은 통과했고 실제 서명 지문은 기대한 업로드 인증서와 같다. 개인 키나 자격증명 파일을 읽지 않았으며 키, APK 서명과 debug keystore를 만들지 않았다. `keytool`은 기존 JDK와 `-cacerts`로 실행해 정상 종료했다.

네이티브 런타임은 **미실행**이다. 기기, 에뮬레이터, adb, 앱 실행, 광고 요청, 실제 동의 화면과 배너 표시, 16KB 런타임 검수는 수행하지 않았다. 업로드, 심사, 승인과 공개 상태도 이 검수에서 확인하지 않았다. 코드, 커밋, push, PR과 콘솔은 변경하지 않았다.

[전체 JSON](independent-artifact-ad43920.json)에 명령별 실제 시각, 결과, 경고, 실패 helper와 최종 통과 근거, raw 파일 해시를 기록했다.

공개 사본의 로컬 경로는 `LOCAL_RELEASE_EVIDENCE`, `LOCAL_QA_CHECKOUT`, `LOCAL_USER_HOME`으로 치환했다. 원래 보고서와 명령은 해시를 대조한 비공개 보관본에 유지했다.
