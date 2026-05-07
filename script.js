// --- UI ELEMENTS ---
const fileInput = document.getElementById('fileInput');
const processBtn = document.getElementById('processBtn');
const refreshBtn = document.getElementById('refreshBtn');
const fileLabel = document.getElementById('fileLabel');

const resultCount = document.getElementById('resultCount');
const resultList = document.getElementById('resultList');
const deletedList = document.getElementById('deletedList');

let actionButtons = [];

const followersCount = document.getElementById('followersCount');
const followingCount = document.getElementById('followingCount');
const totalsRow = document.getElementById('totalsRow');

const followersLabel = document.getElementById('followersLabel');
const followingLabel = document.getElementById('followingLabel');
const notFollowBackLabel = document.getElementById('notFollowBackLabel');

const mainTabBtn = document.getElementById('mainTabBtn');
const deletedTabBtn = document.getElementById('deletedTabBtn');
const mainTab = document.getElementById('mainTab');
const deletedTab = document.getElementById('deletedTab');

const exportDeletedBtn = document.getElementById('exportDeletedBtn');
const importDeletedInput = document.getElementById('importDeletedInput');
const importDeletedLabel = document.getElementById('importDeletedLabel');
const deletedHint = document.getElementById('deletedHint');
const deletedTotalsRow = document.getElementById('deletedTotalsRow');
const deletedTotalLabel = document.getElementById('deletedTotalLabel');
const deletedTotalCount = document.getElementById('deletedTotalCount');

actionButtons = [
  fileLabel,
  processBtn,
  refreshBtn,
  exportDeletedBtn,
  importDeletedLabel
];

const tagline = document.getElementById('tagline');
const tapHint = document.getElementById('tapHint');
const instructionsTitle = document.getElementById('instructionsTitle');
const instructionsIntro = document.getElementById('instructionsIntro');
const instructionsList = document.getElementById('instructionsList');
const instructionsNote = document.getElementById('instructionsNote');
const shareLine = document.getElementById('shareLine');
const developerLine = document.getElementById('developerLine');
const appVersion = document.getElementById('appVersion');

// Instructions overlay
const infoBtn = document.getElementById('infoBtn');
const instructionsOverlay = document.getElementById('instructionsOverlay');
const closeInstructionsBtn = document.getElementById('closeInstructions');

// --- STATE ---
let followers = [];
let following = [];
let pending = [];

let parsedMainResults = [];
let confirmedDeletedAccounts = new Set();
let pendingDeletedSelections = new Set();
let pendingRestoreSelections = new Set();
let currentTotalsLabelFontSize = 16;

// --- LOCALE ---
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
    following: 'Seguiti',
    notFollowingBack: 'Non ricambiano',
    deletedTotalLabel: 'Eliminati o disattivati',
    tapHint: 'Tocca il numero progressivo per segnare in rosso i profili eliminati da rimuovere dalla scheda principale.',
    deletedHint: 'Tocca il numero progressivo per segnare in verde i profili che vuoi ripristinare nella scheda principale.',
    resultsTab: 'Risultati',
    deletedTab: 'Filtro',
    exportDeleted: 'Esporta',
    importDeleted: 'Seleziona filtro',
    filterSelected: 'Filtro selezionato',
    shareApp: 'Condividi app:',
    developerPage: 'Pagina sviluppatore:',
    versionLabel: 'Versione:',
    exportFileName: 'cucu-account-eliminati.json',
    exportSuccess: 'Lista esportata.',
    importSuccess: 'Lista caricata.',
    importInvalid: 'File non valido.',
    importEmpty: 'Nessun account eliminato trovato nel file.',
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
    instructionsNote: '<strong>Nota:</strong><br>• Il numero di "Follower" può risultare inferiore rispetto a quello mostrato da Instagram: Instagram include talvolta anche account disattivati o eliminati.<br>• Il numero di "Seguiti" può risultare maggiore: CuCu include anche profili eliminati o disattivati, che Instagram non mostra.<br>• Nella scheda "Risultati", tocca il numero progressivo per segnare in rosso i profili eliminati da rimuovere dalla scheda principale.<br>• Nella scheda "Filtro", tocca il numero progressivo per segnare in verde i profili che vuoi ripristinare. Le modifiche vengono applicate automaticamente quando tocchi una delle due schede.',
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
    following: 'Following',
    notFollowingBack: 'Not following back',
    deletedTotalLabel: 'Deleted or deactivated',
    tapHint: 'Tap the progressive number to mark in red the deleted profiles to remove from the main tab.',
    deletedHint: 'Tap the progressive number to mark in green the profiles you want to restore to the main tab.',
    resultsTab: 'Results',
    deletedTab: 'Filter',
    exportDeleted: 'Export',
    importDeleted: 'Select filter',
    filterSelected: 'Filter selected',
    shareApp: 'Share app:',
    developerPage: 'Developer page:',
    versionLabel: 'Version:',
    exportFileName: 'cucu-deleted-accounts.json',
    exportSuccess: 'List exported.',
    importSuccess: 'List loaded.',
    importInvalid: 'Invalid file.',
    importEmpty: 'No deleted accounts found in the file.',
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
    instructionsNote: '<strong>Note:</strong><br>• The "Followers" count may be lower than Instagram: Instagram may include deactivated or deleted accounts.<br>• The "Following" count may be higher: CuCu includes deleted or deactivated profiles that Instagram does not show.<br>• In the "Results" tab, tap the progressive number to mark in red the deleted profiles to remove from the main tab.<br>• In the "Filter" tab, tap the progressive number to mark in green the profiles you want to restore. Changes are applied automatically when you tap either tab.',
    alertSelectZip: 'Please select a ZIP first.',
    alertMissingFiles: 'Required files not found in the ZIP.',
    alertProcessingError: 'An error occurred while processing the ZIP.',
    alertNoResults: 'No results to display.'
  }
};

