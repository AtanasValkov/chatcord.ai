export function populateGrid(
  characters = [],
  filters = {
    includeTags: [],
    excludeTags: [],
    showDetails: true,
    accessLevel: '',
    reviewMode: false
  }
) {
  const grid = document.getElementById("characterGrid");
  if (!grid) {
    console.error('Grid container not found');
    return;
  }

  // Clear existing content safely
  grid.replaceChildren();

  // Validate and normalize input
  const safeCharacters = Array.isArray(characters) ? characters : [];
  if (safeCharacters.length === 0) {
    grid.innerHTML = `<div class="empty-state">No characters to display</div>`;
    return;
  }

  // Prepare DOM fragment for batch insertion
  const fragment = document.createDocumentFragment();

  safeCharacters.forEach(character => {
    try {
      if (!isValidCharacter(character)) {
        console.warn('Skipping invalid character:', character);
        return;
      }

      if (shouldSkipCharacter(character, filters)) {
        return;
      }

      const card = createCharacterCard(character, filters);
      fragment.appendChild(card);
    } catch (error) {
      console.error('Error rendering character:', error, character);
    }
  });

  // Insert all cards at once
  grid.appendChild(fragment);
}

// Validation utilities
const REQUIRED_CHARACTER_FIELDS = ['id', 'char_name', 'tags', 'review_status'];
const isValidCharacter = (char) => 
  REQUIRED_CHARACTER_FIELDS.every(field => field in char);

function shouldSkipCharacter(character, filters) {
  const { includeTags = [], excludeTags = [] } = filters;
  
  // Check excluded tags
  if (excludeTags.length > 0 && 
      character.tags.some(tag => excludeTags.includes(tag))) {
    return true;
  }

  // Check included tags
  if (includeTags.length > 0 && 
      !character.tags.some(tag => includeTags.includes(tag))) {
    return true;
  }

  return false;
}

function createCharacterCard(character, filters) {
  const card = document.createElement('div');
  card.className = `character ${filters.reviewMode ? 'review-mode' : ''}`;
  card.dataset.characterId = character.id;
  card.innerHTML = buildCardHTML(character, filters);

  addCardInteractions(card, character, filters);
  return card;
}

function buildCardHTML(character, filters) {
  const isPendingReview = character.review_status === 'pending';
  const hasFeedback = character.review_status === 'request_changes';
  const metrics = buildMetricsHTML(character);
  const tags = buildTagsHTML(character.tags);
  const buttons = buildButtonsHTML(character, filters);

  return `
    <div class="character-card">
      ${hasFeedback ? '<span class="feedback-badge">⚠️ Feedback</span>' : ''}
      <img class="character-img" 
           src="${character.char_url || 'placeholder.jpg'}" 
           alt="${character.char_name}"
           loading="lazy"
           decoding="async">
      <h2>${character.char_name}</h2>
      ${metrics}
      ${tags}
      ${buttons || ''}
    </div>
  `;
}

function buildMetricsHTML(character) {
  return `
    <div class="character-metrics">
      <span title="Downloads">${character.downloads} ⬇️</span>
      <span title="Favorites">${character.favorites} ❤️</span>
      <span title="Rating">${character.likes - character.dislikes} 👍</span>
      <span title="Comments">${character.comments} 💬</span>
    </div>
  `;
}

function buildTagsHTML(tags = []) {
  const safeTags = Array.isArray(tags) ? tags.slice(0, 6) : [];
  return `
    <div class="tags">
      ${safeTags.map(tag => `<span class="tag">${tag}</span>`).join('')}
    </div>
  `;
}

function buildButtonsHTML(character, filters) {
  if (filters.reviewMode) {
    return `
      <div class="card-actions">
        <button class="review-btn" aria-label="Review character">Review</button>
      </div>
    `;
  }
  
  if (!filters.showDetails) {
    const needsAttention = character.review_status === "request_changes" ? 'attention' : '';
    return `
      <div class="card-actions">
        <button class="edit-btn ${needsAttention}" aria-label="Edit character">Edit</button>
        <button class="delete-btn" aria-label="Delete character">Delete</button>        
        <button class="share-btn" aria-label="Share Link">Share</button>
      </div>
    `;
  }
  
  return ''; // Explicit return for empty case
}

