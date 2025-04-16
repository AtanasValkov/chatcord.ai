
export function populateGrid(characters, includeTags = [], excludeTags = [], showDetailsOnClick) {
    const grid = document.getElementById("characterGrid");
    grid.innerHTML = ""; // Clear existing content

    characters.forEach(([id, character]) => {
        // Block character if any of its tags are in the exclusion list.
        if (character.tags.some(tag => excludeTags.includes(tag) || character.tags.includes("Review"))) {
            if(!character.tags.some(tag => includeTags.includes("Review"))) {
                return;
            }
        }
        // If any include filters are active, the character must have at least one of those tags.
        if (includeTags.length > 0 && !character.tags.some(tag => includeTags.includes(tag))) {
            return;
        }

        renderCharacterCard(character, showDetailsOnClick);
        });
}

async function renderCharacterCard(character, showDetailsOnClick) {
        const grid = document.getElementById("characterGrid");
        const charDiv = document.createElement("div");
        charDiv.classList.add("character");

        const imageUrl = character.char_url
    
        function getRandomInt(min, max) {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        }

        // This is temp until we start tracking this data
        let likes = getRandomInt(1, 99);
        let downloads = getRandomInt(1, 99);
        let stars = getRandomInt(1, 99);
        let comments = getRandomInt(1, 99);

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
                <div>${downloads || 0} ⬇ | ${likes || 0} ❤️ | ${stars || 0} ⭐ | ${comments || 0} 💬</div>
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
                <img class="character-img" src="${imageUrl}" alt="${character.char_name || 'Unknown'}">
                <p>${character.char_name || 'Unknown'}</p>
                <div>${downloads || 0} ⬇ | ${likes || 0} ❤️ | ${stars || 0} ⭐ | ${comments || 0} 💬</div>
                <button class="edit-btn">Edit</button>
                <button class="delete-btn">Delete</button>
            `;
            charDiv.querySelector(".delete-btn").addEventListener("click", () => deleteCharacter(character.id));
            charDiv.querySelector(".edit-btn").addEventListener("click", () => editCharacter(character.id));
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

    let requestScheduled = false;
    // Create favorite button
    const favoriteBtn = document.createElement("span");
    favoriteBtn.classList.add("favorite");
    favoriteBtn.id = "favoriteBtn";
    favoriteBtn.innerHTML = '<i class="fas fa-heart"></i>';
    
    // Set initial state if already favorited
    const currentUser = JSON.parse(localStorage.getItem("user"));
    if (currentUser && currentUser.favCharacters && currentUser.favCharacters.includes(charID)) {
        favoriteBtn.classList.add("active");
    }
    
    favoriteBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        const user = JSON.parse(localStorage.getItem("user"));
        if (!user) {
            alert("Please log in to like characters.");
            return;
        }
        user.favCharacters = user.favCharacters || [];
    
        if (user.favCharacters.includes(charID)) {
            // Remove if already favorited
            user.favCharacters = user.favCharacters.filter(id => id !== charID);
            favoriteBtn.classList.remove("active");
        } else {
            // Add if not already favorited
            user.favCharacters.push(charID);
            favoriteBtn.classList.add("active");
        }
    
        localStorage.setItem("user", JSON.stringify(user));
    
        if (!requestScheduled) {
            requestScheduled = true;
            setTimeout(() => {
                console.log('fav executed after 1000ms');
                requestScheduled = false;
            }, 1000);
        }
    });


    // Create thumbs up button
    const thumbsUpBtn = document.createElement("span");
    thumbsUpBtn.classList.add("thumbs-up");
    thumbsUpBtn.id = "thumbsUpBtn";
    thumbsUpBtn.innerHTML = '<i class="fas fa-thumbs-up"></i>';
    thumbsUpBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        const user = JSON.parse(localStorage.getItem("user"));
        if (!user) {
            alert("Please log in to like characters.");
            return;
        }
        thumbsUpBtn.classList.toggle('active');
        thumbsDownBtn.classList.remove('active');
        if (!requestScheduled) {
            requestScheduled = true;
            setTimeout(() => {
                console.log('like executed after 1000ms');
                requestScheduled = false;
            }, 1000);
        }
    });
                        

    // Create thumbs down button
    const thumbsDownBtn = document.createElement("span");
    thumbsDownBtn.classList.add("thumbs-down");
    thumbsDownBtn.id = "thumbsDownBtn";
    thumbsDownBtn.innerHTML = '<i class="fas fa-thumbs-down"></i>';
    thumbsDownBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        const user = JSON.parse(localStorage.getItem("user"));
        if (!user) {
            alert("Please log in to like characters.");
            return;
        }
        thumbsDownBtn.classList.toggle('active');
        thumbsUpBtn.classList.remove('active');
        if (!requestScheduled) {
            requestScheduled = true;
            setTimeout(() => {
                console.log('dislike executed after 1000ms');
                requestScheduled = false;
            }, 1000);
        }
    });

    // Append elements
    detailsPanelLike.appendChild(characterName);
    detailsPanelLike.appendChild(favoriteBtn);
    detailsPanelLike.appendChild(thumbsUpBtn);
    detailsPanelLike.appendChild(thumbsDownBtn);

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
    window.location.href = `create-character.html?id=${encodeURIComponent(characterId)}`;
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
        alert('Character deleted successfully.');
        document.getElementById(`character-${characterId}`).remove();
      } else {
        alert("Error: " + (data.error || "Unknown error"));
      }
    })
    .catch(err => {
      alert('Error deleting character.');
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
        alert("Please log in to add characters to your server.")
        return
    }
    const userId = user.id;
    let guilds = [];
    try {
        guilds = await fetchGuilds(userId);
    } catch (err) {
        alert("Failed to load guilds: " + err.message);
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
                            alert("Force refresh failed: " + err.message);
                        }
                    };
                }
            } else {
                promptToAddBot(guildId);
            }
        } catch (error) {
            if (error.name !== 'AbortError') {
                alert("Failed to fetch channels: " + error);
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
            alert("Failed to refresh guilds: " + err.message);
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
            createWebhook(guildId, channelId, currentCharId);
        } catch (error) {
            alert("Failed to create webhook: " + error);
        }
    }
}

// Create the webhook in the selected channel
async function createWebhook(guildId, channelId, characterId) {
    const response = await fetch('https://chatcord-server.onrender.com/create-webhook', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            channel_id: channelId,
            character_id: characterId
        })
    });

    const responseData = await response.json();
    console.log("Response Data:", responseData);  
    if (response.ok) {
        alert(responseData.message);
        closeModal();
    } else {
        alert("Error: " + responseData.error);
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
    alert("The bot is not in this guild. Please add the bot to the guild.");
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

// Close Modal
function closeModal() {
    document.getElementById("modal").style.display = "none";
}
