
export function populateGrid(characters, includeTags = [], excludeTags = [], showDetailsOnClick, accessLevel = '') {
    const grid = document.getElementById("characterGrid");
    grid.innerHTML = ""; // Clear existing content

    characters.forEach(([id, character]) => {
        // Block character if any of its tags are in the exclusion list.
        if (character.tags.some(tag => excludeTags.includes(tag))) {
            return;
        }
        // If any include filters are active, the character must have at least one of those tags.
        if (includeTags.length > 0 && !character.tags.some(tag => includeTags.includes(tag))) {
            return;
        }
        if (character.review_status === 'pending') {
            renderCharacterCard(character, showDetailsOnClick, true, accessLevel);
        } else {
            renderCharacterCard(character, showDetailsOnClick, false, accessLevel);
        }
        });
}

async function renderCharacterCard(character, showDetailsOnClick, reviewDisplay, accessLevel) {
        const grid = document.getElementById("characterGrid");
        const charDiv = document.createElement("div");
        charDiv.classList.add("character");

        const imageUrl = character.char_url
    
        function getRandomInt(min, max) {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        }

        if (!reviewDisplay) {
            if (showDetailsOnClick) {
                charDiv.onclick = () => showDetails(
                    character.id,
                    character.char_name || "Unknown Character",
                    character.description || character.world_scenario || "No scenario available.",
                    imageUrl,
                    character.tags || [],
                    character.userID,
                    character.username,
                    character.avatar
                );
                
                charDiv.innerHTML = `
                    <img class="character-img" src="${imageUrl}" alt="${character.char_name || 'Unknown'}">
                    <p>${character.char_name || 'Unknown'}</p>
                    <div>${character.downloads} ⬇ | ${character.favorites} ❤️ | ${character.likes - character.dislikes} 👍 | ${character.comments} 💬</div>
                    <div class="tags" id="characterTags"></div>
                `;
                let characterTags = charDiv.querySelector("#characterTags");
                const tags = Array.isArray(character.tags) ? character.tags.slice(0, 6) : []; // Limit to 6 tags
                tags.forEach(tag => {
                    let tagElement = document.createElement("span");
                    tagElement.classList.add("tag");
                    tagElement.textContent = tag;
                    characterTags.appendChild(tagElement);
                });
            } else {
                charDiv.id = `character-${character.id}`;
                charDiv.innerHTML = `
                    <div class="character-card">
                        ${character.review_status === "request_changes" ? '<span class="feedback-badge">⚠️ Feedback</span>' : ''}
                        <img class="character-img" src="${imageUrl}" alt="${character.char_name || 'Unknown'}">
                        <p>${character.char_name || 'Unknown'}</p>
                        <div>${character.downloads} ⬇ | ${character.favorites} ❤️ | ${character.likes - character.dislikes} 👍 | ${character.comments} 💬</div>
                        <button class="edit-btn">Edit</button>
                        <button class="delete-btn">Delete</button>
                    </div>
                `;
                charDiv.querySelector(".delete-btn").addEventListener("click", () => deleteCharacter(character.id));
                charDiv.querySelector(".edit-btn").addEventListener("click", () => editCharacter(character.id));
                if (character.review_status === "request_changes") {
                    charDiv.querySelector(".edit-btn").classList.add("attention");
                }
            }
        } else {
                charDiv.id = `character-${character.id}`;
                charDiv.innerHTML = `
                    <img class="character-img" src="${imageUrl}" alt="${character.char_name || 'Unknown'}">
                    <p>${character.char_name || 'Unknown'}</p>
                    <button class="review-btn">Review</button>
                `;
                if (accessLevel === "admin" || accessLevel === "moderator") {
                    charDiv.querySelector(".review-btn").addEventListener("click", () => reviewCharacter(character.id));
                } else {
                    charDiv.querySelector(".review-btn").innerText = "Character In Review";
                }
        } 
        grid.appendChild(charDiv);
}

