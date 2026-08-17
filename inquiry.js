// ── INQUIRY WIDGET (floating button + modal → mailto) ──────────────────────
const INQUIRY_HTML = `
<button class="inquiry-fab" id="inquiryFab" onclick="toggleInquiry()" aria-label="Send inquiry">
  <svg id="inquiryIconMail" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="22" height="22">
    <path d="M3 6.5C3 5.67157 3.67157 5 4.5 5H19.5C20.3284 5 21 5.67157 21 6.5V17.5C21 18.3284 20.3284 19 19.5 19H4.5C3.67157 19 3 18.3284 3 17.5V6.5Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
    <path d="M4 6.5L12 13L20 6.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
  <svg id="inquiryIconClose" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="22" height="22" style="display:none">
    <path d="M6 6L18 18M6 18L18 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  </svg>
</button>
<div class="inquiry-overlay" id="inquiryOverlay" onclick="if(event.target===this) toggleInquiry(false)">
  <div class="inquiry-panel">
    <div class="inquiry-header">
      <div>
        <div class="inquiry-title" data-i18n="inquiry_title">Envoyer une demande</div>
        <div class="inquiry-sub" data-i18n="inquiry_sub">Une question, un avis, ou un sujet sur lequel vous avez besoin d'aide ? Remplissez ce formulaire.</div>
      </div>
      <button class="inquiry-close" onclick="toggleInquiry(false)">&times;</button>
    </div>
    <form id="inquiryForm" onsubmit="return submitInquiry(event)">
      <div class="inquiry-field">
        <label data-i18n="inquiry_name">Votre nom</label>
        <input type="text" id="inqName" required/>
      </div>
      <div class="inquiry-field">
        <label data-i18n="inquiry_email">Votre email</label>
        <input type="email" id="inqEmail" required/>
      </div>
      <div class="inquiry-field">
        <label data-i18n="inquiry_type">Sujet</label>
        <select id="inqType">
          <option data-i18n="inquiry_type_q" value="Question">Question</option>
          <option data-i18n="inquiry_type_f" value="Avis / retour">Avis / retour</option>
          <option data-i18n="inquiry_type_r" value="Demande de tutorat">Demande de tutorat</option>
          <option data-i18n="inquiry_type_o" value="Autre">Autre</option>
        </select>
      </div>
      <div class="inquiry-field">
        <label data-i18n="inquiry_message">Votre message</label>
        <textarea id="inqMessage" rows="4" required></textarea>
      </div>
      <button type="submit" class="inquiry-submit" data-i18n="inquiry_send">Envoyer par email</button>
      <div class="inquiry-note" data-i18n="inquiry_note">Ceci ouvre votre application email par defaut.</div>
    </form>
  </div>
</div>
`;

function injectInquiryWidget() {
  const div = document.createElement('div');
  div.innerHTML = INQUIRY_HTML;
  document.body.appendChild(div);
}

function toggleInquiry(force) {
  const overlay = document.getElementById('inquiryOverlay');
  const fab = document.getElementById('inquiryFab');
  const shouldOpen = force !== undefined ? force : !overlay.classList.contains('open');
  overlay.classList.toggle('open', shouldOpen);
  fab.classList.toggle('open', shouldOpen);
  document.getElementById('inquiryIconMail').style.display = shouldOpen ? 'none' : 'block';
  document.getElementById('inquiryIconClose').style.display = shouldOpen ? 'block' : 'none';
  document.body.style.overflow = shouldOpen ? 'hidden' : '';
}

function submitInquiry(e) {
  e.preventDefault();
  const name = document.getElementById('inqName').value;
  const email = document.getElementById('inqEmail').value;
  const type = document.getElementById('inqType').value;
  const message = document.getElementById('inqMessage').value;
  const subject = encodeURIComponent(`MicroLab Pro : ${type} de ${name}`);
  const body = encodeURIComponent(
    `Nom : ${name}\nEmail : ${email}\nSujet : ${type}\n\nMessage :\n${message}`
  );
  window.location.href = `mailto:rabahallaa666@gmail.com?subject=${subject}&body=${body}`;
  setTimeout(() => toggleInquiry(false), 400);
  return false;
}

document.addEventListener('DOMContentLoaded', injectInquiryWidget);