const T = I18N[locale];

// --- TRANSLATIONS ---
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
  if (deletedTotalLabel) deletedTotalLabel.textContent = T.deletedTotalLabel;

  if (tapHint) tapHint.innerHTML = T.tapHint;
  if (deletedHint) deletedHint.innerHTML = T.deletedHint;

  if (mainTabBtn) mainTabBtn.textContent = T.resultsTab;
  if (deletedTabBtn) deletedTabBtn.textContent = T.deletedTab;

  if (exportDeletedBtn) exportDeletedBtn.textContent = T.exportDeleted;
  if (importDeletedLabel) importDeletedLabel.textContent = T.importDeleted;

  if (infoBtn) {
    infoBtn.setAttribute('aria-label', T.instructions);
    infoBtn.setAttribute('title', T.instructions);
  }

  if (instructionsTitle) instructionsTitle.textContent = T.instructions;
  if (closeInstructionsBtn) closeInstructionsBtn.textContent = T.close;

  if (shareLine) {
    shareLine.innerHTML = `${T.shareApp} <span id="shareLink" class="link-like" role="button" tabindex="0">https://dbosch99.github.io/CuCu-PWA/</span>`;
  }

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

// --- SHARE LINK ---
function bindShareLink() {
  const currentShareLink = document.getElementById('shareLink');
  if (!currentShareLink) return;

  const copyUrl = async () => {
    const url = 'https://dbosch99.github.io/CuCu-PWA/';
    const copiedText = locale === 'it' ? 'Copiato!' : 'Copied!';

    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = url;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }

    const original = url;
    currentShareLink.textContent = copiedText;

    setTimeout(() => {
      currentShareLink.textContent = original;
    }, 1500);
  };

  currentShareLink.addEventListener('click', copyUrl);
  currentShareLink.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      copyUrl();
    }
  });
}

// --- APP VERSION ---
function showAppVersion(version) {
  if (!appVersion || !version) return;

  appVersion.textContent = `${T.versionLabel} ${version}`;

  const hasResults =
    totalsRow &&
    totalsRow.style.display !== 'none' &&
    resultList &&
    resultList.children.length > 0;

  appVersion.style.display = hasResults ? 'none' : 'block';
}

function requestAppVersion() {
  if (!('serviceWorker' in navigator)) return;

  const receiveVersion = event => {
    const data = event.data;
    if (!data || data.type !== 'APP_VERSION' || !data.version) return;

    showAppVersion(data.version);
    navigator.serviceWorker.removeEventListener('message', receiveVersion);
  };

  navigator.serviceWorker.addEventListener('message', receiveVersion);

  if (navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({ type: 'GET_APP_VERSION' });
  }
}

