<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>My GPT-5 Chat</title>
  <style>
    :root { --bg:#f7f7f7; --card:#fff; --muted:#666; }
    *{box-sizing:border-box}
    body{margin:0;background:var(--bg);font-family:system-ui,Arial}
    .wrap{max-width:900px;margin:0 auto;padding:16px}
    h1{font-size:18px;margin:8px 0 16px}
    .toolbar{display:flex;gap:8px;margin-bottom:12px}
    .toolbar button{padding:10px 12px;border:1px solid #ddd;background:#fff;border-radius:8px;cursor:pointer}
    .log{background:var(--card);border:1px solid #eee;border-radius:12px;padding:12px;height:60vh;overflow:auto}
    .msg{margin:8px 0;padding:10px;border-radius:10px;line-height:1.4;white-space:pre-wrap;word-wrap:break-word}
    .me{background:#eef2ff;border:1px solid #dbe4ff;align-self:flex-end}
    .ai{background:#f8fafc;border:1px solid #eef2f7}
    .row{display:flex;gap:8px;margin-top:12px}
    textarea{flex:1;padding:10px;border-radius:10px;border:1px solid #ccc;min-height:56px}
    button.send{padding:10px 14px;border-radius:10px;border:1px solid #ccc;background:#fff;cursor:pointer}
    .muted{color:var(--muted);font-size:12px;margin-top:6px}
  </style>
</head>
<body>
  <div class="wrap">
    <h1>My GPT-5 Chat</h1>
    <div class="toolbar">
      <button id="newChat">New Chat</button>
      <span class="muted" id="status">Ready</span>
    </div>
    <div class="log" id="log"></div>

    <div class="row">
      <textarea id="inp" placeholder="Type a message…"></textarea>
      <button class="send" id="send">Send</button>
    </div>
  </div>

  <script>
    const log = document.getElementById('log');
    const inp = document.getElementById('inp');
    const statusEl = document.getElementById('status');

    let sessionId = localStorage.getItem('sessionId') || crypto.randomUUID();
    localStorage.setItem('sessionId', sessionId);

    function append(text, who) {
      const d = document.createElement('div');
      d.className = `msg ${who}`;
      d.textContent = text;
      log.appendChild(d);
      log.scrollTop = log.scrollHeight;
      return d;
    }

    async function send() {
      const text = inp.value.trim();
      if (!text) return;
      append(text, 'me');
      inp.value = '';
      const aiEl = append('…', 'ai');
      statusEl.textContent = 'Thinking…';

      // streaming endpoint (fallbacks to non-stream if you skip it)
      const resp = await fetch('/chat-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, userMessage: text })
      });

      if (resp.ok && resp.headers.get('Content-Type')?.includes('text/event-stream')) {
        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        aiEl.textContent = '';
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          for (const line of chunk.split('\n')) {
            if (line.startsWith('data: ')) aiEl.textContent += line.slice(6);
          }
          log.scrollTop = log.scrollHeight;
        }
      } else {
        const data = await resp.json();
        aiEl.textContent = data.reply || data.error || 'Error';
      }
      statusEl.textContent = 'Ready';
    }

    document.getElementById('send').onclick = send;
    inp.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
    });

    document.getElementById('newChat').onclick = () => {
      sessionId = crypto.randomUUID();
      localStorage.setItem('sessionId', sessionId);
      log.innerHTML = '';
      append('New chat started.', 'ai');
    };
  </script>
</body>
</html>