function addCardInteractions(card, character, filters) {
  // Click handler for card
  if (filters.showDetails) {
    card.addEventListener('click', (event) => {
      if (!event.target.closest('button')) {
        showCharacterDetails(character);
      }
    });
  }

  // Always handle review mode buttons regardless of showDetails
  if (filters.reviewMode) {
    const reviewBtn = card.querySelector('.review-btn');
    if (filters.accessLevel === "admin" || filters.accessLevel === "moderator") {
      reviewBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        reviewCharacter(character.id);
      });
    } else {
      reviewBtn.disabled = true;
      reviewBtn.textContent = "In Review";
    }
    return; // Exit early after handling review mode
  }

  // Handle edit/delete buttons only in non-review mode
  if (!filters.showDetails) {
    const deleteBtn = card.querySelector('.delete-btn');
    const editBtn = card.querySelector('.edit-btn');
    const shareBtn2 = card.querySelector('.share-btn');
    
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteCharacter(character.id);
    });

    editBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      editCharacter(character.id);
    });

    shareBtn2.addEventListener('click', (e) => {
      e.stopPropagation();
      shareCharacter(character);
    });
  }
}

function showCharacterDetails(character) {
    // Remove existing details panel if it exists
    const existingPanel = document.getElementById("detailsPanel");
    if (existingPanel) {
        existingPanel.remove();
    }

    // Activate overlay to click off from display
    const overlay = document.getElementById('overlay');
    overlay.classList.toggle('active');


    // Create main panel div
    const detailsPanel = document.createElement("div");
    detailsPanel.classList.add("details-panel");
    detailsPanel.id = "detailsPanel";

    // Create close button
    const closeButton = document.createElement("span");
    closeButton.classList.add("close-button");
    closeButton.innerHTML = "&times;";
    closeButton.addEventListener("click", () => {
        detailsPanel.remove();
        overlay.classList.remove("active");
    });

    // Append close button to details panel
    detailsPanel.appendChild(closeButton);

    // Create image element
    const characterImage = document.createElement("img");
    characterImage.id = "characterImage";
    characterImage.src = character.char_url || "";
    characterImage.alt = character.char_name;

    // Create details panel like div
    const detailsPanelLike = document.createElement("div");
    detailsPanelLike.classList.add("details-panel-like");

    // Create character name element
    const characterName = document.createElement("h2");
    characterName.id = "characterName";
    characterName.innerText = character.char_name || "Default Name";

    // 0) Grab the current user & charID
    const user   = JSON.parse(localStorage.getItem("user"));
    
    // 1) Create the buttons
    const favoriteBtn   = document.createElement("span");
    const thumbsUpBtn   = document.createElement("span");
    const thumbsDownBtn = document.createElement("span");
    
    favoriteBtn.classList.add("favorite");     favoriteBtn.innerHTML   = '<i class="fas fa-heart"></i>';
    thumbsUpBtn.classList.add("thumbs-up");    thumbsUpBtn.innerHTML   = '<i class="fas fa-thumbs-up"></i>';
    thumbsDownBtn.classList.add("thumbs-down"); thumbsDownBtn.innerHTML = '<i class="fas fa-thumbs-down"></i>';
    
    // 2) Load server state on initial render
    if (user) {
      fetch("https://chatcord-server.onrender.com/get-interactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, character_id: character.id })
      })
        .then(res => res.json())
        .then(({ interactions }) => {
          if (interactions.includes("favorite")) favoriteBtn.classList.add("active");
          if (interactions.includes("like"))     thumbsUpBtn.classList.add("active");
          if (interactions.includes("dislike"))  thumbsDownBtn.classList.add("active");
        })
        .catch(err => console.error("Failed to load interactions:", err));
    }
    
    // 3) Debounce helper that only fires if initial≠final
    function makeDebouncedToggle(btn, oppositeBtn, interactionOn, interactionOff) {
      btn.addEventListener("click", event => {
        event.stopPropagation();
        if (!user) { showToast("Please log in…"); return; }
    
        // Capture initial state once per burst
        if (btn._initialState === undefined) {
          btn._initialState = btn.classList.contains("active");
        }
    
        // Flip UI immediately
        const nowOn = btn.classList.toggle("active");
        if (oppositeBtn) oppositeBtn.classList.remove("active");
    
        // Debounce the API call
        clearTimeout(btn._timeout);
        btn._timeout = setTimeout(() => {
          const initial = btn._initialState;
          const final   = btn.classList.contains("active");
    
          if (initial !== final) {
            const type = final ? interactionOn : interactionOff;
            fetch("https://chatcord-server.onrender.com/interact", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                user_id:          user.id,
                character_id:     character.id,
                interaction_type: type
              })
            }).catch(err => console.error(`${interactionOn} error:`, err));
          }
    
          // Reset for next burst
          delete btn._initialState;
        }, 1000);
      });
    }
    
    // 4) Wire up each button
    makeDebouncedToggle(favoriteBtn,   null,            "favorite",  "unfavorite");
    makeDebouncedToggle(thumbsUpBtn,   thumbsDownBtn,   "like",      "unlike");
    makeDebouncedToggle(thumbsDownBtn, thumbsUpBtn,     "dislike",   "undislike");

    // Create share button
    const shareBtn = document.createElement("span");
    shareBtn.classList.add("share");
    shareBtn.id = "shareBtn";
    shareBtn.innerHTML = '<i class="fas fa-share-alt"></i>';
    
    shareBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        shareCharacter(character);
    });

