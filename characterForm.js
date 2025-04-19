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
  const fieldIds = ['imageInput', 'nameInput', 'descriptionInput', 'greetingInput', 'scenarioInput', 'dialogueInput', 'displayTextInput', 'sfwSelect', 'tagInput'];
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
