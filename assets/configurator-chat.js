(function (root) {
  'use strict';

  // Quote consultation chat. Talks to the Cloudflare Worker in
  // worker/quote-consult; the endpoint comes from this script tag's
  // data-endpoint attribute, and the chat stays hidden while it is empty.
  var script = typeof document !== 'undefined' ? document.currentScript : null;
  var endpoint = (script && script.dataset.endpoint || '').trim();
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

  function QuoteChat(props) {
    var React = root.React;
    var h = React.createElement;
    var ui = copy[props.language] || copy.en;
    var open = props.open;
    var historyState = React.useState([]), history = historyState[0], setHistory = historyState[1];
    var inputState = React.useState(''), input = inputState[0], setInput = inputState[1];
    var pendingState = React.useState(false), pending = pendingState[0], setPending = pendingState[1];
    var errorState = React.useState(''), error = errorState[0], setError = errorState[1];
    var listRef = React.useRef(null);
    var inputRef = React.useRef(null);

    React.useEffect(function () {
      if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
    }, [history, pending, open]);
    React.useEffect(function () {
      if (open && inputRef.current) inputRef.current.focus();
    }, [open]);

    var full = history.length >= MAX_TURNS;

    function send(event) {
      event.preventDefault();
      var text = input.trim();
      if (!text || pending || full) return;
      var next = history.concat([{ role: 'user', content: text }]);
      setHistory(next);
      setInput('');
      setError('');
      setPending(true);
      fetch(endpoint.replace(/\/$/, '') + '/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next, configuration: props.configuration, language: props.language })
      }).then(function (response) {
        return response.json().catch(function () { return {}; }).then(function (data) {
          if (!response.ok || typeof data.reply !== 'string') throw new Error(data.error || response.status);
          setHistory(next.concat([{ role: 'assistant', content: data.reply }]));
        });
      }).catch(function () {
        // Put the question back so it can be sent again.
        setHistory(history);
        setInput(text);
        setError(ui.error);
      }).then(function () { setPending(false); });
    }

    function restart() {
      setHistory([]);
      setError('');
      setInput('');
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
      h('div', { className: 'rf-chat-log', ref: listRef, 'aria-live': 'polite' }, bubbles),
      error ? h('p', { className: 'rf-chat-error', role: 'alert' }, error) : null,
      full ? h('p', { className: 'rf-chat-error' }, ui.full) : null,
      h('form', { className: 'rf-chat-form', onSubmit: send },
        h('textarea', {
          ref: inputRef, value: input, rows: 2, maxLength: 2000, placeholder: ui.placeholder, 'aria-label': ui.placeholder,
          disabled: full,
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
