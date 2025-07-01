// File: pages/api/adzuna.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  try {
    const { skills = [], location = '', keywords = '', jobType = '' } = req.body;

    // Use .env or fallback keys
    const app_id = process.env.ADZUNA_APP_ID || '56654c85';
    const app_key = process.env.ADZUNA_APP_KEY || '6786a8555c697f27a4fa696843a00991';

    if (!app_id || !app_key) {
      return res.status(500).json({ error: 'Missing Adzuna credentials' });
    }

    // Safe fallbacks
    const safeSkills = skills.length ? skills : ['developer'];
    const query = encodeURIComponent(safeSkills.join(' '));
    const where = encodeURIComponent(location || 'remote');
    let url = `https://api.adzuna.com/v1/api/jobs/us/search/1?app_id=${app_id}&app_key=${app_key}&results_per_page=5&what=${query}&where=${where}&content-type=application/json`;

    if (keywords) {
      url += `&what_and=${encodeURIComponent(keywords)}`;
    }

    if (jobType) {
      if (jobType === 'full_time') {
        url += '&full_time=1';
      } else if (jobType === 'part_time') {
        url += '&part_time=1';
      } else if (jobType === 'contract') {
        url += '&contract=1';
      }
      // Add other job types as needed, e.g., permanent
    }

    console.log('[Adzuna URL]', url); // Useful for debugging

    const response = await fetch(url);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Adzuna API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    if (!data.results || data.results.length === 0) {
      return res.status(200).json({ jobs: [] });
    }

    const jobs = data.results.map(job => ({
      title: job.title,
      company: job.company?.display_name || 'Unknown',
      location: job.location?.display_name || 'N/A',
      description: job.description?.replace(/<[^>]+>/g, '') || '', // remove HTML tags
      url: job.redirect_url || '#'
    }));

    return res.status(200).json({ jobs });

  } catch (err) {
    console.error('[Adzuna fetch failed]', err);
    return res.status(500).json({ error: err.message || 'Failed to fetch jobs from Adzuna' });
  }
}
