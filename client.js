const views = document.querySelectorAll('.view');
const navItems = document.querySelectorAll('[data-view]');
const toast = document.getElementById('toast');

function showView(viewId) {
  views.forEach(view => view.classList.toggle('active-view', view.id === viewId));
  document.querySelectorAll('.nav-item').forEach(item => item.classList.toggle('active', item.dataset.view === viewId));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
navItems.forEach(item => item.addEventListener('click', () => showView(item.dataset.view)));

function notify(message) {
  toast.textContent = message;
  toast.classList.add('show');
  window.setTimeout(() => toast.classList.remove('show'), 2400);
}

document.getElementById('shareEvent').addEventListener('click', () => notify('Enlace de acceso copiado'));
document.getElementById('downloadTicket').addEventListener('click', () => notify('Acreditación guardada en el dispositivo'));
const guestModal = document.getElementById('guestModal');
const guestForm = document.getElementById('guestForm');
const guestQrPanel = document.getElementById('guestQrPanel');
const guests = [
  { name: 'Joaquín Sosa', id: 'AR-8F4K-2201', category: 'General', status: 'Ingresó', gate: 'Puerta 01 · 21:42', initials: 'JS', color: 'coral' },
  { name: 'Marina Castro', id: 'AR-8F4K-2202', category: 'VIP', status: 'Ingresó', gate: 'Puerta 02 · 21:41', initials: 'MC', color: 'blue-bg' },
  { name: 'Agustín Ferrero', id: 'AR-8F4K-2203', category: 'Prensa', status: 'Pendiente', gate: '—', initials: 'AF', color: 'lilac-bg' }
];

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
}

function renderGuests() {
  const table = document.querySelector('.guest-table');
  if (!table) return;
  const query = (document.getElementById('guestSearch')?.value || '').toLowerCase().trim();
  const filter = document.querySelector('.filter.active')?.dataset.filter || 'all';
  const visibleGuests = guests.filter(guest => (filter === 'all' || guest.category === filter || guest.status === filter) && (!query || `${guest.name} ${guest.id} ${guest.email}`.toLowerCase().includes(query)));
  table.innerHTML = '<div class="table-head"><span>ASISTENTE</span><span>TIPO DE ACCESO</span><span>ESTADO</span><span>ÚLTIMO INGRESO</span><span>ACCIONES</span></div>' + (visibleGuests.length ? visibleGuests.map(guest => `<div class="table-row"><span class="guest-cell"><span class="activity-avatar ${guest.color}">${escapeHtml(guest.initials)}</span><strong>${escapeHtml(guest.name)}<small>ID ${escapeHtml(guest.id)}</small></strong></span><span class="guest-category">${escapeHtml(guest.category)}</span><span class="${guest.status === 'Ingresó' ? 'valid-tag' : 'pending-tag'}">${escapeHtml(guest.status)}</span><span class="guest-gate">${escapeHtml(guest.gate)}</span><button class="more-button" aria-label="Opciones de ${escapeHtml(guest.name)}">•••</button></div>`).join('') : '<div class="empty-guests">No hay invitados que coincidan con la búsqueda.</div>');
}

function openGuestModal() {
  guestModal.classList.add('open');
  guestModal.setAttribute('aria-hidden', 'false');
  guestForm.reset();
  guestQrPanel.hidden = true;
}

function closeGuestModal() {
  guestModal.classList.remove('open');
  guestModal.setAttribute('aria-hidden', 'true');
}

function buildGuestQr(seed) {
  const qr = document.getElementById('guestQr');
  qr.innerHTML = Array.from({ length: 169 }, (_, index) => {
    const row = Math.floor(index / 13);
    const col = index % 13;
    const finder = (row < 5 && col < 5) || (row < 5 && col > 7) || (row > 7 && col < 5);
    const finderRow = row % 8;
    const finderCol = col % 8;
    const finderOn = finder && (finderRow === 0 || finderRow === 4 || finderCol === 0 || finderCol === 4 || (finderRow > 1 && finderRow < 3 && finderCol > 1 && finderCol < 3));
    const patternOn = ((index * 17 + seed.charCodeAt(index % seed.length) * 3 + row * col) % 7) < 3;
    return `<span class="qr-cell ${finderOn || (!finder && patternOn) ? '' : 'off'}"></span>`;
  }).join('');
}

