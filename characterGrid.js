let showDetailsOnClick = false
export function populateGrid(characters, includeTags = [], excludeTags = [], showDetailsOnClickParam) {
    showDetailsOnClick = showDetailsOnClickParam;
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
        
        const charDiv = document.createElement("div");
        charDiv.classList.add("character");
        const imageUrl = `https://chatcord-server.onrender.com/get-characters/${id}`;
        
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

        function getRandomInt(min, max) {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        }

        // This is temp until we start tracking this data
        let likes = getRandomInt(1, 99);
        let downloads = getRandomInt(1, 99);
        let stars = getRandomInt(1, 99);
        let comments = getRandomInt(1, 99);

        if (showDetailsOnClick) {
            charDiv.innerHTML = `
                <img class="character-img" src="${imageUrl}" alt="${character.char_name || 'Unknown'}">
                <p>${character.char_name || 'Unknown'}</p>
                <div>${downloads || 0} ⬇ | ${likes || 0} ❤️ | ${stars || 0} ⭐ | ${comments || 0} 💬</div>
                <div class="tags" id="characterTags"></div>
            `;
            let characterTags = charDiv.querySelector("#characterTags");
            const tags = Array.isArray(character.tags) ? character.tags : [];  
            tags.forEach(tag => {
                let tagElement = document.createElement("span");
                tagElement.classList.add("tag");
                tagElement.textContent = tag;
                characterTags.appendChild(tagElement);
            });
        } else {
            charDiv.id = `character-${id}`;
            charDiv.innerHTML = `
                <img class="character-img" src="${imageUrl}" alt="${character.char_name || 'Unknown'}">
                <p>${character.char_name || 'Unknown'}</p>
                <div>${downloads || 0} ⬇ | ${likes || 0} ❤️ | ${stars || 0} ⭐ | ${comments || 0} 💬</div>
                <button class="edit-btn">Edit</button>
                <button class="delete-btn">Delete</button>
            `;
            charDiv.querySelector(".delete-btn").addEventListener("click", () => deleteCharacter(id));
            charDiv.querySelector(".edit-btn").addEventListener("click", () => editCharacter(id));
        }
        grid.appendChild(charDiv);
    });
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

if (showDetailsOnClick) {
    alert("true")
    // Select the heart, thumbs-up, and thumbs-down icons
    const favoriteBtn = document.getElementById('favoriteBtn');
    const thumbsUpBtn = document.getElementById('thumbsUpBtn');
    const thumbsDownBtn = document.getElementById('thumbsDownBtn');
    // Flag to track if a request is already debounced
    let requestScheduled = false;
    // Adding event listener for the thumbs-up button
    favoriteBtn.addEventListener('click', () => {
        // Check if user is logged in
        const user = JSON.parse(localStorage.getItem("user"));
        
        if (!user) {
            alert("Please log in to like characters.");
            return;
        }
    
        // Change the fav button color immediately
        favoriteBtn.classList.toggle('active');
    
        // If no request is scheduled, debounce the request
        if (!requestScheduled) {
            requestScheduled = true; // Mark that a request is scheduled
    
            // Debounced function to execute the request after 1000ms
            setTimeout(() => {
                // Perform the action here (e.g., send the request)
                console.log('fav executed after 1000ms');
    
                // Reset the flag once the action has been executed
                requestScheduled = false;
    
                // Example of sending a request (e.g., update like status):
                // updateLikeStatus(characterId, true);
            }, 1000);
        }
    }, false);
    
    // Adding event listener for the thumbs-up button
    thumbsUpBtn.addEventListener('click', () => {
        // Check if user is logged in
        const user = JSON.parse(localStorage.getItem("user"));
        
        if (!user) {
            alert("Please log in to like characters.");
            return;
        }
    
        // Change the thumbs-up button color immediately
        thumbsUpBtn.classList.toggle('active'); // Make the button red immediately
    
        // Remove active class from thumbs-down button if it's present
        thumbsDownBtn.classList.remove('active');
    
        // If no request is scheduled, debounce the request
        if (!requestScheduled) {
            requestScheduled = true; // Mark that a request is scheduled
    
            // Debounced function to execute the request after 1000ms
            setTimeout(() => {
                // Perform the action here (e.g., send the request)
                console.log('like executed after 1000ms');
    
                // Reset the flag once the action has been executed
                requestScheduled = false;
    
                // Example of sending a request (e.g., update like status):
                // updateLikeStatus(characterId, true);
            }, 1000);
        }
    }, false);

    // Adding event listener for the thumbs-up button
    thumbsDownBtn.addEventListener('click', () => {
        // Check if user is logged in
        const user = JSON.parse(localStorage.getItem("user"));
        
        if (!user) {
            alert("Please log in to like characters.");
            return;
        }
    
        // Change the thumbs-up button color immediately
        thumbsDownBtn.classList.toggle('active'); // Make the button red immediately
    
        // Remove active class from thumbs-down button if it's present
        thumbsUpBtn.classList.remove('active');
    
        // If no request is scheduled, debounce the request
        if (!requestScheduled) {
            requestScheduled = true; // Mark that a request is scheduled
    
            // Debounced function to execute the request after 1000ms
            setTimeout(() => {
                // Perform the action here (e.g., send the request)
                console.log('dislike executed after 1000ms');
    
                // Reset the flag once the action has been executed
                requestScheduled = false;
    
                // Example of sending a request (e.g., update like status):
                // updateLikeStatus(characterId, true);
            }, 1000);
        }
    }, false);
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

