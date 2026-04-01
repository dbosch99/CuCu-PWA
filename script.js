// --- UI ELEMENTS ---
const fileInput = document.getElementById('fileInput');
const processBtn = document.getElementById('processBtn');
const refreshBtn = document.getElementById('refreshBtn');
const fileLabel = document.getElementById('fileLabel');
const resultCount = document.getElementById('resultCount');
const resultList = document.getElementById('resultList');

const actionButtons = [fileLabel, processBtn, refreshBtn];

const followersCount = document.getElementById('followersCount');
const followingCount = document.getElementById('followingCount');
const totalsRow = document.getElementById('totalsRow');

const followersLabel = document.getElementById('followersLabel');
const followingLabel = document.getElementById('followingLabel');
const notFollowBackLabel = document.getElementById('notFollowBackLabel');

const tagline = document.getElementById('tagline');
const tapHint = document.getElementById('tapHint');
const instructionsTitle = document.getElementById('instructionsTitle');
const instructionsIntro = document.getElementById('instructionsIntro');
const instructionsList = document.getElementById('instructionsList');
const instructionsNote = document.getElementById('instructionsNote');
const developerLine = document.getElementById('developerLine');

// Instructions overlay
const infoBtn = document.getElementById('infoBtn');
const instructionsOverlay = document.getElementById('instructionsOverlay');
const closeInstructionsBtn = document.getElementById('closeInstructions');

let followers = [];
let following = [];
let remainingCount = 0;
let visibleFollowingCount = 0;

const langs = navigator.languages || [navigator.language || ''];
const isItalian = langs.some(l => String(l).toLowerCase().startsWith('it'));
const locale = isItalian ? 'it' : 'en';

const I18N = {
  it: {
    zipSelected: 'ZIP selezionato',
    selectZip: 'Seleziona ZIP',
    run: 'Avvia',
    refresh: 'Aggiorna',
    instructions: 'Istruzioni',
    close: 'Chiudi',
    tagline: 'Scopri chi non ti ricambia il follow!',
    followers: 'Follower',
    following: 'Seguiti*',
    notFollowingBack: 'Non ricambiano*',
    tapHint: 'Il simbolo * indica che i conteggi includono profili disattivati o eliminati (non mostrati da App Instagram).',
    developerPage: 'Pagina sviluppatore:',
    instructionsIntro: 'Questa app confronta la lista dei follower e dei profili seguiti e restituisce l\'elenco dei profili che non ricambiano il follow. Queste liste si scaricano dall\'app Instagram seguendo questi passaggi:',
    instructionsList: [
      'Apri Instagram e vai nel tuo profilo',
      'Tocca ☰ in alto a destra e seleziona "Centro gestione account"',
      'Seleziona "Le tue informazioni e autorizzazioni"',
      'Seleziona "Esporta le tue informazioni", poi "Crea esportazione" e "Esporta sul dispositivo"',
      'Seleziona "Personalizza informazioni", deseleziona tutto tranne "Follower e persone/Pagine seguite" e premi "Salva"',
      'Seleziona "Intervallo di date", scegli "Sempre" e premi "Salva"',
      'Seleziona "Formato", scegli "JSON" e premi "Salva"',
      'Seleziona "Avvia esportazione", inserisci la password e premi "Continua"',
      'Dopo circa 5–10 minuti comparirà il tasto "Download". Riceverai anche una mail di conferma',
      'Scarica il file. Di default è un file .ZIP. Se il browser lo decomprime automaticamente, comprimilo manualmente in formato .ZIP',
      'Apri l\'app CuCu, seleziona "Seleziona ZIP", scegli il file .ZIP e premi "Avvia"'
    ],
    instructionsNote: '<strong>Nota:</strong><br>• Il numero di "Follower" può risultare inferiore rispetto a quello mostrato da Instagram: Instagram include talvolta anche account disattivati o eliminati.<br>• Il numero di "Seguiti*" può risultare maggiore: CuCu include anche profili eliminati o disattivati, che Instagram non mostra.<br>• Tocca il numero progressivo per evidenziare un profilo in rosso ed escluderlo dal conteggio (utile per account eliminati o disattivati).',
    alertSelectZip: 'Seleziona prima un file ZIP.',
    alertMissingFiles: 'File richiesti non trovati nello ZIP.',
    alertProcessingError: 'Si è verificato un errore durante l\'elaborazione del file ZIP.',
    alertNoResults: 'Nessun risultato da mostrare.'
  },
  en: {
    zipSelected: 'ZIP selected',
    selectZip: 'Select ZIP',
    run: 'Run',
    refresh: 'Refresh',
    instructions: 'Instructions',
    close: 'Close',
    tagline: "See who doesn't follow you back!",
    followers: 'Followers',
    following: 'Following*',
    notFollowingBack: 'Not following back*',
    tapHint: 'The symbol * indicates that counts include deactivated or deleted accounts (not shown by Instagram App).',
    developerPage: 'Developer page:',
    instructionsIntro: 'This app compares your followers and following lists and returns the profiles that do not follow you back. These lists can be downloaded from the Instagram app by following the steps below:',
    instructionsList: [
      'Open Instagram and go to your profile',
      'Tap ☰ in the top right corner and select "Account Centre"',
      'Select "Your information and permissions"',
      'Select "Export your information", then "Create export" and "Export to device"',
      'Select "Customise information", clear everything except "Followers and Following", then tap "Save"',
      'Select "Date range", choose "All time" and tap "Save"',
      'Select "Format", choose "JSON" and tap "Save"',
      'Select "Start export", enter your password and tap "Continue"',
      'After about 5–10 minutes, a "Download" button will appear next to "Cancel". You will also receive a confirmation email',
      'Download the file. By default it is a .ZIP file. If your browser extracts it automatically, compress it again manually into .ZIP format',
      'Open the CuCu app, tap "Select ZIP", choose the downloaded .ZIP file and press "Run"'
    ],
    instructionsNote: '<strong>Note:</strong><br>• The "Followers" count may be lower than Instagram: Instagram may include deactivated or deleted accounts.<br>• The "Following*" count may be higher: CuCu includes deleted or deactivated profiles that Instagram does not show.<br>• Tap the progressive number to mark a profile in red and exclude it from the count (useful for deleted or deactivated accounts).',
    alertMissingFiles: 'Required files not found in the ZIP.',
    alertProcessingError: 'An error occurred while processing the ZIP.',
    alertNoResults: 'No results to display.'
  }
};

