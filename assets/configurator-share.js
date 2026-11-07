/*
 * Configuration sharing for the configurator: a compact `cfg` URL parameter that
 * restores a configuration, link copying, and optional KakaoTalk sharing.
 *
 * KakaoTalk sharing appears only when this script's `data-kakao-key` holds the
 * Kakao app's JavaScript key (a public key; register the site domain under the
 * app's Web platform). Empty leaves only "copy link". The Kakao SDK is loaded on
 * the first share click, not on page load.
 */
(function () {
  var script = document.currentScript;
  var kakaoKey = (script && script.getAttribute('data-kakao-key') || '').trim();
  var KAKAO_SDK = 'https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js';
  var kakaoIntegrity = (script && script.getAttribute('data-kakao-integrity') || '').trim();
  var MAX_PARAM = 4000;

  function toBase64Url(text) {
    var bytes = new TextEncoder().encode(text);
    var binary = '';
    bytes.forEach(function (byte) { binary += String.fromCharCode(byte); });
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  function fromBase64Url(text) {
    var binary = atob(text.replace(/-/g, '+').replace(/_/g, '/'));
    var bytes = new Uint8Array(binary.length);
    for (var i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }

  var isId = function (value) { return typeof value === 'string' && /^[A-Za-z0-9_-]{1,64}$/.test(value); };

  // { m: model, s: selections that differ from the model defaults, o: instrument options, a: accessories, f: finish colour text }
  function encode(state) {
    return toBase64Url(JSON.stringify({ v: 1, m: state.m, s: state.s || {}, o: state.o || [], a: state.a || [], f: state.f || '' }));
  }

  // Shape check only; the configurator still validates every id against its catalog.
  function decode(param) {
    if (typeof param !== 'string' || !param || param.length > MAX_PARAM) return null;
    try {
      var data = JSON.parse(fromBase64Url(param));
      if (!data || data.v !== 1 || !isId(data.m)) return null;
      var selections = {};
      if (data.s && typeof data.s === 'object' && !Array.isArray(data.s)) {
        Object.keys(data.s).forEach(function (key) { if (isId(key) && isId(data.s[key])) selections[key] = data.s[key]; });
      }
      var ids = function (list) { return Array.isArray(list) ? list.filter(isId).slice(0, 50) : []; };
      return { m: data.m, s: selections, o: ids(data.o), a: ids(data.a), f: typeof data.f === 'string' ? data.f.slice(0, 80) : '' };
    } catch (error) {
      return null;
    }
  }

  function copy(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).then(function () { return true; }, function () { return fallbackCopy(text); });
    }
    return Promise.resolve(fallbackCopy(text));
  }

  function fallbackCopy(text) {
    var area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (error) { ok = false; }
    area.remove();
    return ok;
  }

  var kakaoLoading = null;
  function loadKakao() {
    if (!kakaoKey) return Promise.reject(new Error('Kakao key not configured'));
    if (kakaoLoading) return kakaoLoading;
    kakaoLoading = new Promise(function (resolve, reject) {
      if (window.Kakao) return resolve(window.Kakao);
      var tag = document.createElement('script');
      tag.src = KAKAO_SDK;
      if (kakaoIntegrity) { tag.integrity = kakaoIntegrity; tag.crossOrigin = 'anonymous'; }
      tag.onload = function () { window.Kakao ? resolve(window.Kakao) : reject(new Error('Kakao SDK missing')); };
      tag.onerror = function () { reject(new Error('Kakao SDK failed to load')); };
      document.head.appendChild(tag);
    }).then(function (Kakao) {
      if (!Kakao.isInitialized()) Kakao.init(kakaoKey);
      return Kakao;
    });
    kakaoLoading.catch(function () { kakaoLoading = null; });
    return kakaoLoading;
  }

  // KakaoTalk text template: text is limited to 200 characters.
  function shareKakao(options) {
    return loadKakao().then(function (Kakao) {
      Kakao.Share.sendDefault({
        objectType: 'text',
        text: String(options.text || '').slice(0, 200),
        link: { webUrl: options.url, mobileWebUrl: options.url },
        buttonTitle: options.buttonTitle || '구성 보기'
      });
      return true;
    });
  }

  window.RavenForgeShare = { kakaoEnabled: Boolean(kakaoKey), encode: encode, decode: decode, copy: copy, shareKakao: shareKakao };
})();
