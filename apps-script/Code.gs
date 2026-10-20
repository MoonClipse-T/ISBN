// 독후감 ISBN 확인 — 구글 앱스 스크립트 웹앱
// 브라우저는 다른 사이트(nl.go.kr)를 직접 못 읽어서, 구글 서버가 대신 검색해 오는 구조.

// 제목 필드만, 한 번에 100건 (전체 검색은 최신순이라 오래된 원작이 뒤로 밀려 안 보임)
var SEARCH = 'https://www.nl.go.kr/seoji/contents/S80100000000.do?schType=simple&schFld=title&pageUnit=100&schStr=';

// ?q=책제목 으로 부르면 검색 결과 JSON (깃허브 페이지 화면이 이걸 씀), 아니면 화면 자체를 보여 줌
function doGet(e) {
  var q = e && e.parameter && e.parameter.q;
  if (q !== undefined) {
    var out;
    try { out = search(q); } catch (err) { out = { error: err.message }; }
    return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
  }
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('독후감 ISBN 확인')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

// 페이지에서 google.script.run.search(입력한 한 줄) 로 부름.
// "아몬드 손원평", "완득이 창비", "아몬드 손원평 창비", "손원평 아몬드"처럼 제목 앞뒤에 저자·출판사가
// 섞여 있어도 띄어쓰기 자리마다 [제목, 나머지]로 나눠 검색해서 제목이 딱 맞는 책을 찾음.
// 나머지(extra)는 참고용: 낱말마다 저자나 출판사에 들어 있으면 맞는 것으로 봄. 외국 저자는 표기가
// 제각각(조앤 롤링 / J.K. 롤링)이라, 나머지까지 맞는 후보가 없으면 제목만 맞는 후보를 씀.
function search(line) {
  line = String(line || '').trim().slice(0, 100);
  if (!line) return { total: 0, items: [], exact: [], title: '', extra: '', extraMatched: false };
  var cache = {}, loose = null, first = null;
  var tries = guesses_(line);
  for (var i = 0; i < tries.length; i++) {
    var title = tries[i][0], extra = tries[i][1];
    var r = cache[title] || (cache[title] = titleSearch_(title));
    var hits = r.items.filter(function (b) { return norm_(b.title) === norm_(title); });
    var both = hits.filter(function (b) { return matchesExtra_(b, extra); });
    var res = { total: r.total, items: r.items, exact: both, title: title, extra: extra, extraMatched: !!extra };
    if (both.length) return res;
    if (!loose && hits.length) loose = Object.assign(res, { exact: hits, extraMatched: false });
    if (!first && r.total) first = { total: r.total, items: r.items, exact: [], title: title, extra: '', extraMatched: false };
  }
  return loose || first || { total: 0, items: [], exact: [], title: tries[0][0], extra: '', extraMatched: false };
}

// "손원평 창비" → 손원평, 창비 각각이 저자나 출판사 안에 있어야 함. "(주식회사)창비"도 "창비"로 맞음.
function matchesExtra_(b, extra) {
  var hay = norm_(b.author + ' ' + b.publisher);
  return extra.split(/\s+/).every(function (w) { return !norm_(w) || hay.indexOf(norm_(w)) >= 0; });
}

// [제목, 나머지(저자·출판사)] 후보 목록. 입력 그대로를 제목으로 먼저 보고, 그다음 띄어쓰기 자리마다 둘로 나눠 봄.
// 긴 제목부터 봐야 "작은 아씨들 루이자 메이 올컷"이 "작은"이라는 다른 책으로 잘못 잡히지 않음.
// ponytail: 띄어쓰기 없이 붙여 쓰면 저자 이름을 3글자, 2글자로만 가정. 외국 저자는 띄어 써야 찾음.
function guesses_(line) {
  if (line.indexOf('/') >= 0) {
    var p = line.split('/');
    return [[p[0].trim(), p.slice(1).join('/').trim()]];
  }
  var out = [[line, '']];
  var words = line.split(/\s+/), n = words.length, i;
  if (n > 1) {
    for (i = n - 1; i >= 1; i--) out.push([words.slice(0, i).join(' '), words.slice(i).join(' ')]);  // 제목 저자
    for (i = 1; i < n; i++) out.push([words.slice(i).join(' '), words.slice(0, i).join(' ')]);       // 저자 제목
  } else {
    [3, 2].forEach(function (k) {
      if (line.length > k + 1) out.push([line.slice(0, -k), line.slice(-k)], [line.slice(k), line.slice(0, k)]);
    });
  }
  return out;
}

function titleSearch_(title) {
  var res = UrlFetchApp.fetch(SEARCH + encodeURIComponent(title), {
    headers: { Referer: 'https://www.nl.go.kr/seoji/' },  // 없으면 사이트가 "정상적인 경로" 알림만 줌
    muteHttpExceptions: true,
  });
  return parse_(res.getContentText('UTF-8'));
}

// "저자 : 앙투안 드 생텍쥐페리;역자 : 지연리;" → "앙투안 드 생텍쥐페리"
// "원작: 생텍쥐페리 ;글: 고지혜", "김려령 지음", "홍길동, 김철수", "홍길동 외 3명" 도 첫 사람만.
function firstAuthor_(s) {
  var a = String(s).split(';').map(function (x) { return x.trim(); }).filter(Boolean)[0] || '';
  a = a.replace(/^[^:：]{1,12}[:：]\s*/, '');   // "저자 : ", "원작: " 같은 앞말
  a = a.split(/\s*[,/·]\s*/)[0];   // "히가시노 게이고 / 양윤옥" 같은 여러 사람
  return a.replace(/\s+외(\s*\d+\s*명)?$/, '').replace(/\s+(지음|글|저|옮김|역|엮음|그림|편저|편|공저)$/, '').trim();
}

function norm_(s) {
  return String(s).replace(/[\s\p{P}\p{S}]/gu, '').toLowerCase();
}

function strip_(s) {
  return s.replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'").replace(/&amp;/g, '&').trim();
}

function parse_(page) {
  var m = page.match(/totCnt_span"\s*>([\d,]+)</);
  if (!m) throw new Error('사이트 응답을 읽지 못했어요. 사이트에서 직접 확인해 주세요.');
  var items = page.split('class="resultData"').slice(1).map(function (block) {
    var t = block.match(/<div class="tit">[\s\S]*?<\/b>\s*\d+\.\s*([\s\S]*?)<\/a>/);
    var lis = [];
    block.replace(/<li>([\s\S]*?)<\/li>/g, function (_, li) { lis.push(strip_(li)); });
    var get = function (k) {
      var l = lis.filter(function (x) { return x.indexOf(k) === 0; })[0];
      return l ? l.split(':').slice(1).join(':').trim() : '';
    };
    var title = t ? strip_(t[1]) : '', author = (lis[0] || '').replace(/;$/, '');  // 첫 줄이 저자/원작/글 등 형식이 제각각이라 통째로
    var first = firstAuthor_(author);
    return {
      title: title,
      author: author,
      neis: first ? title + '(' + first + ')' : title,  // 나이스 입력 양식: 책제목(제1저자)
      publisher: get('발행처'),
      isbn: get('ISBN').replace(/\s*\(.*\)$/, ''),
      kind: get('제본형태'),
    };
  });
  return { total: +m[1].replace(/,/g, ''), items: items };
}
