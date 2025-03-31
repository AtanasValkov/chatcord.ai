let showDetailsOnClick = false
export function populateGrid(characters, includeTags = [], excludeTags = [], showDetailsOnClickParam) {
    showDetailsOnClick = showDetailsOnClickParam;
    const grid = document.getElementById("characterGrid");
    grid.innerHTML = ""; // Clear existing content

    characters.forEach(([id, character]) => {
        if (character.tags.some(tag => excludeTags.includes(tag))) return;
        if (includeTags.length > 0 && !character.tags.some(tag => includeTags.includes(tag))) return;

        const charDiv = document.createElement("div");
        charDiv.classList.add("character");

        const imageUrl = `https://chatcord-server.onrender.com/get-characters/${id}`;
        charDiv.innerHTML = `
            <img class="character-img" src="${imageUrl}" alt="${character.char_name || 'Unknown'}">
            <p>${character.char_name || 'Unknown'}</p>
            <div>${getRandomInt(1, 99)} ⬇ | ${getRandomInt(1, 99)} ❤️ | ${getRandomInt(1, 99)} ⭐ | ${getRandomInt(1, 99)} 💬</div>
            <div class="tags"></div>
        `;

        if (showDetailsOnClick) {
            charDiv.onclick = () => showDetails(
                character.char_name || "Unknown Character",
                character.description || character.world_scenario || "No scenario available.",
                imageUrl,
                character.tags || [],
                character.userID,
                character.username,
                character.avatar
            );
        }

        const favoriteBtn = charDiv.querySelector('.favorite');
        const thumbsUpBtn = charDiv.querySelector('.thumbs-up');
        const thumbsDownBtn = charDiv.querySelector('.thumbs-down');

        favoriteBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            toggleButton(favoriteBtn);
        });

        thumbsUpBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            toggleButton(thumbsUpBtn);
            thumbsDownBtn.classList.remove('active');
        });

        thumbsDownBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            toggleButton(thumbsDownBtn);
            thumbsUpBtn.classList.remove('active');
        });

        function toggleButton(button) {
            button.classList.toggle('active');
            console.log(`${button.classList.contains('active') ? "Activated" : "Deactivated"} ${button.innerText}`);
        }

        grid.appendChild(charDiv);
    });
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function showDetails(name, desc, img, tags, ID, username, avatar) {
    document.getElementById('characterName').innerText = name || 'Unknown Character';
    document.getElementById('characterDesc').innerText = desc || 'No description available.';
    document.getElementById('characterImage').src = img || 'default-image.jpg';

    const tagContainer = document.getElementById("characterTags");
    tagContainer.innerHTML = '';  // Clear existing tags

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


    const madeByDiv = document.getElementById("madeBy");
    madeByDiv.innerHTML = `
        <p style="margin: 0 10px;">Uploaded by <strong>${username}</strong></p>
        <img src="https://cdn.discordapp.com/avatars/${ID}/${avatar}.png"
             alt="Avatar" style="width: 50px; height: 50px; border-radius: 50%;">
    `;
    

    document.getElementById('detailsPanel').style.display = 'block';
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
        alert('Error deleting character.');
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

function createBot(name, image, description) {
    console.log("Trying to get name", name);
    
    var data = {
        "username": name, // Extract text content
        "avatar_url": image, // Extract image source
        "content": description, // Extract text content
        "embeds": [
        {
          "title": "create",
          "description": image,
          "color": 16711680,
        }
        ],
    };

    fetch("https://discord.com/api/webhooks/1352061720067309589/UONc3FvNtzfmeIygz_PFfIxpvQfkgxqTWSEdY1QB_2jada9MyIkZTQ9XRp46AzVOcZCu", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        if (response.status === 204) {
            console.log("Success: Message sent (204 No Content)");
            return {}; // Return empty object to keep .json() format
        }
        return response.json(); // Parse only if there's content
    })
    .then(data => console.log("Success:", data))
    .catch(error => console.error("Error:", error));
}

