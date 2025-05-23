export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { skills, experience } = req.body;

  if (!skills || !experience) {
    return res.status(400).json({ error: 'Missing skills or experience' });
  }

  const apiKey = process.env.TOGETHER_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not set' });
  }

  const prompt = `
You are a resume assistant. Only use the information I give you — do not invent or assume anything.
Based only on the following skills and experience, generate 5 professional bullet points I can use in a resume.

EXAMPLE:
Skills: Leadership, Carpentry, Project Management
Experience: Led a 10-person team in remodeling a commercial property; Managed budget and materials for a 3-story apartment renovation

Expected Output:
- Led a 10-person team through the successful remodeling of a commercial property, ensuring project completion on time and within budget.
- Oversaw renovation of a 3-story apartment complex, managing material sourcing, subcontractor coordination, and safety compliance.
- Applied advanced carpentry skills to structural modifications and interior build-outs.
- Tracked and managed project expenses and timelines using construction management tools.
- Communicated effectively with clients and stakeholders to ensure satisfaction and adherence to project goals.

Now, use the following:
Skills: ${skills}
Experience: ${experience}
`;

  try {
    const response = await fetch('https://api.together.xyz/inference', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'meta-llama/Llama-3.3-70B-Instruct-Turbo-Free',
        prompt,
        max_tokens: 512,
        temperature: 0.7,
        top_p: 0.9,
        stop: ['\n\n', '---'],
      }),
    });

    const data = await response.json();

    if (response.ok && data.output?.choices?.[0]?.text) {
      res.status(200).json({ result: data.output.choices[0].text.trim() });
    } else {
      console.error('API error details:', data);
      res.status(500).json({ error: 'AI API error' });
    }
  } catch (error) {
    console.error('Catch error:', error);
    res.status(500).json({ error: error.message });
  }
}
