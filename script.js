// --- UI ELEMENTS ---
const fileInput = document.getElementById('fileInput');
const processBtn = document.getElementById('processBtn');
const refreshBtn = document.getElementById('refreshBtn');
const fileLabel = document.getElementById('fileLabel');
const resultTitle = document.getElementById('resultTitle');
const resultCount = document.getElementById('resultCount');
const resultList = document.getElementById('resultList');

let followers = [];
let following = [];

// --- FILE HANDLING ---
fileInput.addEventListener('change', () => {
  if (fileInput.files.length > 0) {
    fileInput.disabled = true;
    processBtn.disabled = false;
    processBtn.className = 'button button--primary';

    fileLabel.textContent = 'Uploaded';
    fileLabel.className = 'button button--gray is-disabled';
    fileLabel.setAttribute('aria-disabled', 'true'); // ← fix: niente manina, niente click
  }
});

processBtn.addEventListener('click', async () => {
  processBtn.disabled = true;
  processBtn.className = 'button button--gray-light is-disabled';

  const file = fileInput.files[0];
  if (file) {
    try {
      const zip = await JSZip.loadAsync(file);
      let followersFile = null;
      let followingFile = null;
      let pendingFile = null;

      zip.forEach((relativePath, file) => {
        const lowerPath = relativePath.toLowerCase();
        if (lowerPath.endsWith('followers_1.html') && !lowerPath.includes('__macosx') && !lowerPath.includes('._')) {
          followersFile = file;
        } else if (lowerPath.endsWith('following.html') && !lowerPath.includes('__macosx') && !lowerPath.includes('._')) {
          followingFile = file;
        } else if (lowerPath.endsWith('pending_follow_requests.html') && !lowerPath.includes('__macosx') && !lowerPath.includes('._')) {
          pendingFile = file;
        }
      });

      if (!followersFile || !followingFile) {
        alert('Required files not found in the ZIP.');
        return;
      }

      const followersContent = await followersFile.async('string');
      const followingContent = await followingFile.async('string');
      const pendingContent = pendingFile ? await pendingFile.async('string') : null;

      followers = extractUsernames(followersContent);
      following = extractUsernames(followingContent);
      const pending = pendingContent ? extractUsernames(pendingContent) : [];

        const followersSet = new Set(followers.map(u => u.toLowerCase()));
        const notFollowingBack = following.filter(u => !followersSet.has(u.toLowerCase()));
      displayResults(notFollowingBack, pending);
    } catch (error) {
      alert('An error occurred while processing the file.');
      console.error(error);
    }
  }
});

// --- REFRESH ---
refreshBtn.addEventListener('click', () => {
  // forza URL unico per bypassare la cache
  window.location.replace(window.location.pathname + '?v=' + Date.now());

  // aggiorna anche eventuali service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(r => r.update()));
  }
});

// --- HELPERS ---
function extractUsernames(htmlContent) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');

  // Preferisci i "card" principali per preservare l'ordine di visualizzazione
  const cards = doc.querySelectorAll('main .uiBoxWhite.noborder');
  const out = [];
  const seen = new Set();

  const push = (u) => {
    const norm = normalizeUsername(u);
    if (!norm) return;
    if (seen.has(norm)) return;
    seen.add(norm);
    out.push(norm);
  };

  if (cards.length > 0) {
    cards.forEach(card => {
      // Nuovo formato: username in <h2>
      const h2 = card.querySelector('h2');
      if (h2 && h2.textContent) push(h2.textContent);

      // Link presente in entrambi i formati (old: /username, new: /_u/username)
      const a = card.querySelector('a[href*="instagram.com"]');
      if (a && a.getAttribute('href')) {
        const fromHref = usernameFromHref(a.getAttribute('href'));
        if (fromHref) push(fromHref);
      }
    });
    return out;
  }

  // Fallback generico: prendi qualsiasi anchor instagram nell'intero documento
  const links = doc.querySelectorAll('a[href*="instagram.com"]');
  links.forEach(a => {
    const href = a.getAttribute('href') || '';
    const u = usernameFromHref(href) || a.textContent;
    if (u) push(u);
  });

  return out;
}

// Helpers

function usernameFromHref(href) {
  try {
    const u = new URL(href, 'https://www.instagram.com/');
    // pathname può essere: /username, /_u/username, o /username/qualcosa
    let p = u.pathname.replace(/^\/+|\/+$/g, '');   // trim slash
    if (!p) return null;
    if (p.startsWith('_u/')) p = p.slice(3);        // rimuovi prefisso _u/
    // prima componente è l'username
    const first = p.split('/')[0];
    // filtra eventuali pagine non-utente tipo "accounts", "explore", ecc.
    if (!first) return null;
    if (!/^[A-Za-z0-9._]+$/.test(first)) return null;
    return first;
  } catch {
    // Se non è un URL valido prova con una regex semplice
    const m = href.match(/instagram\.com\/(?:_u\/)?([A-Za-z0-9._]+)/i);
    return m ? m[1] : null;
  }
}

function normalizeUsername(s) {
  if (!s) return '';
  return s.replace(/^@+/, '').trim().toLowerCase();
}

function displayResults(notFollowingBack, pending) {
  const totalResults = notFollowingBack.length + pending.length;

  if (totalResults === 0) {
    alert('No results to display.');
    return;
  }

  resultTitle.style.display = 'block';
  resultCount.textContent = totalResults;
  resultList.innerHTML = '';

  const mkUrl = u => `https://www.instagram.com/${encodeURIComponent(u)}/`;

  // Pending (WAITING) in cima
  pending.forEach((user, index) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <div class="user-content">
        <a href="${mkUrl(user)}" target="_blank" rel="noopener noreferrer">${user}</a> <b>(WAITING)</b>
      </div>
      <span>${index + 1}</span>`;
    resultList.appendChild(li);
  });

  // Not following back
  notFollowingBack.forEach((user, index) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <div class="user-content">
        <a href="${mkUrl(user)}" target="_blank" rel="noopener noreferrer">${user}</a>
      </div>
      <span>${pending.length + index + 1}</span>`;
    resultList.appendChild(li);
  });
}

// --- SERVICE WORKER REGISTRATION (aggiornamento automatico) ---
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js').then(reg => {
      reg.update();
      setInterval(() => reg.update(), 60 * 60 * 1000); // controlla ogni ora

      if (reg.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' });

      reg.addEventListener('updatefound', () => {
        const sw = reg.installing;
        if (!sw) return;
        sw.addEventListener('statechange', () => {
          if (sw.state === 'installed' && navigator.serviceWorker.controller) {
            reg.waiting && reg.waiting.postMessage({ type: 'SKIP_WAITING' });
          }
        });
      });

      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });
    }).catch(console.error);
  });
}
