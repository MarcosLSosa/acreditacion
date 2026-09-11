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
  authModal.classList.add('open');
  authModal.setAttribute('aria-hidden', 'false');
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
  closeAuthModal();
  if (role === 'admin') {
    enterWorkspace('dashboard', 'admin');
    openEventWizard();
    return;
  }
  enterWorkspace('scanner', 'staff');
  notify('Sesión iniciada como usuario de puerta');
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

eventForm.addEventListener('submit', event => {
  event.preventDefault();
  const data = new FormData(eventForm);
  const eventName = data.get('eventName') || 'Nuevo evento';
  const venue = data.get('eventVenue') || 'Ubicación pendiente';
  document.querySelector('.event-switcher strong').textContent = eventName;
  document.querySelector('.event-switcher .muted').textContent = venue;
  document.querySelector('#dashboard .page-heading h1').textContent = `Buenas tardes, ${eventName}`;
  document.querySelector('.profile strong').textContent = 'Administrador';
  closeEventWizard();
  enterWorkspace('dashboard');
  notify(`Evento “${eventName}” creado correctamente`);
});

window.setTimeout(() => splashScreen.classList.add('is-hidden'), 1150);
