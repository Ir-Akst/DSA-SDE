const http = require('http');

http.get('http://127.0.0.1:9222/json', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', async () => {
    const targets = JSON.parse(data);
    const page = targets.find(t => t.type === 'page' && t.url.includes('localhost'));
    if (!page) { console.log('No page target found'); return; }
    const ws = new WebSocket(page.webSocketDebuggerUrl);
    ws.addEventListener('open', async () => {
      let id = 1;
      function send(method, params) {
        return new Promise(resolve => {
          const reqId = id++;
          function onMsg(e) {
            const msg = JSON.parse(e.data);
            if (msg.id === reqId) {
              ws.removeEventListener('message', onMsg);
              resolve(msg.result);
            }
          }
          ws.addEventListener('message', onMsg);
          ws.send(JSON.stringify({ id: reqId, method, params }));
        });
      }

      const res = await send('Runtime.evaluate', {
        expression: `(() => {
          const cards = Array.from(document.querySelectorAll('.roadmap-120-day-card')).slice(0, 15).map(c => {
            const dayNum = c.getAttribute('data-day-num');
            const streamAEl = c.querySelector('.stream-a');
            const streamBEl = c.querySelector('.stream-b');
            const streamATopic = streamAEl ? streamAEl.children[1]?.textContent?.trim() : '';
            const streamASub = streamAEl ? streamAEl.children[2]?.textContent?.trim() : '';
            const streamBTopic = streamBEl ? streamBEl.children[1]?.textContent?.trim() : '';
            const streamBSub = streamBEl ? streamBEl.children[2]?.textContent?.trim() : '';
            return { dayNum, streamATopic, streamASub, streamBTopic, streamBSub };
          });
          const rawLocal = localStorage.getItem('algorecall_roadmap_progress');
          let parsedLocal = null;
          try { parsedLocal = JSON.parse(rawLocal); } catch(_) {}

          return {
            title: document.title,
            activeView: document.querySelector('.view-section.active')?.id,
            activeRoadmapView: document.querySelector('.roadmap-120-view-btn.active')?.dataset?.roadmapView,
            cards,
            storedSchemaVersion: parsedLocal?.dsa120Roadmap?.schemaVersion,
            storedDay1ATopic: parsedLocal?.dsa120Roadmap?.days?.[0]?.tasks?.[0]?.topicId,
            storedDay4ATopic: parsedLocal?.dsa120Roadmap?.days?.[3]?.tasks?.[0]?.topicId,
            storedDay26ATopic: parsedLocal?.dsa120Roadmap?.days?.[25]?.tasks?.[0]?.topicId
          };
        })()`,
        returnByValue: true
      });

      console.log('Browser State:', JSON.stringify(res.result.value, null, 2));
      ws.close();
    });
  });
});
