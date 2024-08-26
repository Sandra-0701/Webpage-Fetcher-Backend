const express = require('express');
const router = express.Router();
const getPageContent = require('../utils/getPageContent');
const processLink = require('../utils/processLink');

router.post('/', async (req, res) => {
  const { url, onlyUhf = false } = req.body;

  try {
    // Fetch page content based on the UHF flag
    const { content, header, footer } = await getPageContent(url, onlyUhf);

    if (!content && !header && !footer) {
      return res.status(500).send('Failed to fetch page content.');
    }

    // Load Cheerio depending on the onlyUhf flag
    const cheerio = require('cheerio');
    let $;
    
    if (onlyUhf) {
      // Combine header and footer for UHF content
      const uhfContent = `${header || ''}${footer || ''}`;
      $ = cheerio.load(uhfContent);
    } else {
      // Load the main content
      $ = cheerio.load(content);
    }

    // Fetch link details
    const linkElements = $('a').toArray();
    const linkPromises = linkElements.map(link => processLink(link, $));
    const links = await Promise.all(linkPromises);

    // Respond with link details
    res.json({ links });
  } catch (error) {
    console.error('Error in /link-details route:', error.message);
    return res.status(500).send('Failed to process page content.');
  }
});

module.exports = router;
