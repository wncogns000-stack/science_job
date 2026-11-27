/**
 * 미래 직업 박람회 2045를 구글 Apps Script 웹 앱으로 여는 코드
 * 1) script.google.com 에서 새 프로젝트를 만든다.
 * 2) 이 파일 내용을 Code.gs 에 붙여 넣는다.
 * 3) 파일 추가 > HTML 에서 이름을 index 로 만들고, dist/mirae-jobs-expo.html 의 내용을 통째로 붙여 넣는다.
 * 4) 배포 > 새 배포 > 유형: 웹 앱, 실행: 나, 액세스: 모든 사용자 로 배포하고 나온 주소를 학생에게 안내한다.
 * 학생 기록은 학생 기기의 브라우저에만 저장되고, 이 스크립트는 아무것도 저장하지 않는다.
 */
function doGet() {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('미래 직업 박람회 2045')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}
