(function (root) {
  'use strict';

  // Quote consultation chat. Talks to the Cloudflare Worker in
  // worker/quote-consult; the endpoint comes from this script tag's
  // data-endpoint attribute, and the chat stays hidden while it is empty.
  var script = typeof document !== 'undefined' ? document.currentScript : null;
  var endpoint = (script && script.dataset.endpoint || '').trim();
  var MAX_HISTORY_CHARS = 20000;
  var MAX_TURNS = 29; // the Worker accepts 30 turns ending with the user's

  var copy = {
    en: {
      open: 'Ask about your quote', title: 'Quote consultation', close: 'Close',
      greeting: 'Hello! I can help you choose options for your instrument and explain what they cost. What kind of music do you play, and what are you looking for?',
      placeholder: 'Type your question…', send: 'Send', thinking: 'Thinking…',
      error: 'The message could not be sent. Please try again.',
      full: 'This conversation is full. Start a new one to keep asking.', restart: 'New conversation',
      note: 'Prices are estimates from the configurator; RavenForge confirms the final price.'
    },
    de: {
      open: 'Fragen zum Angebot', title: 'Angebotsberatung', close: 'Schließen',
      greeting: 'Hallo! Ich helfe dir, Optionen für dein Instrument auszuwählen, und erkläre, was sie kosten. Welche Musik spielst du, und was suchst du?',
      placeholder: 'Deine Frage…', send: 'Senden', thinking: 'Denke nach…',
      error: 'Die Nachricht konnte nicht gesendet werden. Bitte versuche es erneut.',
      full: 'Dieses Gespräch ist voll. Starte ein neues, um weiterzufragen.', restart: 'Neues Gespräch',
      note: 'Die Preise sind Schätzungen aus dem Konfigurator; RavenForge bestätigt den endgültigen Preis.'
    },
    ko: {
      open: '견적 상담', title: '견적 상담', close: '닫기',
      greeting: '안녕하세요! 악기 옵션 선택을 돕고 가격을 설명해 드릴게요. 어떤 음악을 연주하시고, 어떤 악기를 찾고 계신가요?',
      placeholder: '궁금한 점을 입력하세요…', send: '보내기', thinking: '답변 작성 중…',
      error: '메시지를 보내지 못했습니다. 다시 시도해 주세요.',
      full: '대화가 길어져 더 이어갈 수 없습니다. 새 대화를 시작해 주세요.', restart: '새 대화',
      note: '가격은 configurator 기준 예상 금액이며, 최종 가격은 RavenForge가 확정합니다.'
    }
  };

  var advisorCopy = {
    ko: { find: '나에게 맞는 악기 찾기', explain: '현재 옵션 설명', draft: '제작 문의서 정리', save: '문의서 저장', review: '내용을 검토하고 수정하세요. 저장만 하며 전송하지 않습니다.', apply: '이 구성 적용', estimate: '마지막으로 비교한 구성',
      findPrompt: '나에게 맞는 악기를 찾고 싶어요. 연주 장르, 튜닝, 현 수, 현재 악기의 불편함을 한두 가지씩 물어보고 모델과 이유를 추천해 주세요.', explainPrompt: '현재 선택한 모델과 주요 옵션의 역할, 선택 시 고려할 점을 설명해 주세요.', draftPrompt: '제작 문의서 초안을 작성해 주세요. 대화에서 내가 말한 연주 목적, 튜닝, 불편함, 예산과 현재 선택한 사양을 구분하고, 모르는 내용은 미정으로 표시하세요. 추천했지만 내가 선택하지 않은 사양은 확정하지 말고 추가 확인 사항으로 남겨 주세요. 납기와 제작 가능 여부는 확인 요청으로 적어 주세요.' },
    en: { find: 'Find my instrument', explain: 'Explain my options', draft: 'Prepare an enquiry', save: 'Save enquiry', review: 'Review and edit before sharing. Saving does not send it.', apply: 'Apply this configuration', estimate: 'Last configuration compared',
      findPrompt: 'Help me find an instrument. Ask one or two questions at a time about genre, tuning, string count and discomfort with my current instrument, then recommend a model with reasons.', explainPrompt: 'Explain the roles and tradeoffs of my currently selected model and main options.', draftPrompt: 'Draft a maker enquiry. Separate my stated playing goals, tuning, comfort concerns and budget from the current selected specification. Mark unknowns as undecided and unaccepted recommendations as questions. Ask the maker to confirm feasibility and lead time.' },
    de: { find: 'Mein Instrument finden', explain: 'Optionen erklären', draft: 'Anfrage vorbereiten', save: 'Anfrage speichern', review: 'Vor dem Teilen prüfen und bearbeiten. Speichern versendet nichts.', apply: 'Diese Konfiguration übernehmen', estimate: 'Zuletzt verglichene Konfiguration',
      findPrompt: 'Hilf mir, ein Instrument zu finden. Frage jeweils ein oder zwei Dinge zu Musikstil, Stimmung, Saitenzahl und Problemen mit meinem Instrument. Empfiehl dann ein Modell mit Begründung.', explainPrompt: 'Erkläre die Funktionen und Abwägungen meines gewählten Modells und seiner wichtigsten Optionen.', draftPrompt: 'Erstelle eine Anfrage an den Instrumentenbauer. Trenne meine genannten Spielziele, Stimmung, Komfortprobleme und Budget von der aktuell gewählten Spezifikation. Unbekanntes bleibt offen, nicht angenommene Empfehlungen bleiben Fragen. Bitte um Bestätigung von Machbarkeit und Lieferzeit.' }
  };

  function QuoteChat(props) {
    var React = root.React;
    var h = React.createElement;
    var ui = copy[props.language] || copy.en;
    var advisor = advisorCopy[props.language] || advisorCopy.en;
    var open = props.open;
    var historyState = React.useState([]), history = historyState[0], setHistory = historyState[1];
    var inputState = React.useState(''), input = inputState[0], setInput = inputState[1];
    var pendingState = React.useState(false), pending = pendingState[0], setPending = pendingState[1];
    var errorState = React.useState(''), error = errorState[0], setError = errorState[1];
    var draftState = React.useState(''), draft = draftState[0], setDraft = draftState[1];
    var quoteState = React.useState(null), quote = quoteState[0], setQuote = quoteState[1];
    var listRef = React.useRef(null);
    var inputRef = React.useRef(null);

    React.useEffect(function () {
      if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
    }, [history, pending, open]);
    React.useEffect(function () {
      if (open && inputRef.current) inputRef.current.focus();
    }, [open]);

    var full = history.length >= MAX_TURNS || history.reduce(function (sum, message) { return sum + message.content.length; }, 0) + 2000 > MAX_HISTORY_CHARS;

    function send(event, preset, makeDraft) {
      event.preventDefault();
      var text = (preset || input).trim();
      if (!text || pending || full) return;
      var next = history.concat([{ role: 'user', content: text }]);
      setHistory(next);
      setInput('');
      setError('');
      setPending(true);
      var controller = new AbortController();
      var timeout = setTimeout(function () { controller.abort(); }, 100000);
      fetch(endpoint.replace(/\/$/, '') + '/chat', {
        method: 'POST', signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next, configuration: props.configuration, language: props.language })
      }).then(function (response) {
        return response.json().catch(function () { return {}; }).then(function (data) {
          if (!response.ok || typeof data.reply !== 'string') throw new Error(data.error || response.status);
          setHistory(next.concat([{ role: 'assistant', content: data.reply }]));
          setQuote(data.quote || null);
          if (makeDraft) setDraft(data.reply);
        });
      }).catch(function () {
        // Put the question back so it can be sent again.
        setHistory(history);
        setInput(text);
        setError(ui.error);
      }).then(function () { clearTimeout(timeout); setPending(false); });
    }

    function restart() {
      setHistory([]);
      setError('');
      setInput('');
      setDraft('');
      setQuote(null);
    }

    function saveDraft() {
      var url = URL.createObjectURL(new Blob([draft], { type: 'text/plain;charset=utf-8' }));
      var link = document.createElement('a');
      link.href = url; link.download = 'RavenForge-enquiry.txt'; link.click();
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    }

    // Stays mounted while closed so the conversation survives closing the panel.
    if (!open) return null;

    var bubbles = [h('p', { key: 'greeting', className: 'rf-chat-msg rf-chat-assistant' }, ui.greeting)].concat(
      history.map(function (message, index) {
        return h('p', { key: index, className: 'rf-chat-msg rf-chat-' + message.role }, message.content);
      })
    );
    if (pending) bubbles.push(h('p', { key: 'pending', className: 'rf-chat-msg rf-chat-assistant rf-chat-pending', role: 'status' }, ui.thinking));

    return h('section', { className: 'rf-chat-panel', 'aria-label': ui.title },
      h('header', { className: 'rf-chat-header' },
        h('strong', null, ui.title),
        h('span', { className: 'rf-chat-header-actions' },
          history.length ? h('button', { type: 'button', onClick: restart, disabled: pending }, ui.restart) : null,
          h('button', { type: 'button', onClick: props.onClose, 'aria-label': ui.close }, '×'))),
      h('div', { className: 'rf-chat-actions' },
        [[advisor.find, advisor.findPrompt], [advisor.explain, advisor.explainPrompt], [advisor.draft, advisor.draftPrompt, true]].map(function (action) {
          return h('button', { key: action[0], type: 'button', disabled: pending || full, onClick: function (event) { send(event, action[1], action[2]); } }, action[0]);
        })),
      h('div', { className: 'rf-chat-log', ref: listRef, 'aria-live': 'polite' }, bubbles,
        quote && props.onApply && Array.isArray(quote.lines) ? h('details', { className: 'rf-chat-quote' },
          h('summary', null, advisor.estimate + ': ' + quote.model + ' · ' + (Number.isFinite(quote.total) ? '€' + quote.total : '—') + (quote.price_on_request ? ' + …' : '')),
          h('ul', null, quote.lines.map(function (line, i) { return h('li', { key: i }, (line.page_title || line.title) + ': ' + (line.page_label || line.label)); })),
          h('button', { type: 'button', disabled: pending, onClick: function () { props.onApply(quote); setQuote(null); } }, advisor.apply)) : null,
        draft ? h('div', { className: 'rf-chat-draft' },
          h('label', { htmlFor: 'rf-enquiry-draft' }, advisor.review),
          h('textarea', { id: 'rf-enquiry-draft', value: draft, rows: 8, onChange: function (event) { setDraft(event.target.value); } }),
          h('button', { type: 'button', onClick: saveDraft }, advisor.save)) : null),
      error ? h('p', { className: 'rf-chat-error', role: 'alert' }, error) : null,
      full ? h('p', { className: 'rf-chat-error' }, ui.full) : null,
      h('form', { className: 'rf-chat-form', onSubmit: send },
        h('textarea', {
          ref: inputRef, value: input, rows: 2, maxLength: 2000, placeholder: ui.placeholder, 'aria-label': ui.placeholder,
          disabled: full || pending,
          onChange: function (event) { setInput(event.target.value); },
          onKeyDown: function (event) {
            if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) send(event);
          }
        }),
        h('button', { type: 'submit', disabled: pending || full || !input.trim() }, ui.send)),
      h('p', { className: 'rf-chat-note' }, ui.note));
  }

  root.RavenForgeQuoteChat = {
    enabled: Boolean(endpoint),
    Component: QuoteChat,
    openLabel: function (language) { return (copy[language] || copy.en).open; }
  };
}(typeof globalThis !== 'undefined' ? globalThis : this));
