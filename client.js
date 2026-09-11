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
document.getElementById('addGuest').addEventListener('click', () => notify('Formulario de invitado listo para conectar'));

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
