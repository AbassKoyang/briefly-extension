const main = document.querySelector(".main");

function renderLoginUI() {
  main.innerHTML = `
    <header>
        <a href="#" class="logo">Briefly</a>
    </header>
    <div class="login-container">
        <h3>Sign in to Briefly</h3>
        <button id="googleLogin" class="btn">Sign in with Google</button>
        <p id="status"></p>
    </div>
  `;

  document.getElementById("googleLogin").onclick = loginWithGoogle;
}

function renderBookmarkUI(user) {
  main.innerHTML = `
    <header>
      <a href="#" class="logo">Briefly</a>
      <span id="profileCon" class="profile-con">
        <img class="profile-image" src="${user.photo}" alt="Profile image">
        <div id="signOutCon" class='sign-out'><button id="signOutBtn" class="sign-out-btn">Sign Out</button></div>
      </span>
    </header>

    <div id="bookmark-container" class="bookmark-container">
    <div class="loading-container">
        <div class="skeleton-bookmark">
                <div class="skeleton-favicon skeleton"></div>
                <div class="skeleton-bookmark-info">
                    <div class="skeleton-title skeleton"></div>
                    <div class="skeleton-text skeleton"></div>
                    <div class="skeleton-text skeleton"></div>
                    <div class="skeleton-text skeleton"></div>
                </div>
        </div>    
        <div class="skeleton-bookmark">
                <div class="skeleton-favicon skeleton"></div>
                <div class="skeleton-bookmark-info">
                    <div class="skeleton-title skeleton"></div>
                    <div class="skeleton-text skeleton"></div>
                    <div class="skeleton-text skeleton"></div>
                    <div class="skeleton-text skeleton"></div>
                </div>
        </div>    
        <div class="skeleton-bookmark">
                <div class="skeleton-favicon skeleton"></div>
                <div class="skeleton-bookmark-info">
                    <div class="skeleton-title skeleton"></div>
                    <div class="skeleton-text skeleton"></div>
                    <div class="skeleton-text skeleton"></div>
                    <div class="skeleton-text skeleton"></div>
                </div>
        </div>    
        <div class="skeleton-bookmark">
                <div class="skeleton-favicon skeleton"></div>
                <div class="skeleton-bookmark-info">
                    <div class="skeleton-title skeleton"></div>
                    <div class="skeleton-text skeleton"></div>
                    <div class="skeleton-text skeleton"></div>
                    <div class="skeleton-text skeleton"></div>
                </div>
        </div>    
        <div class="skeleton-bookmark">
                <div class="skeleton-favicon skeleton"></div>
                <div class="skeleton-bookmark-info">
                    <div class="skeleton-title skeleton"></div>
                    <div class="skeleton-text skeleton"></div>
                    <div class="skeleton-text skeleton"></div>
                    <div class="skeleton-text skeleton"></div>
                </div>
        </div>    
        <div class="skeleton-bookmark">
                <div class="skeleton-favicon skeleton"></div>
                <div class="skeleton-bookmark-info">
                    <div class="skeleton-title skeleton"></div>
                    <div class="skeleton-text skeleton"></div>
                    <div class="skeleton-text skeleton"></div>
                    <div class="skeleton-text skeleton"></div>
                </div>
        </div>    
        <div class="skeleton-bookmark">
                <div class="skeleton-favicon skeleton"></div>
                <div class="skeleton-bookmark-info">
                    <div class="skeleton-title skeleton"></div>
                    <div class="skeleton-text skeleton"></div>
                    <div class="skeleton-text skeleton"></div>
                    <div class="skeleton-text skeleton"></div>
                </div>
        </div>    
    </div>
    </div>

    <div class="container">
      <button id="bookmarkButton" class="btn bookmarkButton">Bookmark Current Page</button>
      <p id="status"></p>
    </div>
  `;

  document.getElementById("bookmarkButton").onclick = bookmarkCurrentPage;
  function showSignOutButton() {
    document.getElementById("signOutCon").classList.toggle('show-sign-out');
  }
  const profileCon = document.getElementById("profileCon");
  console.log(profileCon);

  profileCon.addEventListener('click', showSignOutButton)
}