(function() {
    fetch(`https://chatcord-server.onrender.com/get-user/${user?.id}`)
      .then(res => res.json())
      .then(({ user: userData }) => {
        const accessLevel = userData.access_level?.toLowerCase();
        const container = detailsPanelLike; // your panel element
    
        container.append(characterName, favoriteBtn, thumbsUpBtn, thumbsDownBtn, shareBtn);
    
        if (["admin","moderator"].includes(accessLevel)) {
          const modBtn = document.createElement("button");
          modBtn.innerText = "MOD";
          modBtn.onclick = () => reviewCharacter(character.id);
          container.append(modBtn);
        }
      })
      .catch(err => console.error("Failed to fetch user info:", err));
})();

    detailsPanel.appendChild(characterImage);
    detailsPanel.appendChild(detailsPanelLike);

    // Create description element
    const characterDesc = document.createElement("p");
    characterDesc.id = "characterDesc";
    characterDesc.innerText = character.description || "No description available.";
    detailsPanel.appendChild(characterDesc);

    // Create tag container
    const tagContainer = document.createElement("div");
    tagContainer.id = "characterTags";
    tagContainer.classList.add("tags");
    detailsPanel.appendChild(tagContainer);

    // Ensure tags is a valid array before looping
    if (Array.isArray(character.tags)) {
        character.tags.forEach(tag => {
            let tagElement = document.createElement("span");
            tagElement.classList.add("tag");
            tagElement.textContent = tag;
            tagContainer.appendChild(tagElement);
        });
    } else {
        console.warn("Tags is missing or not an array:", character.tags);
    }
    // Create details panel madeBy container
    const detailsPanelMadeBy = document.createElement("div");
    detailsPanelMadeBy.classList.add("details-panel-madeBy");
    detailsPanelMadeBy.id = "details-panel-madeBy";

    // Create 'Create Bot' button
    const createBotButton = document.createElement("button");
    createBotButton.innerText = "Load Character";
    createBotButton.onclick = function() {
        createBot(character.id);
    };
    detailsPanelMadeBy.appendChild(createBotButton);

    // Create uploader info container
    const madeByDiv = document.createElement("div");
    madeByDiv.classList.add("madeBy");
    madeByDiv.id = "madeBy";
    // Default to username first
    let uploaderName = character.username;
    // Fetch displayname from backend
    fetch(`https://chatcord-server.onrender.com/get-displayname/${encodeURIComponent(character.username)}`)
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch displayname");
        return res.json();
      })
      .then(data => {
        if (data.displayname) {
          uploaderName = data.displayname;
        }
      })
      .catch(err => {
        console.warn("Using username fallback because displayname fetch failed:", err);
      })
      .finally(() => {
        // Render the HTML after we know which name to use
        madeByDiv.innerHTML = `
          <a href="profile.html?u=${encodeURIComponent(character.userID)}" 
             style="text-decoration: none;display: flex;color: inherit;align-items: anchor-center;">
            <p style="margin: 0 10px;">Uploaded by <strong>${uploaderName}</strong></p>
            <img src="https://cdn.discordapp.com/avatars/${character.userID}/${character.avatar}.png"
                 alt="Avatar" style="width: 50px; height: 50px; border-radius: 50%;">
          </a>
        `;
        detailsPanelMadeBy.appendChild(madeByDiv);    
        detailsPanel.appendChild(detailsPanelMadeBy);
      });

    const detailsPanelPlace = document.getElementById("detailsPanelPlace");
    // Append to body or another container
    detailsPanelPlace.appendChild(detailsPanel);
}

