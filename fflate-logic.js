import { unzipSync, strFromU8 } from 'https://cdn.jsdelivr.net/npm/fflate@0.8.1/esm/index.js';

const fileInput = document.getElementById('fileInput');
const processBtn = document.getElementById('processBtn');
const refreshBtn = document.getElementById('refreshBtn');
const fileLabel = document.getElementById('fileLabel');
const resultTitle = document.getElementById('resultTitle');
const resultCount = document.getElementById('resultCount');
const resultList = document.getElementById('resultList');

let zipFile = null;

fileInput.addEventListener('change', () => {
    if (fileInput.files.length > 0) {
        zipFile = fileInput.files[0];
        processBtn.disabled = false;
        processBtn.classList.remove('sbiadito');
        processBtn.className = 'button blue';
        fileLabel.textContent = "Uploaded";
        fileLabel.className = 'button gray sbiadito';
    }
});

processBtn.addEventListener('click', async () => {
    if (!zipFile) return;

    processBtn.disabled = true;
    processBtn.className = 'button gray-light sbiadito';

    const arrayBuffer = await zipFile.arrayBuffer();
    const zipData = new Uint8Array(arrayBuffer);

    try {
        const files = unzipSync(zipData);

        let followers = null;
        let following = null;
        let pending = null;

        for (const name in files) {
            const lower = name.toLowerCase();
            if (lower.endsWith("followers_1.html") && !lower.includes("__macosx") && !lower.includes("._")) {
                followers = strFromU8(files[name]);
            } else if (lower.endsWith("following.html") && !lower.includes("__macosx") && !lower.includes("._")) {
                following = strFromU8(files[name]);
            } else if (lower.endsWith("pending_follow_requests.html") && !lower.includes("__macosx") && !lower.includes("._")) {
                pending = strFromU8(files[name]);
            }
        }

        if (!followers || !following) {
            alert("Required files not found in the ZIP.");
            return;
        }

        const followersList = extractUsernames(followers);
        const followingList = extractUsernames(following);
        const pendingList = pending ? extractUsernames(pending) : [];

        const notFollowingBack = followingList.filter(user => !followersList.includes(user));
        displayResults(notFollowingBack, pendingList);
    } catch (error) {
        console.error("Errore FFLATE:", error);
        alert("Questo ZIP non è compatibile o è corrotto.");
    }
});

refreshBtn.addEventListener('click', () => window.location.reload());

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