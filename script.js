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
let remainingCount = 0;

// --- FILE HANDLING ---
fileInput.addEventListener('change', () => {
  if (fileInput.files.length > 0) {
    processBtn.disabled = false;
    processBtn.className = 'button button--primary';

    fileLabel.textContent = 'ZIP selected';
    fileLabel.className = 'button button--gray is-disabled';
    fileLabel.setAttribute('aria-disabled', 'true');
  }
});

processBtn.addEventListener('click', async () => {
  processBtn.disabled = true;
  processBtn.className = 'button button--gray-light is-disabled';

  const file = fileInput.files[0];
  if (!file) {
    alert('Please select a ZIP first.');
    return;
  }

  try {
    const zip = await JSZip.loadAsync(file);
    let followersFile = null;
    let followingFile = null;
    let pendingFile   = null;

    zip.forEach((relativePath, zf) => {
      const p = relativePath.toLowerCase();
      const ok = !p.includes('__macosx') && !p.includes('._');
      if (!ok) return;

      if (p.endsWith('followers_1.html') || p.endsWith('followers_1.json')) followersFile = zf;
      else if (p.endsWith('following.html') || p.endsWith('following.json')) followingFile = zf;
      else if (p.endsWith('pending_follow_requests.html') || p.endsWith('pending_follow_requests.json')) pendingFile = zf;
    });

    if (!followersFile || !followingFile) {
      alert('Required files not found in the ZIP.');
      return;
    }

    const [followersText, followingText, pendingText] = await Promise.all([
      followersFile.async('string'),
      followingFile.async('string'),
      pendingFile ? pendingFile.async('string') : Promise.resolve(null)
    ]);

    const followersIsJSON = followersFile.name.toLowerCase().endsWith('.json');
    const followingIsJSON = followingFile.name.toLowerCase().endsWith('.json');
    const pendingIsJSON   = pendingFile ? pendingFile.name.toLowerCase().endsWith('.json') : false;

    followers = followersIsJSON
      ? extractUsernamesFromFollowersJSON(followersText)
      : extractUsernamesFromHTML(followersText);

    following = followingIsJSON
      ? extractUsernamesFromFollowingJSON(followingText)
      : extractUsernamesFromHTML(followingText);

    const pending = pendingText
      ? (pendingIsJSON ? extractUsernamesFromPendingJSON(pendingText)
                       : extractUsernamesFromHTML(pendingText))
      : [];

    const followersSet = new Set(followers.map(u => u.toLowerCase()));
    const pendingSet   = new Set(pending.map(u => u.toLowerCase()));
    const notFollowingBack = following
      .filter(u => !followersSet.has(u.toLowerCase()))
      .filter(u => !pendingSet.has(u.toLowerCase()));

    displayResults(notFollowingBack, pending);
  } catch (error) {
    alert('An error occurred while processing the ZIP.');
    console.error(error);
  }
});

// --- REFRESH ---
refreshBtn.addEventListener('click', () => {
  // forza URL unico per bypassare la cache
  const { pathname, hash } = window.location;
  window.location.replace(`${pathname}?v=${Date.now()}${hash || ''}`);

  // aggiorna anche eventuale service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(r => r.update()));
  }
});

