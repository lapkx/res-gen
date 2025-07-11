// pages/api/generate.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    name,
    email,
    phone,
    location,
    summary,
    experiences,
    education,
    skills
  } = req.body;

  if (!name || !summary || !Array.isArray(experiences) || experiences.length === 0) {
    return res.status(400).json({ error: 'Missing required resume data' });
  }

  const apiKey = process.env.TOGETHER_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not set' });
  }

  const prompt = `
You are a world‐class resume writer. Using only the information below, output a clean, ATS‐friendly resume with these sections:
• Header (Name, Email, Phone, Location)
• Professional Summary (2–3 sentences)
• Work Experience (for each job: Title, Company, Dates, Location, 3–5 bullet points with strong action verbs & quantifiable results)
• Education (Degree in Field, Institution, Year)
• Skills (comma‐separated)

PERSONAL INFO:
Name: ${name}
Email: ${email}
Phone: ${phone}
Location: ${location}

SUMMARY:
${summary}

EXPERIENCES:
${experiences
  .map(
    (e, i) => `
${i + 1}. Title: ${e.title}
   Company: ${e.company}
   Dates: ${e.start} – ${e.end}
   Location: ${e.location}
   Responsibilities:
   - ${e.responsibilities.join('\n   - ')}`
  )
  .join('')}

EDUCATION:
${education.map(ed => `- ${ed.degree} in ${ed.field}, ${ed.institution} (${ed.year})`).join('\n')}

SKILLS:
${skills.join(', ')}

Output only the resume text — no explanations.
IMPORTANT: The output must start DIRECTLY with the ${name}'s header, without any introductory phrases, preamble, or conversational text.
`;

  try {
    const aiRes = await fetch('https://api.together.xyz/inference', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'meta-llama/Llama-3.3-70B-Instruct-Turbo-Free',
        prompt,
        max_tokens: 1500,
        temperature: 0.7,
        top_p: 0.9
      })
    });

    const json = await aiRes.json();
    if (!aiRes.ok || !json.output?.choices?.[0]?.text) {
      console.error('AI error details:', json);
      return res.status(500).json({ error: 'AI API error' });
    }

    let rawText = json.output.choices[0].text;
    let polished = '';

    const finalAnswerMarker = "The final answer is:";
    const markerIndex = rawText.toLowerCase().lastIndexOf(finalAnswerMarker.toLowerCase());

    if (markerIndex !== -1) {
      // If marker found, take text after it
      polished = rawText.substring(markerIndex + finalAnswerMarker.length).trim();
    } else {
      // Fallback 1: Try to get the last block starting with "# Resume"
      const resumeBlocks = rawText.split(/\n# Resume/i); // Split by "\n# Resume" case-insensitively
      if (resumeBlocks.length > 1) {
        // If split occurred, the last element contains content after the last "# Resume"
        // Add back "# Resume" to this segment.
        polished = ("# Resume" + resumeBlocks[resumeBlocks.length - 1]).trim();
      } else {
        // Fallback 2: If no clear marker or "# Resume" split, take the whole raw text.
        // This is the safest option if other heuristics fail.
        polished = rawText.trim();
      }
    }

    // Final trim, just in case something above left whitespace
    polished = polished.trim();

    // If after all processing, polished is empty AND rawText was not (and not just whitespace),
    // it might mean "The final answer is:" was the very last thing.
    // In such an edge case, returning the rawText (trimmed) is better than empty.
    if (!polished && rawText.trim()) {
        polished = rawText.trim();
    }

    res.status(200).json({ result: polished });

  } catch (err) {
    console.error('Fetch error:', err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
}
