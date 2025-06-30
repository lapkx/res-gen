// pages/api/polishResume.js
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

  if (!name || !summary || !Array.isArray(experiences)) {
    return res.status(400).json({ error: 'Missing required data' });
  }

  const prompt = `
You are a world-class resume writer. Use only the information below. Produce a clean, ATS-friendly resume with:
• Header (Name, Contact)
• Professional Summary (2–3 sentences)
• Work Experience (for each job: Title, Company, Dates, Location, 3–5 bullet points with strong action verbs & quantifiable results)
• Education (Degree, Field, Institution, Year)
• Skills (comma-separated list)

PERSONAL INFO:
Name: ${name}
Email: ${email}
Phone: ${phone}
Location: ${location}

SUMMARY:
${summary}

EXPERIENCES:
${experiences.map((e, i) => `
${i + 1}. Title: ${e.title}
   Company: ${e.company}
   Dates: ${e.start} – ${e.end}
   Location: ${e.location}
   Responsibilities:
   - ${e.responsibilities.join('\n   - ')}
`).join('')}

EDUCATION:
${education.map(ed => `- ${ed.degree} in ${ed.field}, ${ed.institution} (${ed.year})`).join('\n')}

SKILLS:
${skills.join(', ')}

Output only the resume text — no commentary.
`;

  try {
    const apiKey = process.env.TOGETHER_API_KEY;
    if (!apiKey) throw new Error('API key not set');

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
    if (!aiRes.ok) throw json;
    const polished = json.output.choices[0].text.trim();
    res.status(200).json({ polished });
  } catch (err) {
    console.error('AI error:', err);
    res.status(500).json({ error: 'AI error' });
  }
}
