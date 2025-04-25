let authorID = null;
let currentUser = null;
let charID = null;
export async function initCharacterForm({ mode, characterId }) {
  if (characterId) {
    charID = characterId;
    const data = await fetch(`https://chatcord-server.onrender.com/get-characters`).then(r => r.json());
    const char = data.find(c => c.id === characterId);
    if (char) populateFields(char);
  }
  
  setupTagInput();
  setupImageUpload();
  autoGrowTextareas();

  if (mode === 'create' || mode === 'edit') {
    document.getElementById('characterForm')
    .addEventListener('submit', e => onSubmit(mode, e));
  } else if (mode === 'review') {
    disableAllInputs();
    addFieldCheckboxes();
    addReviewControls(characterId);
    sendReviewLock(characterId);
    window.addEventListener('beforeunload', () => {
      if (characterId) {
        navigator.sendBeacon(
          'https://chatcord-server.onrender.com/character-unlock',
          new Blob([JSON.stringify({ characterId })], { type: 'application/json' })
        );
      }
    });
  }
}

/**
 * Send a placeholder review to lock the character for review.
 * Only updates the character status to "in_review" without creating a review record.
 */
async function sendReviewLock(characterId) {
  try {
    currentUser = JSON.parse(localStorage.getItem('user'));
    const payload = {
      characterId,
      decision: 'request_changes',
      reason: null,
      notes: null,
      fields: [],
      reviewerId: currentUser.id,
      authorId: authorID
    };

    await fetch('https://chatcord-server.onrender.com/character-feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch (err) {
    console.error('Failed to acquire review lock:', err);
  }
}


function disableAllInputs() {
  document.querySelectorAll('input, textarea, select')
    .forEach(el => el.disabled = true);
  document.getElementById('tagInput').style.display = 'none';
  document.getElementById('suggestions').style.display = 'none';
  // Remove click event listeners from all tags
  const tags = document.querySelectorAll('.tag');
  tags.forEach(tag => {
    tag.style.cursor = 'default'; // Change cursor to indicate it's not clickable
    tag.replaceWith(tag.cloneNode(true)); // This removes all event listeners
  });
}

function addFieldCheckboxes() {
  const fieldIds = ['previewImage', 'characterName', 'charDescription', 'charGreeting', 'charScenario', 'charDialogue', 'displayText', 'sfwSelect', 'tagContainer'];
  fieldIds.forEach(id => {
    const field = document.getElementById(id);
    if (field) {
      const wrapper = document.createElement('div');
      wrapper.style.display = 'flex';
      wrapper.style.alignItems = 'center';
      field.parentNode.insertBefore(wrapper, field);
      wrapper.appendChild(field);

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'field-checkbox';
      checkbox.dataset.field = id;
      checkbox.style.marginLeft = '8px';
      wrapper.appendChild(checkbox);
    }
  });
}

async function populateFields(character) {
  document.getElementById("characterName").value = character.char_name || '';
  document.getElementById("charDescription").value = character.char_persona || '';
  document.getElementById("charGreeting").value = character.char_greeting || '';
  document.getElementById("charScenario").value = character.world_scenario || '';
  document.getElementById("charDialogue").value = character.example_dialogue || '';
  document.getElementById("displayText").value = character.description || '';
  document.getElementById("genderSelect").value = character.gender || '';
  document.getElementById("sfwSelect").value = character.rating || '';
  authorID = character.userID;
  let authorName = character.username;
  let authorIcon = character.avatar;
  // Populate tags if available
  if(character.tags && Array.isArray(character.tags)) {
   character.tags.forEach(tag => addTag(tag));
  }
  
  const previewImage = document.getElementById("previewImage");
  previewImage.src = character.char_url;
  previewImage.style.display = "block";

  let review;
  try {
    const res = await fetch(`https://chatcord-server.onrender.com/reviews/latest?charId=${character.id}`);
    review = await res.json();
  } catch (err) {
    console.warn("Couldn't load review:", err);
    return;
  }

  if (review.affected_fields && Array.isArray(review.affected_fields)) {
    review.affected_fields.forEach(fieldId => {
      const el = document.getElementById(fieldId);
      if (el) el.classList.add("review-highlight");
    });
  }

  const sidebar = document.getElementById("reviewSidebar");
  if (review && (review.reason || review.notes)) {
    sidebar.style.display = "block";
    sidebar.innerHTML = `
      <h4>Review: ${review.reason || "No reason provided"}</h4>
      <p>${review.notes || "No additional notes."}</p>
    `;
  } else {
    sidebar.style.display = "none";
  }
}

function addReviewControls(characterId) {
  const form = document.getElementById('characterForm');
  form.querySelector('#submitBtn').remove();

  // Get the sidebar container
  const sidebar = document.getElementById('reviewSidebar');
  const isMobile = window.innerWidth <= 915;
  sidebar.innerHTML = `
    <div id="sidebarToggleWrapper">
      ${isMobile ? `<button id="toggleSidebar" style="width: 100%; margin-bottom: 10px;">☰</button>` : ''}
    </div>
    <div id="sidebarContent" style="display: ${isMobile ? 'none' : 'block'};">
      <h2>Review Controls</h2>
    </div>
  `;
  const sidebarContent = document.getElementById('sidebarContent');

  // Only add toggle behavior on mobile
  if (isMobile) {
    const toggleBtn = document.getElementById('toggleSidebar');
    const sidebarEl = document.getElementById('reviewSidebar');
  
    toggleBtn.addEventListener('click', () => {
      const isCollapsed = sidebarEl.classList.contains('collapsed');
      sidebarContent.style.display = isCollapsed ? 'block' : 'none';
      sidebarEl.classList.toggle('collapsed');
      toggleBtn.textContent = isCollapsed ? '☰' : '☰'; // You can swap icons if you want
    });
  
    // Start collapsed on mobile
    sidebarContent.style.display = 'none';
    sidebar.classList.add('collapsed');
  }
  // Add reason dropdown
  const reasonSelect = document.createElement('select');
  reasonSelect.id = 'reviewReason';
  reasonSelect.innerHTML = `
    <option value="">-- Select Reason --</option>
    <option value="underage_content">Underage Content</option>
    <option value="hateful_content">Hateful Content</option>
    <option value="extreme_violence">Extreme Sadism/Torture</option>
    <option value="bestiality">Bestiality Content</option>
  `;
  sidebarContent.appendChild(reasonSelect);

  // Notes textarea
  const notes = document.createElement('textarea');
  notes.id = 'reviewNotes';
  notes.placeholder = 'Additional notes (optional)';
  notes.rows = 3;
  notes.style.width = '100%';
  notes.style.margin = '10px 0';
  sidebarContent.appendChild(notes);

  // Decision buttons
  const decisions = [
    { text: 'Approve', decision: 'approved' },
    { text: 'Request Changes', decision: 'request_changes' },
    { text: 'Deny', decision: 'denied' }
  ];

  decisions.forEach(({ text, decision }) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = text;
    btn.style.display = 'block';
    btn.style.width = '100%';
    btn.style.margin = '5px 0';
    btn.addEventListener('click', () => handleReviewSubmit(decision, characterId));
    sidebarContent.appendChild(btn);
  });

  // Add back button
  const backLink = document.createElement('a');
  backLink.href = 'profile.html';
  backLink.id = 'backBtn';
  backLink.className = 'back-btn';
  backLink.textContent = 'Back';
  form.appendChild(backLink);
  backLink.addEventListener('click', async (e) => {
    window.location.href = backLink.href;
  });
}

