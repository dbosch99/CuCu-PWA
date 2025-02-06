const fileInput = document.getElementById('fileInput');
const processBtn = document.getElementById('processBtn');
const resetBtn = document.getElementById('resetBtn');
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
        const fileLabel = document.querySelector("label[for='fileInput']");
        fileLabel.textContent = "Uploaded";
        fileLabel.className = 'button gray';
        resetBtn.className = 'button red';
        resetBtn.classList.remove('sbiadito');
    }
});

processBtn.addEventListener('click', async () => {
    const file = fileInput.files[0];
    if (file) {
        try {
            const zip = await JSZip.loadAsync(file);
            const followersFile = zip.file("connections/followers_and_following/followers_1.html");
            const followingFile = zip.file("connections/followers_and_following/following.html");

            if (!followersFile || !followingFile) {
                alert("Required files not found in the ZIP.");
                return;
            }

            const followersContent = await followersFile.async("string");
            const followingContent = await followingFile.async("string");

            followers = extractUsernames(followersContent);
            following = extractUsernames(followingContent);

            const notFollowingBack = following.filter(user => !followers.includes(user));
            displayResults(notFollowingBack);
        } catch (error) {
            alert("An error occurred while processing the file.");
        }
    }
});

resetBtn.addEventListener('click', () => {
    fileInput.value = "";
    processBtn.disabled = true;
    processBtn.className = 'button gray-light sbiadito';
    resetBtn.className = 'button gray-light sbiadito';
    resultTitle.style.display = 'none';
    resultList.innerHTML = '';
    const fileLabel = document.querySelector("label[for='fileInput']");
    fileLabel.textContent = "Select ZIP file";
    fileLabel.className = 'button gray';
});

function extractUsernames(htmlContent) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, "text/html");
    const links = doc.querySelectorAll('a[href^="https://www.instagram.com/"]');
    return Array.from(links).map(link => link.href.split('/')[3]).filter(Boolean);
}

function displayResults(usernames) {
    if (usernames.length === 0) {
        alert("No results to display.");
        return;
    }

    resultTitle.style.display = "block";
    resultCount.textContent = usernames.length;
    resultList.innerHTML = usernames
        .map((user, index) => `<li>${user}<span>${index + 1}</span></li>`)
        .join('');
}