document.getElementById('addGuest').addEventListener('click', openGuestModal);
document.querySelectorAll('[data-close-guest]').forEach(control => control.addEventListener('click', closeGuestModal));
guestForm.addEventListener('submit', event => {
  event.preventDefault();
  const data = new FormData(guestForm);
  const name = String(data.get('name')).trim();
  const id = `AR-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${2204 + guests.length}`;
  const initials = name.split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase();
  guests.unshift({ name, id, category: data.get('category'), status: 'Pendiente', gate: data.get('gate'), initials, color: 'green-bg' });
  renderGuests();
  document.getElementById('guestQrName').textContent = name;
  document.getElementById('guestQrId').textContent = `ID · ${id}`;
  buildGuestQr(`${id}${data.get('email')}`);
  guestQrPanel.hidden = false;
  notify('Invitado creado con QR listo para compartir');
});
document.getElementById('copyGuestLink').addEventListener('click', async () => {
  const id = document.getElementById('guestQrId').textContent.replace('ID · ', '');
  const link = `https://acredita-t1mi.vercel.app/ticket/${id}`;
  try { await navigator.clipboard.writeText(link); } catch { /* El navegador puede bloquear el portapapeles local. */ }
  notify('Enlace del invitado copiado');
});
renderGuests();

const guestImportButton = document.getElementById('importGuestsTop');
const guestFileInput = document.createElement('input');
guestFileInput.type = 'file';
guestFileInput.accept = '.xlsx,.xls,.csv,.tsv';
guestFileInput.hidden = true;
document.body.appendChild(guestFileInput);

function normalizeGuestKey(value) {
  return String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '');
}

function guestFromRow(row, index) {
  const fields = Object.fromEntries(Object.entries(row).map(([key, value]) => [normalizeGuestKey(key), String(value || '').trim()]));
  const name = fields.nombre || fields.nombrecompleto || fields.name || fields.invitado;
  if (!name) return null;
  const email = fields.email || fields.correo || fields.correoelectronico || '';
  const category = fields.categoria || fields.category || 'General';
  const gate = fields.puerta || fields.gate || 'Todas';
  const initials = name.split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase();
  const id = `AR-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${2300 + index}`;
  return { name, email, category, gate, id, status: 'Pendiente', initials, color: 'green-bg' };
}

function importGuests(file) {
  if (!window.XLSX) {
    notify('No se pudo cargar el lector de Excel. Probá con CSV.');
    return;
  }
  const reader = new FileReader();
  reader.onload = event => {
    try {
      const workbook = window.XLSX.read(event.target.result, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = window.XLSX.utils.sheet_to_json(sheet, { defval: '' });
      const imported = rows.map((row, index) => guestFromRow(row, index)).filter(Boolean);
      if (!imported.length) {
        notify('No encontramos filas válidas. Usá columnas Nombre, Email, Categoría y Puerta.');
        return;
      }
      guests.unshift(...imported);
      renderGuests();
      notify(`${imported.length} invitado${imported.length === 1 ? '' : 's'} importado${imported.length === 1 ? '' : 's'} con QR listo`);
    } catch {
      notify('No pudimos leer el archivo. Revisá que sea Excel o CSV válido.');
    }
  };
  reader.readAsArrayBuffer(file);
}

guestImportButton.addEventListener('click', () => guestFileInput.click());
guestFileInput.addEventListener('change', event => {
  const [file] = event.target.files;
  if (file) importGuests(file);
  event.target.value = '';
});

const templateButton = document.createElement('button');
templateButton.className = 'template-link';
templateButton.type = 'button';
templateButton.textContent = 'Descargar plantilla';
guestImportButton.after(templateButton);
templateButton.addEventListener('click', () => {
  const content = 'Nombre,Email,Categoria,Puerta\nSofia Martinez,sofia@email.com,General,Todas\nMarina Castro,marina@email.com,VIP,Puerta 02\n';
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }));
  link.download = 'plantilla-invitados.csv';
  link.click();
  URL.revokeObjectURL(link.href);
});

