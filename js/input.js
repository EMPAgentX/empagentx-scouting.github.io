document.addEventListener("DOMContentLoaded", () => {
  document.getElementById('data-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const form = e.target;
    const data = Object.fromEntries(new FormData(form).entries());
    const statusEl = document.getElementById('status');
    const qrContainer = document.getElementById('qrcode');
    const qrWrapper = document.getElementById('qr-container');

    qrContainer.innerHTML = '';
    qrWrapper.style.display = 'none';
    statusEl.textContent = 'Submitting...';

    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error('Server returned error');

      const result = await res.json();
      statusEl.textContent = `✅ ${result.message}`;
    } catch (err) {
      console.error(err);
      statusEl.textContent = '⚠️ Backend unreachable — generating QR fallback...';
      qrWrapper.style.display = 'block';

      // Convert to JSON string for QR
      const jsonData = JSON.stringify(data);

      // Generate QR code for offline backup
      new QRCode(qrContainer, {
        text: jsonData,
        width: 200,
        height: 200,
      });

      // Add small note under QR
      const note = document.createElement('p');
      note.className = 'text-xs text-gray-500 text-center mt-2';
      note.textContent = 'Scan or screenshot this QR to manually upload later.';
      qrContainer.appendChild(note);
  }
})});