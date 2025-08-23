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

      const notFollowingBack = following.filter(user => !followers.includes(user));
      displayResults(notFollowingBack, pending);
    } catch (error) {
      alert('An error occurred while processing the file.');
      console.error(error);
    }
  }
});

// --- REFRESH (solo reload, perché update del SW è automatico) ---
refreshBtn.addEventListener('click', () => {
  window.location.reload();
});

// --- HELPERS ---
function extractUsernames(htmlContent) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');
  const links = doc.querySelectorAll('a[href^="https://www.instagram.com/"]');
  return Array.from(links).map(link => link.href.split('/')[3]).filter(Boolean);
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

  pending.forEach((user, index) => {
    const li = document.createElement('li');
    li.innerHTML = `<div class="user-content">${user} <b>(WAITING)</b></div><span>${index + 1}</span>`;
    resultList.appendChild(li);
  });

  notFollowingBack.forEach((user, index) => {
    const li = document.createElement('li');
    li.innerHTML = `<div class="user-content">${user}</div><span>${pending.length + index + 1}</span>`;
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