const T = I18N[locale];

function applyTranslations() {
  document.documentElement.lang = locale;

  if (tagline) tagline.textContent = T.tagline;
  if (fileLabel) fileLabel.textContent = T.selectZip;
  if (processBtn) processBtn.textContent = T.run;
  if (refreshBtn) {
    refreshBtn.textContent = T.refresh;
    refreshBtn.title = T.refresh;
  }

  if (followersLabel) followersLabel.textContent = T.followers;
  if (followingLabel) followingLabel.textContent = T.following;
  if (notFollowBackLabel) notFollowBackLabel.textContent = T.notFollowingBack;

  if (tapHint) tapHint.innerHTML = T.tapHint;

  if (infoBtn) {
    infoBtn.setAttribute('aria-label', T.instructions);
    infoBtn.setAttribute('title', T.instructions);
  }

  if (instructionsTitle) instructionsTitle.textContent = T.instructions;
  if (closeInstructionsBtn) closeInstructionsBtn.textContent = T.close;

  if (developerLine) {
    developerLine.innerHTML = `${T.developerPage} <a href="https://github.com/dbosch99" target="_blank" rel="noopener noreferrer">https://github.com/dbosch99</a>`;
  }

  if (instructionsIntro) instructionsIntro.textContent = T.instructionsIntro;

  if (instructionsList) {
    instructionsList.innerHTML = '';
    T.instructionsList.forEach(item => {
      const li = document.createElement('li');
      li.textContent = item;
      instructionsList.appendChild(li);
    });
  }

  if (instructionsNote) instructionsNote.innerHTML = T.instructionsNote;
}

applyTranslations();
setTimeout(fitActionButtons, 0);

// --- FILE HANDLING ---
fileInput.addEventListener('change', () => {
  if (fileInput.files.length > 0) {
    processBtn.disabled = false;
    processBtn.className = 'button button--primary';

    fileLabel.textContent = T.zipSelected;
    fileLabel.className = 'button button--gray is-disabled';
    fileLabel.setAttribute('aria-disabled', 'true');

    setTimeout(fitActionButtons, 0);
  }
});

