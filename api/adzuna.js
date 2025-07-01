// api/adzuna.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST method is allowed' });
  }

  const { skills = [], location = 'United States' } = req.body;

  const app_id = process.env.ADZUNA_APP_ID;
  const app_key = process.env.ADZUNA_APP_KEY;

  if (!app_id || !app_key) {
    return res.status(500).json({ error: 'Missing Adzuna API credentials' });
  }

  const what = skills.slice(0, 3).join(' ');
  const encodedLocation = encodeURIComponent(location);

  const url = `https://api.adzuna.com/v1/api/jobs/us/search/1?app_id=${app_id}&app_key=${app_key}&what=${encodeURIComponent(what)}&where=${encodedLocation}&results_per_page=5`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!data.results) {
      throw new Error('No results returned from Adzuna');
    }

    const jobs = data.results.map(job => ({
      title: job.title,
      company: job.company.display_name,
      location: job.location.display_name,
      description: job.description,
      url: job.redirect_url,
      salary: job.salary_is_predicted === "1" ? `~$${job.salary_min} (predicted)` : job.salary_min ? `$${job.salary_min} - $${job.salary_max}` : 'N/A'
    }));

    res.status(200).json({ jobs });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch jobs from Adzuna' });
  }
}