// --- HELPERS (HTML) ---
function extractUsernamesFromHTML(htmlContent) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');

  // Preferisci i 'card' principali per preservare l'ordine di visualizzazione
  const cards = doc.querySelectorAll('main .uiBoxWhite.noborder');
  const out = [];
  const seen = new Set();

  const push = (u) => {
    const norm = normalizeUsername(u);
    if (!norm || seen.has(norm)) return;
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

// --- HELPERS (JSON) ---
function extractUsernamesFromFollowersJSON(text) {
  // followers_1.json = array di oggetti con string_list_data[{ href, value, timestamp }]
  let data;
  try { data = JSON.parse(text); } catch { return []; }
  const out = [];
  const seen = new Set();

  for (const item of Array.isArray(data) ? data : []) {
    const sld = Array.isArray(item?.string_list_data) ? item.string_list_data : [];
    const first = sld[0] || {};
    // preferisci 'value' se presente, altrimenti parse da href
    const v = first.value || usernameFromHref(first.href || '');
    const norm = normalizeUsername(v);
    if (norm && !seen.has(norm)) { seen.add(norm); out.push(norm); }
  }
  return out;
}

function extractUsernamesFromFollowingJSON(text) {
  // following.json = { relationships_following: [ { title, string_list_data:[{ href, timestamp }] } ] }
  let obj;
  try { obj = JSON.parse(text); } catch { return []; }
  const arr = Array.isArray(obj?.relationships_following) ? obj.relationships_following : [];
  const out = [];
  const seen = new Set();

  for (const item of arr) {
    // preferisci 'title' (ha già l'username), fallback a href
    const title = item?.title;
    const href  = item?.string_list_data?.[0]?.href || '';
    const cand  = title || usernameFromHref(href);
    const norm  = normalizeUsername(cand);
    if (norm && !seen.has(norm)) { seen.add(norm); out.push(norm); }
  }
  return out;
}

function extractUsernamesFromPendingJSON(text) {
  // Possibili strutture: array come followers_1.json, oppure
  // { relationships_follow_requests: [...] } (o campo simile)
  try {
    const parsed = JSON.parse(text);

    if (Array.isArray(parsed)) {
      return extractUsernamesFromFollowersJSON(text);
    }

    const maybe = parsed?.relationships_follow_requests || parsed?.relationships_follow_request || [];
    if (Array.isArray(maybe)) {
      const out = [];
      const seen = new Set();
      for (const item of maybe) {
        const title = item?.title;
        const href  = item?.string_list_data?.[0]?.href || '';
        const cand  = title || usernameFromHref(href);
        const norm  = normalizeUsername(cand);
        if (norm && !seen.has(norm)) { seen.add(norm); out.push(norm); }
      }
      return out;
    }

    return [];
  } catch {
    return [];
  }
}

// Helpers comuni

function usernameFromHref(href) {
  try {
    const u = new URL(href, 'https://www.instagram.com/');
    // pathname può essere: /username, /_u/username, o /username/qualcosa
    let p = u.pathname.replace(/^\/+|\/+$/g, '');   // trim slash
    if (!p) return null;
    if (p.startsWith('_u/')) p = p.slice(3);        // rimuove prefisso _u/
    const first = p.split('/')[0];                  // prima componente è l'username
    if (!first) return null;
    if (!/^[A-Za-z0-9._]+$/.test(first)) return null;
    return first;
  } catch {
    // fallback regex
    const m = (href || '').match(/instagram\.com\/(?:_u\/)?([A-Za-z0-9._]+)/i);
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
    document.getElementById('tapHint').style.display = 'block';
  remainingCount = totalResults;                 // contatore dinamico
  resultCount.textContent = remainingCount;
  resultList.innerHTML = '';

  const mkUrl = u => `https://www.instagram.com/${encodeURIComponent(u)}/`;

  const makeRow = (user, index, isWaiting) => {
    const li = document.createElement('li');

    const left = document.createElement('div');
    left.className = 'user-content';

    const a = document.createElement('a');
    a.href = mkUrl(user);
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.textContent = user;

    left.appendChild(a);
    if (isWaiting) {
      const b = document.createElement('b');
      b.innerText = ' (WAITING)';
      left.appendChild(b);
    }

    const right = document.createElement('span');
    right.className = 'index';
    right.textContent = index;                  // numero sequenziale
    right.title = 'Mark as inactive';
    right.setAttribute('role', 'button');
    right.tabIndex = 0;

    const toggleInactive = () => {
      const wasInactive = li.classList.toggle('is-inactive'); // aggiunge/rimuove
      remainingCount += wasInactive ? -1 : 1;
      if (remainingCount < 0) remainingCount = 0;
      resultCount.textContent = remainingCount;
    };

    right.addEventListener('click', toggleInactive);
    right.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleInactive();
      }
    });

    li.appendChild(left);
    li.appendChild(right);
    return li;
  };

  // Pending (WAITING) in cima
  pending.forEach((user, i) => {
    resultList.appendChild(makeRow(user, i + 1, true));
  });

  // Not following back
  notFollowingBack.forEach((user, i) => {
    resultList.appendChild(makeRow(user, pending.length + i + 1, false));
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