processBtn.addEventListener('click', async () => {
  processBtn.disabled = true;
  processBtn.className = 'button button--gray-light is-disabled';

  const file = fileInput.files[0];
  if (!file) {
    alert(T.alertSelectZip);
    return;
  }

  try {
    const zip = await JSZip.loadAsync(file);
      const followersFiles = [];
      const followingFiles = [];
      let pendingFile = null;

      zip.forEach((relativePath, zf) => {
        const p = relativePath.toLowerCase();
        if (p.includes('__macosx') || p.includes('._')) return;

        // ⚠️ lavora SOLO sul nome file, non sul path
        const name = p.split('/').pop();
        if (!name) return;

        // pending (singolo)
        if (name === 'pending_follow_requests.json' || name === 'pending_follow_requests.html') {
          pendingFile = zf;
          return;
        }

        // followers: followers_1.json, followers_2.json, ...
        if (name.startsWith('followers_') && (name.endsWith('.json') || name.endsWith('.html'))) {
          followersFiles.push(zf);
          return;
        }

        // following: following.json (o following_1.json se mai esistesse)
        if (
          name === 'following.json' ||
          name === 'following.html' ||
          (name.startsWith('following_') && (name.endsWith('.json') || name.endsWith('.html')))
        ) {
          followingFiles.push(zf);
          return;
        }
      });

      if (followersFiles.length === 0 || followingFiles.length === 0) {
        alert(T.alertMissingFiles);
        return;
      }

      const followersTexts = await Promise.all(
        followersFiles.map(f => f.async('string'))
      );

      const followingTexts = await Promise.all(
        followingFiles.map(f => f.async('string'))
      );

      const pendingText = pendingFile
        ? await pendingFile.async('string')
        : null;

      followers = [];
      following = [];

      followersFiles.forEach((file, i) => {
        const isJSON = file.name.toLowerCase().endsWith('.json');
        const extracted = isJSON
          ? extractUsernamesFromFollowersJSON(followersTexts[i])
          : extractUsernamesFromHTML(followersTexts[i]);

        followers.push(...extracted);
      });

      followingFiles.forEach((file, i) => {
        const isJSON = file.name.toLowerCase().endsWith('.json');
        const extracted = isJSON
          ? extractUsernamesFromFollowingJSON(followingTexts[i])
          : extractUsernamesFromHTML(followingTexts[i]);

        following.push(...extracted);
      });

      // dedup finale di sicurezza
      followers = [...new Set(followers)];
      following = [...new Set(following)];

      visibleFollowingCount = following.length;

      if (followersCount) followersCount.textContent = followers.length;
      if (followingCount) followingCount.textContent = visibleFollowingCount;
      if (totalsRow) totalsRow.style.display = 'block';

      setTimeout(fitTotalsLabels, 0);

      const pendingIsJSON = pendingFile
        ? pendingFile.name.toLowerCase().endsWith('.json')
        : false;

    const pending = pendingText
      ? (pendingIsJSON ? extractUsernamesFromPendingJSON(pendingText)
                       : extractUsernamesFromHTML(pendingText))
      : [];
      
    const followersSet = new Set(followers.map(u => u.toLowerCase()));
    const notFollowingBack = following
      .filter(u => !followersSet.has(u.toLowerCase()));

    displayResults(notFollowingBack, pending);
  } catch (error) {
    alert(T.alertProcessingError);
    console.error(error);
  }
});

// --- REFRESH (online = hard refresh, offline = reset UI) ---
refreshBtn.addEventListener('click', () => {
  if (navigator.onLine) {
    // ONLINE → refresh vero (bypass cache)
    const url = new URL(location.href);
    url.searchParams.set('_refresh', Date.now().toString());
    location.href = url.toString();
  } else {
    // OFFLINE → reset interfaccia allo stato iniziale
    resetUI();
  }
});