async function getUserBookmarks(userId) {
  const container = document.getElementById("bookmark-container");
  try {
    const res = await fetch(`https://briefly-backend-vriy.onrender.com/api/bookmarks/${userId}`);
    if (!res.ok) throw new Error("Failed to fetch bookmarks");

    const data = await res.json();
    const bookmarks = data.data.bookmarks;
    console.log(bookmarks);

    container.innerHTML = "";

    if (bookmarks.length === 0) {
      container.innerHTML = `
          <div class="loading-container"><p class="empty-text">No bookmarks yet</p></div>`;
      return;
    }

    bookmarks.forEach((bm) => {
      const div = document.createElement("div");
      div.onclick = () => openUrl(bm.url);
      div.className = "bookmark-item";
      div.innerHTML = `
        <div class="favicon-con">
                <img src="${bm.favicon}" class="favicon">
        </div>
        <div class="bookmark-info">
          <p class="title">${bm.title.length >  25 ? bm.title.substring(0, 25) + '...' : bm.title}</p>
          <p class="summary">${bm.summary.length >  100 ? bm.summary.substring(0, 100) + '...' : bm.summary}</p>
        </div>
      `;
      container.appendChild(div);
    });
  } catch (err) {
    container.innerHTML = `<div class="loading-container"><p class="error-text">Failed to load bookmarks.</p></div>`
    console.error(err);
  }
}

async function bookmarkCurrentPage() {
    const statusEl = document.getElementById("status");
    const bookmarkButton = document.getElementById("bookmarkButton");
    bookmarkButton.textContent = "Bookmarking page...";
  
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
  
        const res = await fetch("https://briefly-backend-vriy.onrender.com/api/bookmarks", {
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
            bookmarkButton.textContent = "Bookmark current page";
          statusEl.textContent = "Failed to bookmark page.";
          setTimeout(()=> {
            statusEl.textContent = "";
        }, 3000)
          console.error(result);
          return;
        }
        const bookmark = result.data;

        bookmarkButton.textContent = "Bookmark current page";
        statusEl.textContent = "Bookmark added!";
        setTimeout(()=> {
            statusEl.textContent = "";
        }, 3000)
  
        const container = document.getElementById("bookmark-container");
  
        const div = document.createElement("div");
        div.onclick = () => openUrl(bookmark.url);
        div.className = "bookmark-item";
        div.innerHTML = `
          <div class="favicon-con">
                <img src="${bookmark.favicon}" class="favicon">
            </div>
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
    document.getElementById("googleLogin").textContent = "Signing in....";
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
        document.getElementById("googleLogin").textContent = "Sign in with Goggle"
        return;
      }

      const params = new URLSearchParams(redirectUrl.split("#")[1]);
      const googleAccessToken = params.get("access_token");

      if (!googleAccessToken) {
        document.getElementById("googleLogin").textContent = "Sign in with Goggle"
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
        document.getElementById("googleLogin").textContent = "Sign in with Goggle"
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

      await fetch("https://briefly-backend-vriy.onrender.com/api/add-user", {
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

      document.getElementById("googleLogin").textContent = "Sign in with Goggle"
      document.getElementById("status").textContent =
        `Welcome ${firebaseResp.displayName}`;
        location.reload();
    }
  );
}

document.addEventListener("click", (e) => {
    if (e.target.id === "signOutBtn") {
      signOutUser();
    }
  });
  
  function signOutUser() {
    chrome.storage.local.remove(
      ["firebaseUid", "firebaseIdToken", "user"],
      () => {
        console.log("User signed out.");
        location.reload();
      }
    );
  }

  function showSignOutButton() {
    document.getElementById("signOutCon").style.display = 'flex';
  }
  const profileCon = document.getElementById("profileCon");
  console.log(profileCon);

  profileCon.addEventListener('click', showSignOutButton)

  function openUrl(url) {
    chrome.tabs.create({ url });
  }  
  