// Functions for profile page
function editCharacter(characterId) {
    window.location.href = `edit-character.html?id=${encodeURIComponent(characterId)}`;
}

function reviewCharacter(characterId) {
    window.location.href = `review.html?id=${encodeURIComponent(characterId)}`;
}

function deleteCharacter(characterId) {
  if (confirm('Are you sure you want to delete this character?')) {
    const user = JSON.parse(localStorage.getItem("user"));
    fetch("https://chatcord-server.onrender.com/delete_character", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: characterId, userID: user.id })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        showToast('Character deleted successfully.');
        const card = document.querySelector(`[data-character-id="${characterId}"]`);
        if (card) card.remove();
      } else {
        showToast("Error: " + (data.error || "Unknown error"));
      }
    })
    .catch(err => {
      showToast('Error deleting character.');
      console.error(err);
    });
  }
}

function shareCharacter(character) {
  // Get current page filename (e.g. "index.html" or "profile.html")
  const currentPage = window.location.pathname.split("/").pop();
  
  let shareLink;
  
  if (currentPage === "profile.html") {
      // profile page → add both charID and userID
      shareLink = `${window.location.origin}/profile.html?u=${encodeURIComponent(character.userID)}&charID=${character.id}`;
  } else {
      // fallback for index.html (or any other page)
      shareLink = `${window.location.origin}/index.html?charID=${character.id}`;
  }
  
  // Copy to clipboard
  navigator.clipboard.writeText(shareLink).then(() => {
      showToast("Character link copied!");
  }).catch(err => {
      console.error("Failed to copy text: ", err);
      showToast("Failed to copy link.");
  });
}

// Function to hide details panel
export function hideDetails() {
    document.getElementById('detailsPanel').style.display = 'none';
}

// Debounce function definition
function debounce(func, delay) {
    let timer;
    return function() {
        if (timer) clearTimeout(timer); // Clear the previous timer if it exists
        timer = setTimeout(() => {
            func.apply(this, arguments); // Execute the function after the delay
        }, delay);
    };
}