function showDetails(charID, name, desc, img, tags, userID, username, avatar) {
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
    characterImage.src = img || "";
    characterImage.alt = name;

    // Create details panel like div
    const detailsPanelLike = document.createElement("div");
    detailsPanelLike.classList.add("details-panel-like");

    // Create character name element
    const characterName = document.createElement("h2");
    characterName.id = "characterName";
    characterName.innerText = name || "Default Name";

    const user = JSON.parse(localStorage.getItem("user"));
    const favoriteBtn   = document.createElement("span");
    const thumbsUpBtn   = document.createElement("span");
    const thumbsDownBtn = document.createElement("span");
    
    favoriteBtn.classList.add("favorite");     favoriteBtn.innerHTML   = '<i class="fas fa-heart"></i>';
    thumbsUpBtn.classList.add("thumbs-up");    thumbsUpBtn.innerHTML   = '<i class="fas fa-thumbs-up"></i>';
    thumbsDownBtn.classList.add("thumbs-down"); thumbsDownBtn.innerHTML = '<i class="fas fa-thumbs-down"></i>';
    
    // 2) Helper to debounce with initial≠final check
    function makeDebouncedToggle(btn, oppositeBtn, interactionOn, interactionOff) {
      btn.addEventListener("click", event => {
        event.stopPropagation();
        if (!user) { showToast("Please log in…"); return; }
    
        // 2a) Capture initial state on first click of burst
        if (btn._initialState === undefined) {
          btn._initialState = btn.classList.contains("active");
        }
    
        // 2b) Immediately toggle UI, and clear any opposite
        const nowOn = btn.classList.toggle("active");
        if (oppositeBtn) oppositeBtn.classList.remove("active");
    
        // 2c) Debounce: after 1s of no clicks, compare initial vs final
        clearTimeout(btn._timeout);
        btn._timeout = setTimeout(() => {
          const initial = btn._initialState;
          const final   = btn.classList.contains("active");
          // Only fire if truly changed
          if (initial !== final) {
            const type = final ? interactionOn : interactionOff;
            fetch("https://chatcord-server.onrender.com/interact", {
              method: "POST",
              headers: { "Content-Type":"application/json" },
              body: JSON.stringify({
                user_id:      user.id,
                character_id: charID,
                interaction_type: type
              })
            })
            .then(() => {})
            .catch(err => console.error(`${interactionOn} error:`, err));
          }
          // cleanup for next burst
          delete btn._initialState;
        }, 1000);
      });
    }
    
    // 3) Apply for each button
    //    favorite has no “opposite”
    makeDebouncedToggle(favoriteBtn, null,        "favorite",   "unfavorite");
    //    like ↔︎ dislike are opposites
    makeDebouncedToggle(thumbsUpBtn,   thumbsDownBtn, "like",       "unlike");
    makeDebouncedToggle(thumbsDownBtn, thumbsUpBtn,   "dislike",    "undislike");

    // Create share button
    const shareBtn = document.createElement("span");
    shareBtn.classList.add("share");
    shareBtn.id = "shareBtn";
    shareBtn.innerHTML = '<i class="fas fa-share-alt"></i>';

    shareBtn.addEventListener('click', (event) => {
        event.stopPropagation();
    
        const shareLink = `https://chatcord.win/index.html?charID=${charID}`;
    
        // Copy to clipboard
        navigator.clipboard.writeText(shareLink).then(() => {
            showToast("Character link copied!");
        }).catch(err => {
            console.error("Failed to copy text: ", err);
            showToast("Failed to copy link.");
        });
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
          modBtn.onclick = () => reviewCharacter(charID);
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
    characterDesc.innerText = desc || "No description available.";
    detailsPanel.appendChild(characterDesc);

    // Create tag container
    const tagContainer = document.createElement("div");
    tagContainer.id = "characterTags";
    tagContainer.classList.add("tags");
    detailsPanel.appendChild(tagContainer);

    // Ensure tags is a valid array before looping
    if (Array.isArray(tags)) {
        tags.forEach(tag => {
            let tagElement = document.createElement("span");
            tagElement.classList.add("tag");
            tagElement.textContent = tag;
            tagContainer.appendChild(tagElement);
        });
    } else {
        console.warn("Tags is missing or not an array:", tags);
    }
    // Create details panel madeBy container
    const detailsPanelMadeBy = document.createElement("div");
    detailsPanelMadeBy.classList.add("details-panel-madeBy");
    detailsPanelMadeBy.id = "details-panel-madeBy";

    // Create 'Create Bot' button
    const createBotButton = document.createElement("button");
    createBotButton.innerText = "Load Character";
    createBotButton.onclick = function() {
        createBot(charID);
    };
    detailsPanelMadeBy.appendChild(createBotButton);

    // Create uploader info container
    const madeByDiv = document.createElement("div");
    madeByDiv.classList.add("madeBy");
    madeByDiv.id = "madeBy";
    madeByDiv.innerHTML = `
      <a href="profile.html?ID=${userID}&username=${encodeURIComponent(username)}" style="text-decoration: none;display: flex;color: inherit;align-items: anchor-center;">
        <p style="margin: 0 10px;">Uploaded by <strong>${username}</strong></p>
        <img src="https://cdn.discordapp.com/avatars/${userID}/${avatar}.png"
             alt="Avatar" style="width: 50px; height: 50px; border-radius: 50%;">
      </a>
    `;
    detailsPanelMadeBy.appendChild(madeByDiv);

    detailsPanel.appendChild(detailsPanelMadeBy);

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
        document.getElementById(`character-${characterId}`).remove();
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

async function createBot(id) {
    document.querySelectorAll(".close").forEach(btn => {
        btn.addEventListener("click", closeModal);
    });

    currentCharId = id;
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
                const data = await fetchChannels(guildId, signal);
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
                            const refreshed = await fetchChannels(guildId, signal, true);
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

async function handleCreateWebhookClick() {
    const guildId = document.getElementById("guild-select").value;
    const channelId = document.getElementById("channel-select").value;

    if (guildId && channelId) {
        try {
            // Proceed with creating the webhook
            createWebhook(channelId, currentCharId);
        } catch (error) {
            showToast("Failed to create webhook: " + error);
        }
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
function promptToAddBot(guildId) {
    const addBotUrl = `https://discord.com/oauth2/authorize?client_id=1352038053757190206&scope=bot&permissions=536873984&guild_id=${guildId}`;
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
    if (!response.ok) throw new Error("Failed to fetch guilds");
    const data = await response.json();
    return data.guilds;
}

// Fetch channels for a specific server (guild) using access_token
async function fetchChannels(guildId, signal, forceRefresh = false) {
    const url = `https://chatcord-server.onrender.com/guilds/${guildId}/channels${forceRefresh ? '?force_refresh=true' : ''}`;
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
function closeModal() {
    document.getElementById("modal").style.display = "none";
}

function showToast(message) {
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