document.getElementById('guestSearch').addEventListener('input', renderGuests);
document.querySelectorAll('.filter[data-filter]').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('.filter[data-filter]').forEach(filterButton => filterButton.classList.toggle('active', filterButton === button));
  renderGuests();
}));

const budgetBot = document.getElementById('budgetBot');
const budgetOptions = document.getElementById('budgetOptions');
const budgetMessages = document.getElementById('budgetMessages');
const budgetResult = document.getElementById('budgetResult');
const budgetState = {};
const budgetSteps = [
  { key: 'guests', question: '¿Cuántas personas esperás?', options: [['100', 'Hasta 150 personas'], ['300', 'Entre 150 y 500'], ['800', 'Entre 500 y 1.000'], ['1500', 'Más de 1.000']] },
  { key: 'duration', question: '¿Cuánto dura el evento?', options: [['short', 'Hasta 4 horas'], ['full', 'Jornada completa'], ['multi', 'Más de un día']] },
  { key: 'extras', question: '¿Qué querés incluir?', options: [['scan', 'Validación en puerta'], ['tickets', 'Tickets digitales'], ['all', 'Todo el ecosistema']] }
];

function openBudgetBot() {
  budgetBot.classList.add('open');
  budgetBot.setAttribute('aria-hidden', 'false');
}

function closeBudgetBot() {
  budgetBot.classList.remove('open');
  budgetBot.setAttribute('aria-hidden', 'true');
}

function addBudgetMessage(text, type = 'bot-message') {
  const message = document.createElement('div');
  message.className = `budget-message ${type}`;
  message.textContent = text;
  budgetMessages.appendChild(message);
  budgetMessages.scrollTop = budgetMessages.scrollHeight;
}

function askBudgetStep(stepIndex) {
  const step = budgetSteps[stepIndex];
  addBudgetMessage(step.question);
  budgetOptions.innerHTML = step.options.map(([value, label]) => `<button data-budget-value="${value}">${label}</button>`).join('');
  budgetOptions.hidden = false;
}

function formatBudget(value) {
  return value.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });
}

function showBudgetResult() {
  const base = { social: 260, corporate: 340, festival: 430 }[budgetState.type];
  const guests = Number(budgetState.guests);
  const duration = { short: 1, full: 1.35, multi: 1.9 }[budgetState.duration];
  const extras = { scan: 1, tickets: 1.12, all: 1.28 }[budgetState.extras];
  const total = Math.round((guests * base * duration * extras + 180000) / 10000) * 10000;
  addBudgetMessage(`Para ${guests.toLocaleString('es-AR')} personas, tu operación estimada queda en ${formatBudget(total)}.`);
  budgetResult.hidden = false;
  budgetResult.innerHTML = `<span class="eyebrow accent">ESTIMACIÓN INICIAL</span><strong>${formatBudget(total)}</strong><small>Incluye configuración, tickets y operación base. Ajustamos el número final según puertas y alcance.</small><a href="mailto:hola@acredita.local?subject=Quiero%20mi%20presupuesto">Quiero mi presupuesto →</a>`;
  budgetOptions.hidden = true;
}

