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
