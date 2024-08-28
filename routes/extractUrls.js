//routes/ExtractUrls.js
const express = require('express');
const router = express.Router();
const getPageContent = require('../utils/getPageContent');

router.post('/', async (req, res) => {
  const { url, onlyUhf } = req.body;

  try {
    // Fetch page content based on the UHF flag
    const { content, header, footer } = await getPageContent(url, onlyUhf);

    // Debugging logs to help trace where the issue might be
    console.log('Content Length:', content ? content.length : 0);
    console.log('Header Length:', header ? header.length : 0);
    console.log('Footer Length:', footer ? footer.length : 0);

    // If content is empty, send an error response
    if (!content && !header && !footer) {
      console.error('Failed to fetch content. Content is empty.');
      return res.status(500).send('Failed to fetch page content.');
    }

    // Load the content into Cheerio
    const cheerio = require('cheerio');
    let urls = [];

    if (onlyUhf) {
      // Combine header and footer for UHF mode
      const uhfContent = `${header || ''}${footer || ''}`;
      const $$ = cheerio.load(uhfContent);
      urls = $$('a[href]')
        .map((_, element) => $$(element).attr('href'))
        .get()
        .filter(href => href.startsWith('http'));
    } else {
      // Extract URLs from the main content
      const $ = cheerio.load(content);
      urls = $('a[href]')
        .map((_, element) => $(element).attr('href'))
        .get()
        .filter(href => href.startsWith('http'));
    }

    // Send the response with only URLs
    res.json({ urls });
  } catch (error) {
    console.error('Error fetching content:', error.message);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
