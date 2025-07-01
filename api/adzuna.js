generateBtn.addEventListener('click', async () => {
  generateBtn.disabled = true;
  generateBtn.textContent = 'Polishing…';
  const payload = collectFormData();

  try {
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const { result } = await res.json();

    // Split off “reasoning” before the last “However”
    let reasoning   = '';
    let finalOutput = result;
    const marker    = 'However';
    const idx       = result.lastIndexOf(marker);
    if (idx !== -1) {
      reasoning   = result.slice(0, idx).trim();
      finalOutput = result.slice(idx).trim();
    }

    aiResult.innerHTML = `
      <details class="mb-4">
        <summary class="cursor-pointer font-medium text-blue-600">
          Show AI Full Output / Reasoning
        </summary>
        <pre class="whitespace-pre-wrap mt-2 bg-gray-100 p-4 rounded">
${reasoning || result}
        </pre>
      </details>
      <h2 class="text-2xl font-bold mb-2">Final Resume</h2>
      <pre class="whitespace-pre-wrap bg-white p-4 rounded resume-paper">
${finalOutput}
      </pre>
    `;

    previewSection.classList.remove('hidden');
  } catch (err) {
    alert('Error: ' + (err.message || 'Failed to generate resume'));
  } finally {
    generateBtn.disabled = false;
    generateBtn.textContent = 'Generate Professional Resume';
  }
});
