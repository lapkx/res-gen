export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }
  const { skills = [], location = 'United States' } = req.body;
  const app_id  = process.env.ADZUNA_APP_ID;
  const app_key = process.env.ADZUNA_APP_KEY;
  if (!app_id || !app_key) {
    return res.status(500).json({ error: 'Adzuna credentials missing' });
  }

  const what = encodeURIComponent(skills.slice(0,3).join(' '));
  const where = encodeURIComponent(location);
  const url = `https://api.adzuna.com/v1/api/jobs/us/search/1?app_id=${app_id}&app_key=${app_key}&what=${what}&where=${where}&results_per_page=5`;

  try {
    const apiRes = await fetch(url);
    const data   = await apiRes.json();
    if (!apiRes.ok) {
      console.error('Adzuna responded with:', data);
      return res.status(apiRes.status).json({ error: data });
    }
    const jobs = (data.results || []).map(job => ({
      title: job.title,
      company: job.company.display_name,
      location: job.location.display_name,
      description: job.description,
      url: job.redirect_url,
      salary: job.salary_min ? `$${job.salary_min}–${job.salary_max}` : 'N/A'
    }));
    res.status(200).json({ jobs });
  } catch(err) {
    console.error('Fetch to Adzuna failed:', err);
    res.status(500).json({ error: err.message });
  }
}
