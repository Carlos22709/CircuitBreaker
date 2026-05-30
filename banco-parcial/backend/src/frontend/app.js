const $ = (selector) => document.querySelector(selector);

async function request(path, options = {}) {
  const response = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  const body = await response.json();

  if (!response.ok) {
    throw new Error(body.error || 'Solicitud fallida');
  }

  return body;
}

function print(selector, data) {
  $(selector).textContent = JSON.stringify(data, null, 2);
}

async function loadCircuitState() {
  const state = await request('/api/sms/circuit-state');
  $('#circuitBadge').textContent = state.state;
  $('#circuitBadge').className = `badge badge-${state.state.toLowerCase()}`;
  return state;
}

async function loadSql() {
  print('#sqlOutput', await request('/api/transferencias/sql'));
}

async function loadNosql() {
  print('#nosqlOutput', await request('/api/transferencias/nosql'));
}

async function refreshAll() {
  await Promise.all([loadCircuitState(), loadSql(), loadNosql()]);
}

$('#smsForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = new FormData(event.target);

  try {
    const result = await request('/api/sms/send', {
      method: 'POST',
      body: JSON.stringify({
        phone: form.get('phone'),
        message: form.get('message')
      })
    });
    print('#smsOutput', result);
    await loadCircuitState();
  } catch (error) {
    print('#smsOutput', { error: error.message });
  }
});

$('#failAldeamo').addEventListener('click', async () => {
  print('#smsOutput', await request('/api/sms/aldeamo/fail', { method: 'POST' }));
  await loadCircuitState();
});

$('#recoverAldeamo').addEventListener('click', async () => {
  print('#smsOutput', await request('/api/sms/aldeamo/recover', { method: 'POST' }));
  await loadCircuitState();
});

$('#transferForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = new FormData(event.target);

  try {
    const result = await request('/api/transferencias', {
      method: 'POST',
      body: JSON.stringify({
        cuentaOrigen: form.get('cuentaOrigen'),
        cuentaDestino: form.get('cuentaDestino'),
        monto: Number(form.get('monto'))
      })
    });
    print('#transferOutput', result);
    await Promise.all([loadSql(), loadNosql()]);
  } catch (error) {
    print('#transferOutput', { error: error.message });
  }
});

$('#manualSync').addEventListener('click', async () => {
  print('#transferOutput', await request('/api/sync', { method: 'POST' }));
  await Promise.all([loadSql(), loadNosql()]);
});

$('#loadSql').addEventListener('click', loadSql);
$('#loadNosql').addEventListener('click', loadNosql);
$('#refreshAll').addEventListener('click', refreshAll);

refreshAll().catch((error) => {
  print('#transferOutput', { error: error.message });
});