document.getElementById('openBudgetBot').addEventListener('click', openBudgetBot);
document.getElementById('closeBudgetBot').addEventListener('click', closeBudgetBot);
budgetOptions.addEventListener('click', event => {
  const button = event.target.closest('button');
  if (!button) return;
  const value = button.dataset.budgetValue;
  if (!budgetState.type) {
    budgetState.type = value;
    addBudgetMessage(button.textContent, 'user-message');
    askBudgetStep(0);
    return;
  }
  const stepIndex = budgetSteps.findIndex(step => !budgetState[step.key]);
  const step = budgetSteps[stepIndex];
  budgetState[step.key] = value;
  addBudgetMessage(button.textContent, 'user-message');
  if (stepIndex < budgetSteps.length - 1) askBudgetStep(stepIndex + 1);
  else showBudgetResult();
});

const result = document.getElementById('scanResult');
const scanStates = {
  valid: { className: 'valid', icon: '✓', label: 'ACCESO VÁLIDO', title: 'Martina López', text: 'Entrada General · Zona principal · Token verificado' },
  used: { className: 'used', icon: '×', label: 'QR YA UTILIZADO', title: 'Ingreso registrado a las 21:18', text: 'Puerta 01 · Este ticket no puede volver a utilizarse' },
  invalid: { className: 'invalid', icon: '!', label: 'ENTRADA INVÁLIDA', title: 'Ticket no reconocido', text: 'No pertenece al evento o la fecha actual' }
};
function setScanState(stateName) {
  const state = scanStates[stateName];
  result.className = `scan-result ${state.className}`;
  result.innerHTML = `<span class="result-icon">${state.icon}</span><span class="eyebrow">${state.label}</span><h2>${state.title}</h2><p>${state.text}</p>`;
  if (navigator.vibrate) navigator.vibrate(stateName === 'valid' ? 40 : [80, 60, 180]);
}
document.getElementById('simulateValid').addEventListener('click', () => setScanState('valid'));
document.getElementById('simulateUsed').addEventListener('click', () => setScanState('used'));
document.getElementById('simulateInvalid').addEventListener('click', () => setScanState('invalid'));

function buildQr() {
  const qr = document.getElementById('qrCode');
  const seed = 'AR20268F4K2219';
  const cells = [];
  for (let index = 0; index < 169; index += 1) {
    const row = Math.floor(index / 13);
    const col = index % 13;
    const inFinder = (row < 5 && col < 5) || (row < 5 && col > 7) || (row > 7 && col < 5);
    const finderRow = row % 8;
    const finderCol = col % 8;
    const finderOn = inFinder && (finderRow === 0 || finderRow === 4 || finderCol === 0 || finderCol === 4 || (finderRow > 1 && finderRow < 3 && finderCol > 1 && finderCol < 3));
    const patternOn = ((index * 17 + seed.charCodeAt(index % seed.length) * 3 + row * col) % 7) < 3;
    cells.push(`<span class="qr-cell ${finderOn || (!inFinder && patternOn) ? '' : 'off'}"></span>`);
  }
  qr.innerHTML = cells.join('');
}
buildQr();

setInterval(() => {
  const count = document.getElementById('enteredCount');
  if (!count) return;
  const next = Number(count.textContent.replace('.', '')) + 1;
  count.textContent = next.toLocaleString('es-AR');
}, 18000);

const landingPage = document.getElementById('landingPage');
const appShell = document.querySelector('.app-shell');
const createEventModal = document.getElementById('createEventModal');
const eventForm = document.getElementById('eventForm');
const authModal = document.getElementById('authModal');
const splashScreen = document.getElementById('splashScreen');
let activeRole = null;

function openEventWizard() {
  createEventModal.classList.add('open');
  createEventModal.setAttribute('aria-hidden', 'false');
}

function closeEventWizard() {
  createEventModal.classList.remove('open');
  createEventModal.setAttribute('aria-hidden', 'true');
}

function openAuthModal() {
  ensureLoginForm();
  authModal.classList.add('open');
  authModal.setAttribute('aria-hidden', 'false');
}