function setupTagInput() {
  let existingTags = [];
  fetchTags().then(tags => existingTags = tags);
  
  document.getElementById("tagInput").addEventListener("input", function () {
      const inputVal = this.value.trim().toLowerCase();
      const suggestionsDiv = document.getElementById("suggestions");
      suggestionsDiv.innerHTML = "";
  
      if (inputVal) {
          if (!Array.isArray(existingTags)) {
              console.error("existingTags is not an array:", existingTags);
              return;
          }
  
          const filteredTags = existingTags
              .map(tagTuple => tagTuple[0])  // Extract tag names
              .filter(tag => {
                  const tagLower = tag.toLowerCase();
                  return typeof tag === "string" && 
                      tagLower !== "featured" &&  // Exclude Featured
                      tagLower !== "review" &&      // Exclude Review
                      tagLower.includes(inputVal);  // Broad substring match
              });
  
          filteredTags.forEach(tag => {
              const suggestion = document.createElement("div");
              suggestion.textContent = tag;
              suggestion.classList.add("suggestion-item");
              suggestion.addEventListener("click", function () {
                  addTag(tag);
                  suggestionsDiv.innerHTML = "";
                  document.getElementById("tagInput").value = "";
              });
              suggestionsDiv.appendChild(suggestion);
          });
      }
  });
  
  document.getElementById("tagInput").addEventListener("keypress", function (event) {
      if (event.key === "Enter") {
          event.preventDefault();
          addTag(this.value.trim());
          this.value = "";
          document.getElementById("suggestions").innerHTML = "";
      }
  });
}

