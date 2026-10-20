# 독후감 확인

아이들이 낸 독후감의 책이 국립중앙도서관 [ISBN 서지정보유통지원시스템](https://www.nl.go.kr/seoji/)에 등록돼 있는지 한 번에 확인하는 웹페이지예요.

**바로 쓰기: https://moonclipse-t.github.io/ISBN/**

- 책 제목을 한 줄에 하나씩 적고 Enter. 여러 권은 Shift+Enter로 줄을 바꿔 적어요.
- 저자를 알면 제목과 한 칸 띄어 적어요. 예: `아몬드 손원평`, `어린왕자 생텍쥐페리`
- 찾은 책의 `제목(저자)` 버튼을 누르면 나이스에 넣을 글자가 그대로 복사돼요.

## 구조

| 파일 | 하는 일 |
|---|---|
| `index.html` | 화면. 깃허브 페이지에 올라가 있어요. |
| `apps-script/Code.gs` | 검색. 구글 앱스 스크립트에서 돌아가요. |

브라우저는 다른 사이트(nl.go.kr)를 직접 읽을 수 없어서, 구글 앱스 스크립트가 대신 검색해 오고 화면은 그 결과만 보여 줘요.

## 앱스 스크립트 다시 배포하기

`apps-script/Code.gs`를 고쳤을 때:

1. [script.google.com](https://script.google.com)에서 프로젝트를 열고 `Code.gs` 내용을 이 파일로 바꿔 붙여넣은 뒤 저장해요.
2. 같은 프로젝트의 `Index` 파일에는 `index.html` 내용을 붙여넣어요. 앱스 스크립트 주소로 열어도 똑같이 쓸 수 있어요.
3. **배포 → 배포 관리 → 연필 아이콘 → 새 버전 → 배포**. 주소가 그대로 유지돼야 `index.html`의 `API` 주소를 안 바꿔도 돼요.

## 출처

- 머리 사진: Carolina Prysyazhnyuk, [위키미디어 공용](https://commons.wikimedia.org/wiki/File:Card_catalogue_drawers.jpg), [CC BY-SA 2.0](https://creativecommons.org/licenses/by-sa/2.0/)
- 제목·도장 글꼴: 국립박물관문화재단 클래식체 (자유 이용·배포 가능한 무료 글꼴), 쓰는 글자만 잘라서 `index.html`에 넣었어요.
- 검색 자료: 국립중앙도서관 ISBN 서지정보