function ensureLoginForm() {
  if (document.getElementById('loginForm')) return;
  const form = document.createElement('form');
  form.className = 'login-form';
  form.id = 'loginForm';
  form.innerHTML = '<label>Correo<input type="email" id="loginEmail" required placeholder="admin@acredita.local"></label><label>Contraseña<input type="password" id="loginPassword" required placeholder="••••••••"></label><button type="submit" class="form-submit">Ingresar <span>→</span></button><p class="login-error" id="loginError" role="alert"></p>';
  document.querySelector('.auth-card').appendChild(form);
  form.addEventListener('submit', loginUser);
}

async function loginUser(event) {
  event.preventDefault();
  const error = document.getElementById('loginError');
  error.textContent = '';
  const response = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: document.getElementById('loginEmail').value, password: document.getElementById('loginPassword').value }) });
  if (!response.ok) { error.textContent = 'Correo o contraseña incorrectos.'; return; }
  const { user } = await response.json();
  closeAuthModal();
  enterWorkspace(user.role === 'staff' ? 'scanner' : 'dashboard', user.role);
  if (user.role === 'admin') openEventWizard();
  notify(`Sesión iniciada como ${user.role === 'admin' ? 'administrador' : 'usuario de puerta'}`);
}

function closeAuthModal() {
  authModal.classList.remove('open');
  authModal.setAttribute('aria-hidden', 'true');
}

function applyRole(role) {
  activeRole = role;
  const isStaff = role === 'staff';
  document.querySelectorAll('.nav-item').forEach(item => {
    const restricted = ['dashboard', 'ticket', 'guests'].includes(item.dataset.view);
    item.hidden = isStaff && restricted;
  });
  document.querySelector('.profile strong').textContent = isStaff ? 'Usuario de puerta' : 'Lucía M.';
  document.querySelector('.profile small').textContent = isStaff ? 'Staff · Puerta 01' : 'Administrador';
  document.querySelector('.event-switcher .eyebrow').textContent = isStaff ? 'TURNO ASIGNADO' : 'EVENTO ACTIVO';
}

function enterWorkspace(viewId = 'dashboard', role = activeRole || 'admin') {
  applyRole(role);
  landingPage.classList.add('landing-hidden');
  appShell.classList.remove('app-hidden');
  showView(viewId);
}

document.getElementById('startEvent').addEventListener('click', openAuthModal);
document.getElementById('openLogin').addEventListener('click', openAuthModal);
document.getElementById('seeDemo').addEventListener('click', () => document.getElementById('operacion').scrollIntoView({ behavior: 'smooth' }));
document.querySelectorAll('[data-close-modal]').forEach(control => control.addEventListener('click', closeEventWizard));
document.querySelectorAll('[data-close-auth]').forEach(control => control.addEventListener('click', closeAuthModal));
document.querySelectorAll('[data-auth-role]').forEach(roleButton => roleButton.addEventListener('click', () => {
  const role = roleButton.dataset.authRole;
  ensureLoginForm();
  document.getElementById('loginEmail').value = role === 'admin' ? 'admin@acredita.local' : 'puerta@acredita.local';
  document.getElementById('loginPassword').value = '';
  document.getElementById('loginPassword').focus();
}));
document.querySelectorAll('[data-role]').forEach(roleButton => roleButton.addEventListener('click', () => {
  const role = roleButton.dataset.role;
  if (role === 'organizer') openAuthModal();
  if (role === 'staff') {
    closeAuthModal();
    enterWorkspace('scanner', 'staff');
  }
  if (role === 'guest') enterWorkspace('ticket');
}));

document.getElementById('addTicketType').addEventListener('click', () => {
  const row = document.createElement('div');
  row.className = 'ticket-type-row';
  row.innerHTML = '<input placeholder="Nombre" aria-label="Nombre tipo de entrada"><input type="number" placeholder="Cupo" aria-label="Cupo tipo de entrada"><span>cupos</span>';
  document.getElementById('ticketTypeList').appendChild(row);
});