async function fetchTags() {
    try {
        const response = await fetch('https://chatcord-server.onrender.com/get-tags');
        return await response.json();
    } catch (error) {
        console.error("Error fetching tags:", error);
        return [];
    }
}

function addTag(tagText) {
    if (!tagText) return;
    const tagContainer = document.getElementById("tagContainer");

    const tag = document.createElement("span");
    tag.classList.add("tag");
    tag.textContent = tagText;
    tag.addEventListener("click", function () {
        this.remove();
    });

    tagContainer.appendChild(tag);
}
let imageFile;
function setupImageUpload() {

  var jsonData;
  
  document.getElementById("imageUpload").addEventListener("change", function(event) {
      const file = event.target.files[0];
      if (!file) return;
      imageFile = file;
  
      // Read as ArrayBuffer for metadata processing
      const reader1 = new FileReader();
      reader1.onload = function (e) {
          const arrayBuffer = e.target.result;
          const fileType = detectFileType(arrayBuffer);
  
          if (fileType === "png") {
              const newArrayBuffer = removePNGMetadata(arrayBuffer);
              const newBlob = new Blob([newArrayBuffer], { type: `image/png` });
              const newFile = new File([newBlob], file.name, { type: `image/png` });
  
              imageFile = newFile; // Set processed image file
              parsePNGMetadata(arrayBuffer);
          } else {
              console.log(`${fileType.toUpperCase()} detected, returning original file.`);
          }
      };
      reader1.readAsArrayBuffer(file);
  
      // Read as DataURL for previewing the image
      const reader2 = new FileReader();
      reader2.onload = function (e) {
          document.getElementById("previewImage").src = e.target.result;
          document.getElementById("previewImage").style.display = "block";
      };
      reader2.readAsDataURL(file);
  });
}

// Detect file type using magic numbers
function detectFileType(arrayBuffer) {
    const dataView = new DataView(arrayBuffer);
    const signatures = {
        png: [137, 80, 78, 71, 13, 10, 26, 10],
        jpg: [0xFF, 0xD8, 0xFF],
        gif: [0x47, 0x49, 0x46, 0x38]
    };

    if (matchesSignature(dataView, signatures.png)) return "png";
    if (matchesSignature(dataView, signatures.jpg)) return "jpg";
    if (matchesSignature(dataView, signatures.gif)) return "gif";

    return "unknown";
}

function matchesSignature(dataView, signature) {
    return signature.every((byte, i) => dataView.getUint8(i) === byte);
}

// Function to remove tEXt metadata from PNG
function removePNGMetadata(arrayBuffer) {
    const dataView = new DataView(arrayBuffer);
    let offset = 8;
    const chunks = [];

    while (offset < dataView.byteLength) {
        let chunkLength = dataView.getUint32(offset);
        let chunkType = new TextDecoder().decode(new Uint8Array(arrayBuffer, offset + 4, 4));

        if (chunkType === "tEXt" || chunkType === "zTXt" || chunkType === "iTXt") {
            offset += 12 + chunkLength;
            continue;
        }

        let chunkData = new Uint8Array(arrayBuffer, offset, 12 + chunkLength);
        chunks.push(chunkData);
        offset += 12 + chunkLength;
    }

    return rebuildPNG(chunks);
}

