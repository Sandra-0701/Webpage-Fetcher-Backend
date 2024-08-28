//routes/linkDetails.js
const express = require('express');
const router = express.Router();
const getPageContent = require('../utils/getPageContent');
const processLink = require('../utils/processLink');

router.post('/', async (req, res) => {
  const { url, onlyUhf = false } = req.body;

  try {
    const { content, header, footer } = await getPageContent(url, onlyUhf);

    if (!content && !header && !footer) {
      return res.status(500).send('Failed to fetch page content.');
    }

    const cheerio = require('cheerio');
    let $;

    if (onlyUhf) {
      const uhfContent = `${header || ''}${footer || ''}`;
      $ = cheerio.load(uhfContent);
    } else {
      $ = cheerio.load(content);
    }

    const linkElements = $('a').toArray();
    const links = await processLink(linkElements, $);

    res.json({ links });
  } catch (error) {
    console.error('Error in /link-details route:', error.message);
    return res.status(500).send('Failed to process page content.');
  }
});

module.exports = router;
