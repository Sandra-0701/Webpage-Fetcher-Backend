const express = require('express');
const router = express.Router();
const getPageContent = require('../utils/getPageContent');
const processLink = require('../utils/processLink');

router.post('/', async (req, res) => {
  const { url, onlyUhf = false } = req.body;

  try {
    console.log('Fetching page content...');
    const { content, header, footer } = await getPageContent(url, onlyUhf);

    if (!content && !header && !footer) {
      console.log('Failed to fetch page content.');
      return res.status(500).send('Failed to fetch page content.');
    }

    console.log('Processing link elements...');
    const cheerio = require('cheerio');
    let $;
    
    if (onlyUhf) {
      const uhfContent = `${header || ''}${footer || ''}`;
      $ = cheerio.load(uhfContent);
    } else {
      $ = cheerio.load(content);
    }

    const linkElements = $('a').toArray();
    console.log(`Found ${linkElements.length} links.`);
    const linkPromises = linkElements.map(link => processLink(link, $));
    const links = await Promise.all(linkPromises);

    console.log('Responding with link details...');
    res.json({ links });
  } catch (error) {
    console.error('Error in /link-details route:', error.message);
    return res.status(500).send('Failed to process page content.');
  }
});

module.exports = router;