// --- TABS ---
function applyPendingFilterChanges() {
  pendingDeletedSelections.forEach(u => confirmedDeletedAccounts.add(u));
  pendingRestoreSelections.forEach(u => confirmedDeletedAccounts.delete(u));

  pendingDeletedSelections.clear();
  pendingRestoreSelections.clear();

  recomputeAndRenderAll();
}

function activateTab(tabName) {
    if (
      pendingDeletedSelections.size > 0 ||
      pendingRestoreSelections.size > 0
    ) {
      applyPendingFilterChanges();
    }

  const showMain = tabName === 'main';

  if (mainTab) mainTab.style.display = showMain ? 'block' : 'none';
  if (deletedTab) deletedTab.style.display = showMain ? 'none' : 'block';

  if (mainTabBtn) mainTabBtn.classList.toggle('tab-button--active', showMain);
  if (deletedTabBtn) deletedTabBtn.classList.toggle('tab-button--active', !showMain);

  if (deletedHint) {
    deletedHint.style.display = showMain
      ? 'none'
      : (deletedList && deletedList.children.length > 0 ? 'block' : 'none');
  }

    requestAnimationFrame(() => {
      if (showMain) {
        fitTotalsLabels();
      } else {
        if (deletedTotalLabel) {
          deletedTotalLabel.style.fontSize = `${currentTotalsLabelFontSize}px`;
        }
      }

      fitActionButtons();
    });
}

if (mainTabBtn) {
  mainTabBtn.addEventListener('click', () => activateTab('main'));
}

if (deletedTabBtn) {
  deletedTabBtn.addEventListener('click', () => activateTab('deleted'));
}

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

      const name = p.split('/').pop();
      if (!name) return;

      if (name === 'pending_follow_requests.json' || name === 'pending_follow_requests.html') {
        pendingFile = zf;
        return;
      }

      if (name.startsWith('followers_') && (name.endsWith('.json') || name.endsWith('.html'))) {
        followersFiles.push(zf);
        return;
      }

      if (
        name === 'following.json' ||
        name === 'following.html' ||
        (name.startsWith('following_') && (name.endsWith('.json') || name.endsWith('.html')))
      ) {
        followingFiles.push(zf);
      }
    });

    if (followersFiles.length === 0 || followingFiles.length === 0) {
      alert(T.alertMissingFiles);
      return;
    }

    const followersTexts = await Promise.all(followersFiles.map(f => f.async('string')));
    const followingTexts = await Promise.all(followingFiles.map(f => f.async('string')));
    const pendingText = pendingFile ? await pendingFile.async('string') : null;

    followers = [];
    following = [];
    pending = [];

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

    followers = [...new Set(followers)];
    following = [...new Set(following)];

    following = following.filter(u => !isDeletedPlaceholder(u));

    const pendingIsJSON = pendingFile
      ? pendingFile.name.toLowerCase().endsWith('.json')
      : false;

    pending = pendingText
      ? (pendingIsJSON ? extractUsernamesFromPendingJSON(pendingText)
                       : extractUsernamesFromHTML(pendingText))
      : [];

    pending = [...new Set(pending)];

    recomputeAndRenderAll();
    activateTab('main');
  } catch (error) {
    alert(T.alertProcessingError);
    console.error(error);
  }
});

// --- DELETED ACCOUNTS ACTIONS ---
if (exportDeletedBtn) {
  exportDeletedBtn.addEventListener('click', exportDeletedAccounts);
}

if (importDeletedInput) {
  importDeletedInput.addEventListener('change', importDeletedAccounts);
}

// --- REFRESH ---
refreshBtn.addEventListener('click', () => {
  if (navigator.onLine) {
    const url = new URL(location.href);
    url.searchParams.set('_refresh', Date.now().toString());
    location.href = url.toString();
  } else {
    resetUI();
  }
});