// Rebuild PNG file
function rebuildPNG(chunks) {
    const header = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    let newBuffer = new Uint8Array(header.length + chunks.reduce((sum, chunk) => sum + chunk.length, 0));

    newBuffer.set(header, 0);
    let offset = header.length;

    for (let chunk of chunks) {
        newBuffer.set(chunk, offset);
        offset += chunk.length;
    }

    return newBuffer.buffer;
}

// Parse PNG metadata
function parsePNGMetadata(arrayBuffer) {
    const dataView = new DataView(arrayBuffer);
    let offset = 8;

    while (offset < dataView.byteLength) {
        let chunkLength = dataView.getUint32(offset);
        let chunkType = new TextDecoder().decode(new Uint8Array(arrayBuffer, offset + 4, 4));

        if (chunkType === "tEXt") {
            let chunkData = new Uint8Array(arrayBuffer, offset + 8, chunkLength);
            let textData = new TextDecoder().decode(chunkData);

            if (textData.startsWith("chara")) {
                let base64Data = textData.split("\u0000")[1];
                decodeBase64JSON(base64Data);
                return;
            }
        }
        offset += 12 + chunkLength;
    }

    document.getElementById("charDescription").textContent = "Not a tavern card.";
}

// Decode Base64 JSON metadata
function decodeBase64JSON(base64Str) {
    try {
        let jsonString = atob(base64Str);
        jsonData = JSON.parse(jsonString);

        document.getElementById("characterName").value = jsonData['name'] || '';
        document.getElementById("charDescription").textContent = jsonData['personality'] || jsonData['description'] || 'No description available.';
        document.getElementById("charGreeting").value = jsonData['first_mes'] || '';
        document.getElementById("charScenario").value = jsonData['scenario'] || '';
        document.getElementById("charDialogue").value = jsonData['mes_example'] || '';

        const tagContainer = document.getElementById("tagContainer");
        tagContainer.innerHTML = '';

        if (jsonData['data'] && Array.isArray(jsonData['data']['tags'])) {
            jsonData['data']['tags'].forEach(tag => addTag(tag));
        } else {
            console.warn("No tags found.");
        }
    } catch (e) {
        console.error("Error decoding metadata:", e);
    }
}

function autoGrowTextareas() {
    document.getElementById("charDescription").addEventListener("input", function() {
        this.style.height = "auto";
        this.style.height = (this.scrollHeight) + "px";
    });
}

async function onSubmit(mode, e) {
  e.preventDefault();

  // === DISABLE EVERYTHING ===
  const form = document.getElementById('characterForm');
  form
    .querySelectorAll('input, button, select, textarea')
    .forEach(el => el.disabled = true);

  // Show a loading indicator:
  const submitBtn = form.querySelector('button[type="submit"]');
  if (submitBtn) {
    submitBtn.textContent = 'Saving…';
  }

  // Grabs the current user
  const user = JSON.parse(localStorage.getItem('user'));
  const userRes = await fetch(`https://chatcord-server.onrender.com/get-user/${user.id}`);
  const { user: userData } = await userRes.json();

  // Collect tags
  const tags = new Set(
    Array.from(document.querySelectorAll('#tagContainer .tag'))
      .map(tag => tag.textContent.trim())
  );

  const gender = document.getElementById('genderSelect').value;
  const rating = document.getElementById('sfwSelect').value;
  if (gender) tags.add(gender);
  if (rating) tags.add(rating);

  const accessLevel = userData.access_level?.toLowerCase();
  if (accessLevel === 'admin' || accessLevel === 'moderator') {
    if (mode === 'create') tags.add('Featured');
  } else {
    tags.delete('Featured');
    tags.add('Review');
  }

  // Build payload
  const payload = {
    char_name: document.getElementById('characterName').value,
    char_persona: document.getElementById('charDescription').value,
    char_greeting: document.getElementById('charGreeting').value,
    world_scenario: document.getElementById('charScenario').value,
    example_dialogue: document.getElementById('charDialogue').value,
    description: document.getElementById('displayText').value,
    gender, rating,
    tags: Array.from(tags),
    userID: user.id,
    username: user.username,
    avatar: user.avatar,
    ...(mode === 'edit' && { id: charID })
  };
  try {
    // Prepare FormData (incl. file if any)
    const formData = new FormData();
    formData.append('json', JSON.stringify(payload));
    if (imageFile) formData.append('file', imageFile);
  
    // Fire off to the correct endpoint
    const endpoint = mode === 'edit'
      ? 'https://chatcord-server.onrender.com/update_character'
      : 'https://chatcord-server.onrender.com/upload_json';
  
    const res = await fetch(endpoint, { method: 'POST', body: formData });
    const data = await res.json();
  
    if (!res.ok) {
      // On server‑side error, re‑enable the controls:
      form.querySelectorAll('input, button, select, textarea')
          .forEach(el => el.disabled = false);
      if (submitBtn) {
        if(mode=== 'edit') {
          submitBtn.textContent = 'Edit Character';
        } else {
          submitBtn.textContent = 'Create Character';
        }
      }
      alert(`Error: ${data.error || 'Unknown error'}`);
      return;
    }
  
    alert(
      accessLevel === 'admin' || accessLevel === 'moderator'
        ? (mode==='edit'?'Character updated':'Character created')
        : (mode==='edit'?'Updated & sent for review':'Created & sent for review')
    );
    if (mode === 'edit') {
      window.location.href = 'profile.html';
    } else {
      e.target.reset();
      document.getElementById('previewImage').src = '';
      document.getElementById('tagContainer').innerHTML = '';
    } 
  } catch (err) {
      // Network or unexpected error: re‑enable
      form.querySelectorAll('input, button, select, textarea')
          .forEach(el => el.disabled = false);
      if (submitBtn) {
        if(mode=== 'edit') {
          submitBtn.textContent = 'Edit Character';
        } else {
          submitBtn.textContent = 'Create Character';
        }
      }
      alert(`Unexpected error: ${err.message}`);
    }
}

