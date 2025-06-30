// pages/api/generate.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // destructure everything your single HTML form will send
  const {
    name,
    email,
    phone,
    location,
    summary,
    experiences, // expect an array of { title, company, start, end, location, responsibilities }
    education,   // expect an array of { degree, field, institution, year }
    skills       // expect an array of strings
  } = req.body;

  // basic validation
  if (!name || !summary || !Array.isArray(experiences) || experiences.length === 0) {
    return res.status(400).json({ error: 'Missing required resume data' });
  }

  const apiKey = process.env.TOGETHER_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not set' });
  }

  // build a single prompt
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

    // send back as `result` so your front end can stay the same
    const polished = json.output.choices[0].text.trim();
    res.status(200).json({ result: polished });
  } catch (err) {
    console.error('Fetch error:', err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
}
