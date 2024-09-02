const express = require('express');
const router = express.Router();
const getPageContent = require('../utils/getPageContent');
const processLink = require('../utils/processLink');

router.post('/', async (req, res) => {
  const { url, onlyUhf = false } = req.body;

  try {
    const { content, header, footer, pageProperties } = await getPageContent(url, onlyUhf);

    if (!content && !header && !footer) {
      return res.status(500).send('Failed to fetch page content.');
    }

    const $ = content ? cheerio.load(content) : cheerio.load(`${header || ''}${footer || ''}`);
    const linkElements = $('a').toArray();
    const links = await Promise.all(linkElements.map((link) => processLink(link, $)));

    res.json({ links, pageProperties });
  } catch (error) {
    console.error('Error in /link-details route:', error.message);
    return res.status(500).send('Failed to process page content.');
  }
});

module.exports = router;