function resetUI() {
  // reset stato
  followers = [];
  following = [];
  remainingCount = 0;
  visibleFollowingCount = 0;

  // reset input file
  fileInput.value = '';

  // reset bottoni
  processBtn.disabled = true;
  processBtn.className = 'button button--gray-light is-disabled';
  processBtn.textContent = T.run;

  fileLabel.textContent = T.selectZip;
  fileLabel.className = 'button button--gray';
  fileLabel.removeAttribute('aria-disabled');

  // reset risultati
  if (totalsRow) totalsRow.style.display = 'none';
  if (followersCount) followersCount.textContent = '0';
  if (followingCount) followingCount.textContent = '0';
  visibleFollowingCount = 0;

  document.getElementById('tapHint').style.display = 'none';
  resultCount.textContent = '0';
  resultList.innerHTML = '';

  setTimeout(fitActionButtons, 0);
}

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
  try {
    const parsed = JSON.parse(text);

    if (Array.isArray(parsed)) {
      return extractUsernamesFromFollowersJSON(text);
    }

    const maybe =
      parsed?.relationships_follow_requests_sent ||
      parsed?.relationships_follow_requests ||
      parsed?.relationships_follow_request ||
      [];

    if (Array.isArray(maybe)) {
      const out = [];
      const seen = new Set();

      for (const item of maybe) {
        const value = item?.string_list_data?.[0]?.value || '';
        const href  = item?.string_list_data?.[0]?.href || '';
        const title = item?.title || '';
        const cand  = value || title || usernameFromHref(href);
        const norm  = normalizeUsername(cand);

        if (norm && !seen.has(norm)) {
          seen.add(norm);
          out.push(norm);
        }
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
  const totalResults = notFollowingBack.length;
    
  if (totalResults === 0 && pending.length === 0) {
    alert(T.alertNoResults);
    return;
  }

  document.getElementById('tapHint').style.display = 'block';
  remainingCount = totalResults;                 // solo "Not following back", esclusi i WAITING
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

        if (isWaiting) return;

        remainingCount += wasInactive ? -1 : 1;
        if (remainingCount < 0) remainingCount = 0;
        resultCount.textContent = remainingCount;

        visibleFollowingCount += wasInactive ? -1 : 1;
        if (visibleFollowingCount < 0) visibleFollowingCount = 0;
        if (followingCount) followingCount.textContent = visibleFollowingCount;
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

      // riduce automaticamente il font se il nome e' troppo lungo
      setTimeout(() => fitUsername(a), 0);

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

function fitUsername(el) {
  const container = el.parentElement;
  if (!container) return;

  // riparti sempre dalla dimensione standard
  let size = 16;
  el.style.fontSize = `${size}px`;

  // riduci il font finche' il testo entra nello spazio disponibile
  while (el.scrollWidth > container.clientWidth && size > 1) {
    size -= 0.5;
    el.style.fontSize = `${size}px`;
  }
}

function fitTotalsLabels() {
  const labels = [followersLabel, followingLabel, notFollowBackLabel].filter(Boolean);
  if (labels.length === 0) return;

  // ripristina dimensione standard uguale per tutte
  let size = 16;
  labels.forEach(el => el.style.fontSize = `${size}px`);

  // trova il contenitore disponibile di ciascuna label
  const fits = () => labels.every(el => {
    const parent = el.parentElement;
    return parent && el.scrollWidth <= parent.clientWidth;
  });

  while (!fits() && size > 1) {
    size -= 0.5;
    labels.forEach(el => el.style.fontSize = `${size}px`);
  }
}

function fitActionButtons() {
  const buttons = actionButtons.filter(Boolean);
  if (buttons.length === 0) return;

  let size = 14;
  buttons.forEach(el => el.style.fontSize = `${size}px`);

  const fits = () => buttons.every(el => el.scrollWidth <= el.clientWidth);

  while (!fits() && size > 1) {
    size -= 0.5;
    buttons.forEach(el => el.style.fontSize = `${size}px`);
  }
}

window.addEventListener('resize', () => {
  fitTotalsLabels();
  fitActionButtons();
});

// --- INSTRUCTIONS OVERLAY LOGIC ---
function openInstructions() {
  instructionsOverlay.classList.add('is-visible');
  instructionsOverlay.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeInstructions() {
  instructionsOverlay.classList.remove('is-visible');
  instructionsOverlay.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

if (infoBtn && instructionsOverlay && closeInstructionsBtn) {
  infoBtn.addEventListener('click', openInstructions);
  closeInstructionsBtn.addEventListener('click', closeInstructions);

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && instructionsOverlay.classList.contains('is-visible')) {
      closeInstructions();
    }
  });
}
