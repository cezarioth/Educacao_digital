/* global document, localStorage, FileReader, URL */

/* Utility */
const qs = sel => document.querySelector(sel);
const qsa = sel => Array.from(document.querySelectorAll(sel));

/* Theme toggle with persistence */
const themeToggle = qs('#themeToggle');
function setTheme(isLight) {
  if (isLight) document.body.classList.add('light');
  else document.body.classList.remove('light');
  themeToggle.setAttribute('aria-pressed', isLight ? "true" : "false");
  localStorage.setItem('ed_theme_light', isLight ? '1' : '0');
}
themeToggle.addEventListener('click', () => {
  const isLight = !document.body.classList.contains('light');
  setTheme(isLight);
});
(() => {
  const stored = localStorage.getItem('ed_theme_light');
  setTheme(stored === '1');
})();

/* Checklist logic */
const checkboxes = qsa('input[type="checkbox"][data-key]');
const progressBar = qs('#progressBar');
const miniProgress = qs('#miniProgress');
const percentLabel = qs('#percentLabel');

function saveChecks() {
  const data = checkboxes.map(cb => ({k: cb.dataset.key, v: cb.checked}));
  localStorage.setItem('ed_checks', JSON.stringify(data));
}

function loadChecks() {
  try {
    const raw = localStorage.getItem('ed_checks');
    if (!raw) return;
    const data = JSON.parse(raw);
    data.forEach(item => {
      const el = qs(`input[data-key="${item.k}"]`);
      if (el) el.checked = !!item.v;
    });
  } catch (e) { console.warn('Erro ao carregar checklist', e); }
}

function updateProgressUI() {
  const total = checkboxes.length || 1;
  const done = checkboxes.filter(cb => cb.checked).length;
  const pct = Math.round((done/total)*100);
  if (progressBar) progressBar.style.width = pct + '%';
  if (miniProgress) miniProgress.style.width = Math.max(8, pct) + '%';
  if (percentLabel) percentLabel.textContent = pct + '% completo';
}
checkboxes.forEach(cb => cb.addEventListener('change', () => {
  saveChecks();
  updateProgressUI();
}));

// initialize
loadChecks();
updateProgressUI();

/* Reset, print, export JSON */
qs('#resetBtn').addEventListener('click', () => {
  checkboxes.forEach(cb => cb.checked = false);
  saveChecks(); updateProgressUI();
});
qs('#printBtn').addEventListener('click', () => window.print());
qs('#exportBtn').addEventListener('click', () => {
  const data = checkboxes.map(cb => ({key: cb.dataset.key, checked: cb.checked}));
  const blob = new Blob([JSON.stringify({generatedAt: new Date().toISOString(), data}, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'checklist-defesa-digital.json';
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
});

/* Share message generator */
qs('#genShare').addEventListener('click', () => {
  const link = qs('#shareLink').value.trim();
  const out = qs('#shareResult');
  if (!link) {
    out.textContent = 'Cole o link público do seu site para gerar o texto de compartilhamento.';
    return;
  }
  const txt = `Olá! Teste este recurso sobre segurança digital: ${link}\n\nPeço que, após ver, envie prints do feedback (ex.: observações, erros ou sugestões). Obrigado.`;
  out.innerHTML = `<pre style="white-space:pre-wrap">${txt}</pre>`;
});

/* Gallery handling (client-side preview only) */
const addImgBtn = qs('#addImg');
const clearImgBtn = qs('#clearImg');
const imgUpload = qs('#imgUpload');
const gallery = qs('#gallery');

addImgBtn.addEventListener('click', () => imgUpload.click());
imgUpload.addEventListener('change', (e) => {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) return alert('Selecione uma imagem válida.');
  const reader = new FileReader();
  reader.onload = () => {
    // create element
    const div = document.createElement('div');
    div.className = 'shot';
    const img = document.createElement('img');
    img.src = reader.result;
    img.alt = 'Print de feedback';
    div.appendChild(img);
    // prepend and remove placeholder if exists
    const placeholder = gallery.querySelector('.placeholder');
    if (placeholder) placeholder.remove();
    gallery.prepend(div);
  };
  reader.readAsDataURL(file);
  // reset input so same file can be re-uploaded later
  e.target.value = '';
});

clearImgBtn.addEventListener('click', () => {
  gallery.innerHTML = '<div class="shot placeholder">Nenhuma imagem</div>';
});

/* Accessibility: focus outlines for keyboard users */
document.addEventListener('keyup', (e) => {
  if (e.key === 'Tab') document.body.classList.add('show-focus');
});

/* Small enhancement: animate progress on load */
window.addEventListener('load', () => {
  setTimeout(() => updateProgressUI(), 80);
});