// --- RESET ---
function resetUI() {
  followers = [];
  following = [];
  pending = [];

  parsedMainResults = [];
  confirmedDeletedAccounts.clear();
  pendingDeletedSelections.clear();
  pendingRestoreSelections.clear();

  fileInput.value = '';

  processBtn.disabled = true;
  processBtn.className = 'button button--gray-light is-disabled';
  processBtn.textContent = T.run;

  fileLabel.textContent = T.selectZip;
  fileLabel.className = 'button button--gray';
  fileLabel.removeAttribute('aria-disabled');
    
    if (importDeletedLabel) {
      importDeletedLabel.textContent = T.importDeleted;
      importDeletedLabel.className = 'button button--gray';
      importDeletedLabel.removeAttribute('aria-disabled');
    }
    if (importDeletedInput) {
      importDeletedInput.value = '';
    }

  if (totalsRow) totalsRow.style.display = 'none';
  if (deletedTotalsRow) deletedTotalsRow.style.display = 'none';
  if (followersCount) followersCount.textContent = '0';
  if (followingCount) followingCount.textContent = '0';
  if (resultCount) resultCount.textContent = '0';
  if (deletedTotalCount) deletedTotalCount.textContent = '0';

  if (tapHint) tapHint.style.display = 'none';
  if (deletedHint) deletedHint.style.display = 'none';

  if (resultList) resultList.innerHTML = '';
  if (deletedList) deletedList.innerHTML = '';

  activateTab('main');
  setTimeout(fitActionButtons, 0);
}

// --- COMPUTE + RENDER ---
function recomputeAndRenderAll() {
    if (followers.length === 0 && following.length === 0 && pending.length === 0) {
      if (totalsRow) totalsRow.style.display = 'none';
      if (deletedTotalsRow) deletedTotalsRow.style.display = 'none';
      if (tapHint) tapHint.style.display = 'none';
      if (deletedHint) deletedHint.style.display = 'none';
      if (resultCount) resultCount.textContent = '0';
      if (deletedTotalCount) deletedTotalCount.textContent = '0';
      return;
    }
  const followersSet = new Set(followers.map(u => u.toLowerCase()));
  const confirmedDeletedSet = new Set([...confirmedDeletedAccounts].map(u => u.toLowerCase()));

  const rawNotFollowingBack = following.filter(u => !followersSet.has(u.toLowerCase()));
  parsedMainResults = rawNotFollowingBack.filter(u => !confirmedDeletedSet.has(u.toLowerCase()));

  const visibleFollowing = Math.max(0, following.length - confirmedDeletedAccounts.size);
  const deletedProfilesCount = confirmedDeletedAccounts.size + pendingDeletedSelections.size;

  if (followersCount) followersCount.textContent = followers.length;
  if (followingCount) followingCount.textContent = visibleFollowing;
  if (resultCount) resultCount.textContent = parsedMainResults.length;
  if (deletedTotalCount) deletedTotalCount.textContent = deletedProfilesCount;

  if (totalsRow) totalsRow.style.display = 'block';
  if (deletedTotalsRow) deletedTotalsRow.style.display = deletedProfilesCount > 0 ? 'block' : 'none';
  if (tapHint) tapHint.style.display = 'block';

    renderMainList(parsedMainResults);
    renderDeletedList();

    if (deletedTotalLabel) {
      deletedTotalLabel.style.fontSize = `${currentTotalsLabelFontSize}px`;
    }

    setTimeout(fitTotalsLabels, 0);
}

function renderMainList(notFollowingBack) {
  if (appVersion) appVersion.style.display = 'none';
  if (!resultList) return;

  resultList.innerHTML = '';

  const allRows = [];

  pending.forEach(user => {
    allRows.push({ user, isWaiting: true });
  });

  notFollowingBack.forEach(user => {
    allRows.push({ user, isWaiting: false });
  });

  if (allRows.length === 0) {
    if (tapHint) tapHint.style.display = 'none';
    return;
  }

  allRows.forEach((item, idx) => {
    const li = document.createElement('li');

    const left = document.createElement('div');
    left.className = 'user-content';

    const a = document.createElement('a');
    a.href = `https://www.instagram.com/${encodeURIComponent(item.user)}/`;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.textContent = item.user;
    left.appendChild(a);

    if (item.isWaiting) {
      const b = document.createElement('b');
      b.innerText = ' (WAITING)';
      left.appendChild(b);
    }

    const right = document.createElement('span');
    right.className = 'index';
    right.textContent = idx + 1;
    right.setAttribute('role', 'button');
    right.tabIndex = 0;

    const normalized = normalizeUsername(item.user);
    const isMarkedDeleted = pendingDeletedSelections.has(normalized) || confirmedDeletedAccounts.has(normalized);

    if (!item.isWaiting && isMarkedDeleted) {
      li.classList.add('is-inactive');
    }

    const toggleDeletedMark = () => {
      if (item.isWaiting) return;

      const norm = normalizeUsername(item.user);

      if (confirmedDeletedAccounts.has(norm)) {
        confirmedDeletedAccounts.delete(norm);
      }

      if (pendingDeletedSelections.has(norm)) {
        pendingDeletedSelections.delete(norm);
        li.classList.remove('is-inactive');
      } else {
        pendingDeletedSelections.add(norm);
        pendingRestoreSelections.delete(norm);
        li.classList.add('is-inactive');
      }

      renderDeletedList();
    };

    right.addEventListener('click', toggleDeletedMark);
    right.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleDeletedMark();
      }
    });

    li.appendChild(left);
    li.appendChild(right);
    resultList.appendChild(li);

    setTimeout(() => fitUsername(a), 0);
  });
}

