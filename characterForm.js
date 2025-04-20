export async function initCharacterForm({ mode, characterId }) {
  if (characterId) {
    const data = await fetch(`https://chatcord-server.onrender.com/get-characters`).then(r => r.json());
    const char = data.find(c => c.id === characterId);
    if (char) populateFields(char);
  }

  setupTagInput();
  setupImageUpload();
  autoGrowTextareas();

  if (mode === 'create' || mode === 'edit') {
    document.getElementById('characterForm')
      .addEventListener('submit', onSubmit.bind(null, mode));
  } else if (mode === 'review') {
    disableAllInputs();
    addFieldCheckboxes();
    addReviewControls(characterId);
  }
}

function disableAllInputs() {
  document.querySelectorAll('input, textarea, select')
    .forEach(el => el.disabled = true);
  document.getElementById('tagInput').style.display = 'none';
  document.getElementById('suggestions').style.display = 'none';
}

function addFieldCheckboxes() {
  const fieldIds = ['previewImage', 'characterName', 'charDescription', 'charGreeting', 'charScenario', 'charDialogue', 'displayText', 'sfwSelect', 'tags'];
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

function populateFields(character) {
  document.getElementById("characterName").value = character.char_name || '';
  document.getElementById("charDescription").value = character.char_persona || '';
  document.getElementById("charGreeting").value = character.char_greeting || '';
  document.getElementById("charScenario").value = character.world_scenario || '';
  document.getElementById("charDialogue").value = character.example_dialogue || '';
  document.getElementById("displayText").value = character.description || '';
  document.getElementById("genderSelect").value = character.gender || '';
  document.getElementById("sfwSelect").value = character.rating || '';
  document.getElementById("backBtn").href = "profile.html"
  let authorID = character.userID;
  let authorName = character.username;
  let authorIcon = character.avatar;
  // Populate tags if available
  if(character.tags && Array.isArray(character.tags)) {
   character.tags.forEach(tag => addTag(tag));
  }
  
  const previewImage = document.getElementById("previewImage");
  previewImage.src = character.char_url;
  previewImage.style.display = "block";
}

function addReviewControls(characterId) {
  const form = document.getElementById('characterForm');
  form.querySelector('#submitBtn').remove();

  // Add reason dropdown
  const reasonSelect = document.createElement('select');
  reasonSelect.id = 'reviewReason';
  reasonSelect.innerHTML = '<option value="">-- Select Reason --</option>';
  form.appendChild(reasonSelect);

  // Add optional notes input
  const notes = document.createElement('textarea');
  notes.id = 'reviewNotes';
  notes.placeholder = 'Additional notes (optional)';
  notes.style.marginTop = '10px';
  notes.rows = 3;
  form.appendChild(notes);

  // Add buttons
  const btns = [
    { text: 'Approve', decision: 'approve' },
    { text: 'Request Changes', decision: 'request_changes' },
    { text: 'Deny', decision: 'deny' }
  ];

  btns.forEach(({ text, decision }) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = text;
    b.addEventListener('click', () => handleReviewSubmit(decision, characterId));
    form.appendChild(b);
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

function setupImageUpload() {
  var imageFile;
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


async function handleReviewSubmit(decision, characterId) {
  const checkedFields = Array.from(document.querySelectorAll('.field-checkbox'))
    .filter(c => c.checked)
    .map(c => c.dataset.field);

  if ((decision === 'request_changes' || decision === 'deny') && checkedFields.length === 0) {
    alert('Please check at least one field that needs attention.');
    return;
  }

  const reason = document.getElementById('reviewReason').value;
  const notes = document.getElementById('reviewNotes').value;

  const payload = {
    characterId,
    decision,
    reason,
    notes,
    fields: decision === 'approve' ? [] : checkedFields
  };

  try {
    const res = await fetch('/character-feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error('Failed to submit review');
    alert('Review submitted successfully.');
  } catch (err) {
    console.error(err);
    alert('There was an error submitting the review.');
  }
} // end