async function handleReviewSubmit(decision, characterId) {
  // disable controls
  const sidebar = document.getElementById('reviewSidebar');
  sidebar.querySelectorAll('button, select, textarea').forEach(el => el.disabled = true);

  const checkedFields = Array.from(document.querySelectorAll('.field-checkbox'))
    .filter(c => c.checked)
    .map(c => c.dataset.field);
  const reason = document.getElementById('reviewReason').value;
  const notes = document.getElementById('reviewNotes').value;
  
  if (decision === 'approved') {
    if (checkedFields.length > 0) {
      alert('You cannot approve and still have fields marked as needing changes.');
      // re-enable controls on failure
      sidebar.querySelectorAll('button, select, textarea').forEach(el => el.disabled = false);
      return;
    }
    if (reason) {
      alert('You cannot approve and still select a reason for rejection.');
      // re-enable controls on failure
      sidebar.querySelectorAll('button, select, textarea').forEach(el => el.disabled = false);
      return;
    }
  } else if ((decision === 'request_changes' || decision === 'denied')) {
    if (checkedFields.length === 0) {
      alert('Please check at least one field that needs attention.');
      // re-enable controls on failure
      sidebar.querySelectorAll('button, select, textarea').forEach(el => el.disabled = false);
      return;
    }
    if (!reason) {
      alert('Please select a reason for requesting changes or denying.');
      // re-enable controls on failure
      sidebar.querySelectorAll('button, select, textarea').forEach(el => el.disabled = false);
      return;
    }
  }
  currentUser = JSON.parse(localStorage.getItem('user'));
  if (!currentUser.id) {
    alert('You must be logged in to submit a review.');
    // re-enable controls on failure
    sidebar.querySelectorAll('button, select, textarea').forEach(el => el.disabled = false);
    return;
  }
  const payload = {
    characterId,
    decision,
    reason,
    notes,
    fields: decision === 'approved' ? [] : checkedFields,
    reviewerId: currentUser.id,
    authorId: authorID
  };

  try {
    const res = await fetch('https://chatcord-server.onrender.com/character-feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error('Failed to submit review');
    alert('Review submitted successfully.');
    window.location.href = "profile.html";
  } catch (err) {
    console.error(err);
    alert('There was an error submitting the review.');
    // re-enable controls on failure
    sidebar.querySelectorAll('button, select, textarea').forEach(el => el.disabled = false);
  }
}
