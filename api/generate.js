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

    const finalAnswerRegex = /The final answer is(?:\s*(?:is|here|now|it's|it is|here is|here's))?\s*([\s\S]*)/i;
    const match = rawText.match(finalAnswerRegex);

    if (match && match[1]) {
      polished = match[1].trim();
    } else {
      const resumeBlocks = rawText.split(/\n# Resume/i);
      if (resumeBlocks.length > 1) {
        polished = ("# Resume" + resumeBlocks[resumeBlocks.length - 1]).trim();
      } else {
        polished = rawText.trim();
      }
    }

    polished = polished.trim();

    if (!polished && rawText.trim()) {
        polished = rawText.trim();
    }

    res.status(200).json({ result: polished });

  } catch (err) {
    console.error('Fetch error:', err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
}