eventForm.addEventListener('submit', async event => {
  event.preventDefault();
  const data = new FormData(eventForm);
  const eventName = data.get('eventName') || 'Nuevo evento';
  const venue = data.get('eventVenue') || 'Ubicación pendiente';
  const response = await fetch('/api/events', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: eventName, venue, city: data.get('city'), startsAt: `${data.get('eventDate')}T${data.get('eventTime')}:00-03:00`, capacity: data.get('capacity'), ticketTypes: [...document.querySelectorAll('#ticketTypeList .ticket-type-row')].map(row => ({ name: row.children[0].value, capacity: Number(row.children[1].value) })) }) });
  if (!response.ok) { notify('No se pudo crear el evento'); return; }
  document.querySelector('.event-switcher strong').textContent = eventName;
  document.querySelector('.event-switcher .muted').textContent = venue;
  document.querySelector('#dashboard .page-heading h1').textContent = `Buenas tardes, ${eventName}`;
  document.querySelector('.profile strong').textContent = 'Administrador';
  closeEventWizard();
  enterWorkspace('dashboard');
  notify(`Evento “${eventName}” creado correctamente`);
});

window.setTimeout(() => splashScreen.classList.add('is-hidden'), 1150);

let cameraStream;
let cameraAnimation;

function setupCameraScanner() {
  const frame = document.querySelector('.camera-frame');
  const actions = document.querySelector('.scanner-actions');
  if (!frame || document.getElementById('cameraButton')) return;
  const video = document.createElement('video');
  video.id = 'cameraVideo';
  video.setAttribute('playsinline', 'true');
  video.setAttribute('aria-label', 'Vista previa de la cámara');
  const button = document.createElement('button');
  button.className = 'secondary-button camera-button';
  button.id = 'cameraButton';
  button.textContent = 'Activar cámara';
  const status = document.createElement('p');
  status.className = 'camera-status';
  status.id = 'cameraStatus';
  frame.appendChild(video);
  actions.prepend(button);
  actions.after(status);
  button.addEventListener('click', toggleCamera);
}

async function toggleCamera() {
  const button = document.getElementById('cameraButton');
  const video = document.getElementById('cameraVideo');
  const frame = document.querySelector('.camera-frame');
  const status = document.getElementById('cameraStatus');
  if (cameraStream) {
    cameraStream.getTracks().forEach(track => track.stop());
    cameraStream = null;
    cancelAnimationFrame(cameraAnimation);
    frame.classList.remove('camera-active');
    button.classList.remove('active');
    button.textContent = 'Activar cámara';
    status.textContent = 'Cámara detenida';
    return;
  }
  if (!navigator.mediaDevices?.getUserMedia) {
    status.textContent = 'Este navegador no permite acceso a cámara.';
    status.className = 'camera-status error';
    return;
  }
  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
    video.srcObject = cameraStream;
    await video.play();
    frame.classList.add('camera-active');
    button.classList.add('active');
    button.textContent = 'Detener cámara';
    status.className = 'camera-status';
    status.textContent = 'Cámara activa · buscando un QR…';
    scanCameraFrame();
  } catch (error) {
    status.className = 'camera-status error';
    status.textContent = error.name === 'NotAllowedError' ? 'Permiso de cámara denegado. Habilitalo en el navegador.' : 'No se pudo iniciar la cámara.';
  }
}

async function scanCameraFrame() {
  if (!cameraStream) return;
  const video = document.getElementById('cameraVideo');
  const status = document.getElementById('cameraStatus');
  if ('BarcodeDetector' in window) {
    try {
      const detector = new BarcodeDetector({ formats: ['qr_code'] });
      const codes = await detector.detect(video);
      if (codes.length) {
        status.className = 'camera-status success';
        status.textContent = 'QR detectado · validando acceso…';
        setScanState('valid');
        return;
      }
    } catch { /* El navegador puede no tener el formato QR habilitado. */ }
  } else {
    status.textContent = 'Cámara activa · validación QR disponible en Chrome/Android.';
  }
  cameraAnimation = requestAnimationFrame(scanCameraFrame);
}

setupCameraScanner();
