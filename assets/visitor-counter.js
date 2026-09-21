(() => {
  const script = document.currentScript;
  const root = script?.dataset.root || '.';
  const endpoint = `${root}/api/visitor-counter.php`;
  const sessionKey = 'leercraft_visit_counted';
  let method = 'GET';

  try {
    if (!sessionStorage.getItem(sessionKey)) {
      method = 'POST';
      sessionStorage.setItem(sessionKey, 'pending');
    }
  } catch (_) {
    method = 'GET';
  }

  fetch(endpoint, {
    method,
    cache: 'no-store',
    headers: { Accept: 'application/json' }
  })
    .then(response => {
      if (!response.ok) throw new Error(`Counter returned ${response.status}`);
      return response.json();
    })
    .then(data => {
      if (method === 'POST') sessionStorage.setItem(sessionKey, '1');
      const target = document.getElementById('visitor-count');
      if (target && data.ok && Number.isFinite(data.count)) {
        target.textContent = new Intl.NumberFormat('nl-NL').format(data.count);
      }
    })
    .catch(() => {
      if (method === 'POST') {
        try { sessionStorage.removeItem(sessionKey); } catch (_) {}
      }
      const target = document.getElementById('visitor-count');
      if (target) target.textContent = 'niet beschikbaar';
    });
})();