function renderDeletedList() {
  if (!deletedList) return;

  deletedList.innerHTML = '';

  const merged = new Set([
    ...confirmedDeletedAccounts,
    ...pendingDeletedSelections
  ]);

  const deletedArray = [...merged].sort((a, b) => a.localeCompare(b));

  if (deletedArray.length === 0) {
    if (deletedHint) deletedHint.style.display = 'none';
    return;
  }

  if (deletedHint && deletedTab && deletedTab.style.display !== 'none') {
    deletedHint.style.display = 'block';
  }

  deletedArray.forEach((user, idx) => {
    const li = document.createElement('li');

    const left = document.createElement('div');
    left.className = 'user-content';

    const a = document.createElement('a');
    a.href = `https://www.instagram.com/${encodeURIComponent(user)}/`;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.textContent = user;
    left.appendChild(a);

    const right = document.createElement('span');
    right.className = 'index';
    right.textContent = idx + 1;
    right.setAttribute('role', 'button');
    right.tabIndex = 0;

    if (pendingRestoreSelections.has(user)) {
      li.classList.add('is-restored');
    }

    const toggleRestoreMark = () => {
      if (pendingRestoreSelections.has(user)) {
        pendingRestoreSelections.delete(user);
        li.classList.remove('is-restored');
      } else {
        pendingRestoreSelections.add(user);
        li.classList.add('is-restored');
      }
    };

    right.addEventListener('click', toggleRestoreMark);
    right.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleRestoreMark();
      }
    });

    li.appendChild(left);
    li.appendChild(right);
    deletedList.appendChild(li);

    setTimeout(() => fitUsername(a), 0);
  });
}

// --- EXPORT / IMPORT ---
function exportDeletedAccounts() {
  const payload = {
    app: 'CuCu',
    version: 1,
    deletedAccounts: [...confirmedDeletedAccounts].sort((a, b) => a.localeCompare(b))
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = T.exportFileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  URL.revokeObjectURL(url);
}

async function importDeletedAccounts(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  try {
    const text = await file.text();
    const parsed = JSON.parse(text);

    const arr = Array.isArray(parsed?.deletedAccounts) ? parsed.deletedAccounts : null;
    if (!arr) {
      alert(T.importInvalid);
      return;
    }

    const normalized = arr
      .map(normalizeUsername)
      .filter(Boolean);

    if (normalized.length === 0) {
      alert(T.importEmpty);
      return;
    }

      confirmedDeletedAccounts = new Set(normalized);
      pendingDeletedSelections.clear();
      pendingRestoreSelections.clear();

      if (importDeletedLabel) {
        importDeletedLabel.textContent = T.filterSelected;
        importDeletedLabel.className = 'button button--gray is-disabled';
        importDeletedLabel.setAttribute('aria-disabled', 'true');
      }

      recomputeAndRenderAll();
      setTimeout(fitActionButtons, 0);
  } catch {
    alert(T.importInvalid);
  } finally {
    if (importDeletedInput) importDeletedInput.value = '';
  }
}

// --- HELPERS (HTML) ---
function extractUsernamesFromHTML(htmlContent) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');

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
      const h2 = card.querySelector('h2');
      if (h2 && h2.textContent) push(h2.textContent);

      const a = card.querySelector('a[href*="instagram.com"]');
      if (a && a.getAttribute('href')) {
        const fromHref = usernameFromHref(a.getAttribute('href'));
        if (fromHref) push(fromHref);
      }
    });
    return out;
  }

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
  let data;
  try { data = JSON.parse(text); } catch { return []; }

  const out = [];
  const seen = new Set();

  for (const item of Array.isArray(data) ? data : []) {
    const sld = Array.isArray(item?.string_list_data) ? item.string_list_data : [];
    const first = sld[0] || {};
    const v = first.value || usernameFromHref(first.href || '');
    const norm = normalizeUsername(v);
    if (norm && !seen.has(norm)) {
      seen.add(norm);
      out.push(norm);
    }
  }
  return out;
}