export async function createBot(id) {
    document.querySelectorAll(".close").forEach(btn => {
        btn.addEventListener("click", closeModal);
    });

    // Check if it's a UUID using regex
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  
    if (isUUID) {
      // process UUID logic here
      worldbookId = id;
    } else if (/^\d+$/.test(id)) {
      // process numeric ID logic here
      currentCharId = id;
    } else {
      throw new Error('Invalid ID format');
    }

    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) {
        showToast("Please log in to add characters to your server.")
        return
    }
    const userId = user.id;
    let guilds = [];
    try {
        guilds = await fetchGuilds(userId);
    } catch (err) {
        showToast("Failed to load guilds: " + err.message);
        return;
    }

    const guildSelect = document.getElementById("guild-select");
    const favoriteGuildId = localStorage.getItem("favoriteGuildId");
    const forceRefreshBtn = document.getElementById("force-refresh-channels");
    const channelSelect = document.getElementById("channel-select");        
    const loadButton = document.getElementById("create-webhook-btn");
    loadButton.removeEventListener("click", handleCreateWebhookClick);
    forceRefreshBtn.disabled = true;
    forceRefreshBtn.onclick = null;
    channelSelect.disabled = true;
    channelSelect.innerHTML = '<option value="">Select a Channel</option>';
    
    if (favoriteGuildId) {
        guilds.sort((a, b) => {
            if (a.guild_id === favoriteGuildId) return -1;
            if (b.guild_id === favoriteGuildId) return 1;
            return 0;
        });
    }

    guildSelect.innerHTML = '<option value="">Select a Server</option>';
    guilds.forEach(guild => {
        const option = document.createElement("option");
        option.value = guild.guild_id;
        option.textContent = guild.name;
        guildSelect.appendChild(option);
    });
    guildSelect.disabled = false;

    // When user selects a server, fetch channels for that server
    document.getElementById("guild-select").addEventListener("change", async function() {
        const guildId = this.value;
        const channelSelect = document.getElementById("channel-select");        
        const loadButton = document.getElementById("create-webhook-btn");
        loadButton.removeEventListener("click", handleCreateWebhookClick);
        forceRefreshBtn.disabled = true;
        forceRefreshBtn.onclick = null;
        channelSelect.disabled = true;
        channelSelect.innerHTML = '<option value="">Select a Channel</option>';
        loadButton.disabled = true;
        
        if (!guildId) return;
        
        // Abort any previous request
        if (window.fetchController) {
            window.fetchController.abort();
        }
        window.fetchController = new AbortController();
        const signal = window.fetchController.signal;
        
        try {
            const botInGuild = await isBotInGuild(guildId, signal);
            if (botInGuild) {
              let data;
              if (isUUID) {
                data = await fetchChannels(guildId, signal, { forceRefresh: false, skippingWebhookLimit: true });
              } else {
                data = await fetchChannels(guildId, signal, { forceRefresh: false, skippingWebhookLimit: false });
              }
              if (Array.isArray(data.channels)) {
                  channelSelect.innerHTML = '<option value="">Select a Channel</option>'; // Clear again to avoid duplicates
                  data.channels.forEach(channel => {
                      const option = document.createElement("option");
                      option.value = channel.channel_id;
                      option.textContent = channel.name;
                      channelSelect.appendChild(option);
                  });
                  channelSelect.disabled = false;
                  forceRefreshBtn.disabled = false;
                  forceRefreshBtn.onclick = async function () {
                      try {
                        let refreshed;
                        if (isUUID) {
                          refreshed = await fetchChannels(guildId, signal, { forceRefresh: true, skippingWebhookLimit: true });
                        } else {
                          refreshed = await fetchChannels(guildId, signal, { forceRefresh: true, skippingWebhookLimit: false });
                        }
                          if (Array.isArray(refreshed.channels)) {
                              channelSelect.innerHTML = '<option value="">Select a Channel</option>';
                              refreshed.channels.forEach(channel => {
                                  const option = document.createElement("option");
                                  option.value = channel.id; // Refreshed channels come from Discord with .id instead of .channel_id
                                  option.textContent = channel.name;
                                  channelSelect.appendChild(option);
                              });
                          }
                      } catch (err) {
                          showToast("Force refresh failed: " + err.message);
                      }
                  };
              }
            } else {
                promptToAddBot(guildId);
            }
        } catch (error) {
            if (error.name !== 'AbortError') {
                showToast("Failed to fetch channels: " + error);
            }
        }
    });

    document.getElementById("refresh-guilds").addEventListener("click", async () => {
        try {
            const user = JSON.parse(localStorage.getItem("user"));
            const userId = user.id;
            const guilds = await fetchGuilds(userId, true);
    
            const guildSelect = document.getElementById("guild-select");
            guildSelect.innerHTML = '<option value="">Select a Server</option>';
            guilds.forEach(guild => {
                const option = document.createElement("option");
                option.value = guild.guild_id;
                option.textContent = guild.name;
                guildSelect.appendChild(option);
            });

            guildSelect.disabled = false;
            guildSelect.dispatchEvent(new Event("change"));
        } catch (err) {
            showToast("Failed to refresh guilds: " + err.message);
        }
    });


    // When user selects a channel, enable load character button
    document.getElementById("channel-select").addEventListener("change", async function() {
        const loadButton = document.getElementById("create-webhook-btn");
        const channelId = this.value;
        // Attach the event listener
        loadButton.addEventListener("click", handleCreateWebhookClick);

        forceRefreshBtn.disabled = true;
        forceRefreshBtn.onclick = null;

        loadButton.disabled = !channelId;
    });

    // If there is a favorite guild, set it as selected
    if (favoriteGuildId) {
        guildSelect.value = favoriteGuildId;
        guildSelect.dispatchEvent(new Event("change"));
    }
    
    // Show modal
    document.getElementById("modal").style.display = "block";
}

