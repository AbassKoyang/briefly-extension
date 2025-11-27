const main = document.querySelector(".main");

function renderLoginUI() {
  main.innerHTML = `
    <div class="login-container">
      <h3>Login to Briefly</h3>
      <button id="googleLogin" class="btn">Login with Google</button>
      <p id="status"></p>
    </div>
  `;

  document.getElementById("googleLogin").onclick = loginWithGoogle;
}

function renderBookmarkUI(user) {
  main.innerHTML = `
    <header>
      <a href="#" class="logo">Briefly</a>
      <span class="profile-con">
        <img class="profile-image" src="${user.photo}" alt="Profile image">
      </span>
    </header>

    <div id="bookmark-container" class="bookmark-container">
      <p>Loading bookmarks...</p>
    </div>

    <div class="container">
      <h3>Add current site to bookmarks</h3>
      <button id="bookmarkButton" class="btn bookmarkButton">Bookmark Page</button>
      <p id="status"></p>
    </div>
  `;

  document.getElementById("bookmarkButton").onclick = bookmarkCurrentPage;
}

async function getUserBookmarks(userId) {
  const container = document.getElementById("bookmark-container");
  try {
    const res = await fetch(`http://localhost:4000/api/bookmarks/${userId}`);
    if (!res.ok) throw new Error("Failed to fetch bookmarks");

    const data = await res.json();
    const bookmarks = data.data;

    container.innerHTML = "";

    if (bookmarks.length === 0) {
      container.innerHTML = `<p class="empty-text">No bookmarks yet</p>`;
      return;
    }

    bookmarks.forEach((bm) => {
      const div = document.createElement("div");
      div.className = "bookmark-item";
      div.innerHTML = `
        <img src="${bm.favicon}" class="favicon">
        <div class="bookmark-info">
          <p class="title">${bm.title}</p>
          <p class="summary">${bm.summary}</p>
        </div>
      `;
      container.appendChild(div);
    });
  } catch (err) {
    container.innerHTML = `<p class="error-text">Failed to load bookmarks</p>`;
    console.error(err);
  }
}

async function bookmarkCurrentPage() {
    const statusEl = document.getElementById("status");
    statusEl.textContent = "Adding bookmark...";
  
    try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tabs || tabs.length === 0) {
          console.log("No active tab found");
          return;
        }
        const tab = tabs[0];
        console.log("Current tab URL:", tab.url);        
        const url = tab.url;
  
      chrome.storage.local.get(["firebaseUid", "firebaseIdToken", "user"], async (data) => {
        if (!data.firebaseUid || !data.firebaseIdToken) {
          statusEl.textContent = "You must be logged in to bookmark.";
          return;
        }
  
        const res = await fetch("http://localhost:4000/api/bookmarks", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${data.firebaseIdToken}`
          },
          body: JSON.stringify({
            url,
            userId: data.firebaseUid
          })
        });
  
        const result = await res.json();
  
        if (!res.ok || !result.success) {
          statusEl.textContent = "Failed to add bookmark.";
          console.error(result);
          return;
        }
        const bookmark = result.data;
  
        statusEl.textContent = "Bookmark added!";
  
        const container = document.getElementById("bookmark-container");
  
        const div = document.createElement("div");
        div.className = "bookmark-item";
        div.innerHTML = `
          <img src="${bookmark.favicon}" class="favicon">
          <div class="bookmark-info">
            <p class="title">${bookmark.title}</p>
            <p class="summary">${bookmark.summary}</p>
          </div>
        `;
        container.prepend(div);
      });
    } catch (err) {
      console.error(err);
      statusEl.textContent = "Error adding bookmark.";
    }
  }
  

chrome.storage.local.get(["firebaseUid", "firebaseIdToken", "user"], (data) => {
  if (data.user) {
    renderBookmarkUI(data.user);
    getUserBookmarks(data.firebaseUid);
  } else {
    renderLoginUI();
  }
});
  
async function loginWithGoogle() {
  const clientId = "56987391225-vvm21g67ovdbq5pvathulvglvo4ca6pn.apps.googleusercontent.com";
  
  const authUrl = 
    "https://accounts.google.com/o/oauth2/auth" +
    `?client_id=${clientId}` +
    "&response_type=token" +
    `&redirect_uri=https://kenfkgmodcbmnopmjnnaehdephcljecg.chromiumapp.org` +
    "&scope=" + encodeURIComponent("openid profile email");

  chrome.identity.launchWebAuthFlow(
    { url: authUrl, interactive: true },
    async (redirectUrl) => {
      if (!redirectUrl) {
        document.getElementById("status").textContent = "Login failed.";
        return;
      }

      const params = new URLSearchParams(redirectUrl.split("#")[1]);
      const googleAccessToken = params.get("access_token");

      if (!googleAccessToken) {
        document.getElementById("status").textContent = "No access token returned.";
        return;
      }

      const firebaseResp = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key=AIzaSyD6TVAIqDQxGEe9rN3-rJRRvVooqT32snI`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            postBody: `access_token=${googleAccessToken}&providerId=google.com`,
            requestUri: 'https://kenfkgmodcbmnopmjnnaehdephcljecg.chromiumapp.org',
            returnIdpCredential: true,
            returnSecureToken: true
          })
        }
      ).then(r => r.json());
      console.log(firebaseResp);

      const firebaseIdToken = firebaseResp.idToken;
      const firebaseUid = firebaseResp.localId;

      if (!firebaseIdToken) {
        document.getElementById("status").textContent = "Firebase login failed.";
        return;
      }

      chrome.storage.local.set({
        firebaseIdToken,
        firebaseUid,
        user: {
          name: firebaseResp.displayName,
          email: firebaseResp.email,
          photo: firebaseResp.photoUrl
        }
      });

      await fetch("http://localhost:4000/api/add-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${firebaseIdToken}`
        },
        body: JSON.stringify({
          uid: firebaseUid,
          name: firebaseResp.displayName,
          email: firebaseResp.email,
          photo: firebaseResp.photoUrl
        })
      });

      document.getElementById("status").textContent =
        `Welcome ${firebaseResp.displayName}`;
    }
  );
}
