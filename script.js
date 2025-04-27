const fileInput = document.getElementById('fileInput');
const processBtn = document.getElementById('processBtn');
const refreshBtn = document.getElementById('refreshBtn');
const fileLabel = document.getElementById('fileLabel');
const resultTitle = document.getElementById('resultTitle');
const resultCount = document.getElementById('resultCount');
const resultList = document.getElementById('resultList');

let followers = [];
let following = [];

fileInput.addEventListener('change', () => {
    if (fileInput.files.length > 0) {
        processBtn.disabled = false;
        processBtn.className = 'button blue';
        processBtn.classList.remove('sbiadito');
        fileLabel.textContent = "Uploaded";
        fileLabel.className = 'button gray';
    }
});

processBtn.addEventListener('click', async () => {
    const file = fileInput.files[0];
    if (file) {
        try {
            const zip = await JSZip.loadAsync(file);
            let followersFile = null;
            let followingFile = null;
            let pendingFile = null;

            zip.forEach((relativePath, file) => {
                const lowerPath = relativePath.toLowerCase();
                if (lowerPath.endsWith("followers_1.html") && !lowerPath.includes("__macosx") && !lowerPath.includes("._")) {
                    followersFile = file;
                } else if (lowerPath.endsWith("following.html") && !lowerPath.includes("__macosx") && !lowerPath.includes("._")) {
                    followingFile = file;
                } else if (lowerPath.endsWith("pending_follow_requests.html") && !lowerPath.includes("__macosx") && !lowerPath.includes("._")) {
                    pendingFile = file;
                }
            });

            if (!followersFile || !followingFile) {
                alert("Required files not found in the ZIP.");
                return;
            }

            const followersContent = await followersFile.async("string");
            const followingContent = await followingFile.async("string");
            const pendingContent = pendingFile ? await pendingFile.async("string") : null;

            followers = extractUsernames(followersContent);
            following = extractUsernames(followingContent);
            const pending = pendingContent ? extractUsernames(pendingContent) : [];

            const notFollowingBack = following.filter(user => !followers.includes(user));
            displayResults(notFollowingBack, pending);
        } catch (error) {
            alert("An error occurred while processing the file.");
        }
    }
});

refreshBtn.addEventListener('click', () => {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistration().then(registration => {
            if (registration) {
                registration.unregister().then(() => {
                    return caches.keys();
                }).then(cacheNames => {
                    return Promise.all(cacheNames.map(name => caches.delete(name)));
                }).then(() => {
                    console.log("Service Worker unregistered and cache cleared. Reloading...");
                    window.location.reload(true);
                }).catch(error => {
                    console.error("Error during refresh:", error);
                    window.location.reload(true);
                });
            } else {
                window.location.reload(true);
            }
        }).catch(error => {
            console.error("Error accessing Service Worker:", error);
            window.location.reload(true);
        });
    } else {
        window.location.reload(true);
    }
});

function extractUsernames(htmlContent) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, "text/html");
    const links = doc.querySelectorAll('a[href^="https://www.instagram.com/"]');
    return Array.from(links).map(link => link.href.split('/')[3]).filter(Boolean);
}

function displayResults(notFollowingBack, pending) {
    const totalResults = notFollowingBack.length + pending.length;

    if (totalResults === 0) {
        alert("No results to display.");
        return;
    }

    resultTitle.style.display = "block";
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