// Global variable to store the current character id:
let currentCharId = null;
let worldbookId = null;

async function handleCreateWebhookClick() {
    const guildId = document.getElementById("guild-select").value;
    const channelId = document.getElementById("channel-select").value;

    if (guildId && channelId) {
        try {
            if (currentCharId) {
              // Proceed with creating the webhook
              createWebhook(channelId, currentCharId);
            } else {
              // Proceed with loading the worldbook
              loadWorldbook(channelId, worldbookId);
            }
        } catch (error) {
            showToast("Failed: " + error);
        }
    }
}

// Create the webhook in the selected channel
async function loadWorldbook(channelId, worldbookId) {
    const user = JSON.parse(localStorage.getItem("user"));
    const response = await fetch('https://chatcord-server.onrender.com/load-worldbook', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            channel_id: channelId,
            worldbook_id: worldbookId,
            user_id: user.id,
        })
    });

    const responseData = await response.json();
    console.log("Response Data:", responseData);
    if (response.ok) {
        showToast(responseData.message);
        closeModal();
    } else {
        showToast("Error: " + responseData.error);
    }
}

// Create the webhook in the selected channel
async function createWebhook(channelId, characterId) {
    const user = JSON.parse(localStorage.getItem("user"));
    const response = await fetch('https://chatcord-server.onrender.com/create-webhook', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            channel_id: channelId,
            character_id: characterId,
            user_id: user.id,
        })
    });

    const responseData = await response.json();
    console.log("Response Data:", responseData);  
    if (response.ok) {
        // ✅ Interact call to increment 'downloads'
        await fetch('https://chatcord-server.onrender.com/interact', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_id: user.id,
                character_id: characterId,
                interaction_type: "download"
            })
        });
        showToast(responseData.message);
        closeModal();
    } else {
        showToast("Error: " + responseData.error);
    }
}

async function isBotInGuild(guildId, signal) {
    const response = await fetch(`https://chatcord-server.onrender.com/guilds/${guildId}/is-bot-member`, { signal });
    if (!response.ok) throw new Error("Failed to verify bot presence");
    const { isBotInGuild } = await response.json();
    return isBotInGuild;
}

// Prompt the user to add the bot to the server
export function promptToAddBot(guildId) {
    const addBotUrl = `https://discord.com/oauth2/authorize?client_id=1352038053757190206&scope=bot&permissions=536882176&guild_id=${guildId}`;
    showToast("The bot is not in this guild. Please add the bot to the guild.");
    window.open(addBotUrl, '_blank');
    const channelSelect = document.getElementById("channel-select");        
    const guildSelect = document.getElementById("guild-select");    
    
    channelSelect.disabled = true;
    channelSelect.innerHTML = '<option value="">Select a Channel</option>';
    guildSelect.innerHTML = '<option value="">Select a Server</option>';
    closeModal();
}

export async function fetchGuilds(userId, forceRefresh = false) {
    const url = `https://chatcord-server.onrender.com/user/${userId}/guilds${forceRefresh ? '?force_refresh=true' : ''}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("Log out and back in!");
    const data = await response.json();
    return data.guilds;
}

// Fetch channels for a specific server (guild) using access_token
export async function fetchChannels(guildId, signal, { forceRefresh = false, skippingWebhookLimit = false } = {}) {
    const params = new URLSearchParams();
    if (forceRefresh) params.append("force_refresh", "true");
    if (skippingWebhookLimit) params.append("skippingwebhooklimit", "true");

    const url = `https://chatcord-server.onrender.com/guilds/${guildId}/channels?${params.toString()}`;
    const response = await fetch(url, { signal });
    if (!response.ok) throw new Error("Failed to fetch channels");
    return response.json();
}

async function loadCharacterInteractions(userId, charID) {
    const res = await fetch('https://chatcord-server.onrender.com/get-interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, character_id: charID })
    });
    const data = await res.json();
    return data.interactions || [];
}

// Close Modal
export function closeModal() {
    document.getElementById("modal").style.display = "none";
}

export function showToast(message) {
    const toast = document.createElement("div");
    toast.className = "custom-toast";
    toast.innerText = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.classList.add("show");
    }, 10); // slight delay to trigger animation

    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => document.body.removeChild(toast), 300);
    }, 2000); // visible for 2s
}
