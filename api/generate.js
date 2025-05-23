import fetch from 'node-fetch';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { skills, experience } = req.body;

  if (!skills || !experience) {
    return res.status(400).json({ error: 'Missing skills or experience' });
  }

  const prompt = `
You are a resume assistant. Based only on the following skills and experience, generate 5 professional bullet points I can use in a resume.

Skills: ${skills}
Experience: ${experience}
`;

  try {
    const apiKey = process.env.TOGETHER_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'API key not set' });
    }

    const response = await fetch('https://api.together.xyz/inference', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'meta-llama/Llama-3.3-70B-Instruct-Turbo-Free',
        prompt: prompt,
        max_tokens: 512,
        temperature: 0.7,
        top_p: 0.9,
        stop: ["\n\n", "---"]
      })
    });

    const data = await response.json();

    if (response.ok && data.output) {
      res.status(200).json({ result: data.output.choices[0].text.trim() });
    } else {
      res.status(500).json({ error: 'AI API error' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