function extractUsernamesFromFollowingJSON(text) {
  let obj;
  try { obj = JSON.parse(text); } catch { return []; }

  const arr = Array.isArray(obj?.relationships_following) ? obj.relationships_following : [];
  const out = [];
  const seen = new Set();

  for (const item of arr) {
    const title = item?.title;
    const href = item?.string_list_data?.[0]?.href || '';
    const cand = title || usernameFromHref(href);
    const norm = normalizeUsername(cand);

    if (norm && !seen.has(norm)) {
      seen.add(norm);
      out.push(norm);
    }
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
        const href = item?.string_list_data?.[0]?.href || '';
        const title = item?.title || '';
        const cand = value || title || usernameFromHref(href);
        const norm = normalizeUsername(cand);

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

// --- COMMON HELPERS ---
function usernameFromHref(href) {
  try {
    const u = new URL(href, 'https://www.instagram.com/');
    let p = u.pathname.replace(/^\/+|\/+$/g, '');
    if (!p) return null;
    if (p.startsWith('_u/')) p = p.slice(3);
    const first = p.split('/')[0];
    if (!first) return null;
    if (!/^[A-Za-z0-9._]+$/.test(first)) return null;
    return first;
  } catch {
    const m = (href || '').match(/instagram\.com\/(?:_u\/)?([A-Za-z0-9._]+)/i);
    return m ? m[1] : null;
  }
}

function normalizeUsername(s) {
  if (!s) return '';
  return s.replace(/^@+/, '').trim().toLowerCase();
}

function isDeletedPlaceholder(username) {
  return normalizeUsername(username).startsWith('__deleted__');
}

function fitUsername(el) {
  const container = el.parentElement;
  if (!container) return;

  let size = 16;
  el.style.fontSize = `${size}px`;

  while (el.scrollWidth > container.clientWidth && size > 1) {
    size -= 0.5;
    el.style.fontSize = `${size}px`;
  }
}

function fitTotalsLabels() {
  const mainLabels = [
    followersLabel,
    followingLabel,
    notFollowBackLabel
  ].filter(Boolean);

  if (mainLabels.length === 0) return;

  let size = 16;
  mainLabels.forEach(el => el.style.fontSize = `${size}px`);

  const fits = () => mainLabels.every(el => {
    const parent = el.parentElement;
    return parent && el.scrollWidth <= parent.clientWidth;
  });

  while (!fits() && size > 1) {
    size -= 0.5;
    mainLabels.forEach(el => el.style.fontSize = `${size}px`);
  }

  currentTotalsLabelFontSize = size;

  if (deletedTotalLabel) {
    deletedTotalLabel.style.fontSize = `${currentTotalsLabelFontSize}px`;
  }
}

function fitActionButtons() {
  const buttons = actionButtons.filter(el => {
    if (!el) return false;
    return el.offsetParent !== null;
  });

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

// --- INIT ---
applyTranslations();
bindShareLink();
requestAppVersion();

if (mainTab) mainTab.style.display = 'block';
if (deletedTab) deletedTab.style.display = 'none';
if (mainTabBtn) mainTabBtn.classList.add('tab-button--active');
if (deletedTabBtn) deletedTabBtn.classList.remove('tab-button--active');

if (totalsRow) totalsRow.style.display = 'none';
if (deletedTotalsRow) deletedTotalsRow.style.display = 'none';
if (tapHint) tapHint.style.display = 'none';
if (deletedHint) deletedHint.style.display = 'none';

setTimeout(fitActionButtons, 0);
