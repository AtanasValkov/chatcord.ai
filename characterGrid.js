export function populateGrid(characters) {
    const grid = document.getElementById("characterGrid");
    grid.innerHTML = ""; // Clear existing content

    // Get filtering criteria from the two sets of checkboxes
    const includeTags = getIncludeTags();
    const excludeTags = getExcludeTags();

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

        charDiv.onclick = () => showDetails(
            character.char_name || "Unknown Character",
            character.description || character.world_scenario || "No scenario available.",
            imageUrl,
            character.tags || [],
            character.userID,
            character.username,
            character.avatar
        );

        function getRandomInt(min, max) {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        }
        
        let likes = getRandomInt(1, 99);
        let downloads = getRandomInt(1, 99);
        let stars = getRandomInt(1, 99);
        let comments = getRandomInt(1, 99);
                                    
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
        
        grid.appendChild(charDiv);
    });
}
