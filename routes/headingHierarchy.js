const express = require('express');
const router = express.Router();
const getPageContent = require('../utils/getPageContent');
const cheerio = require('cheerio');

router.post('/', async (req, res) => {
  const { url, onlyUhf = false } = req.body;

  try {
    const { content, header, footer } = await getPageContent(url, onlyUhf);

    // Check for content
    if (!content && !header && !footer) {
      console.error('Failed to fetch content. Content is empty.');
      return res.status(500).send('Failed to fetch page content.');
    }

    let headingHierarchy = [];

    if (onlyUhf) {
      // Combine header and footer for UHF mode
      const uhfContent = `${header || ''}${footer || ''}`;
      const $$ = cheerio.load(uhfContent);

      // Extract headings from UHF content
      headingHierarchy = $$('h1, h2, h3, h4, h5, h6').map((_, element) => ({
        level: element.tagName,
        text: $$(element).text().trim(),
      })).get();
    } else {
      // Extract headings from the main content
      const $ = cheerio.load(content);
      headingHierarchy = $('h1, h2, h3, h4, h5, h6').map((_, element) => ({
        level: element.tagName,
        text: $(element).text().trim(),
      })).get();
    }

    // Send the response with the heading hierarchy
    res.json({ headingHierarchy });
  } catch (error) {
    console.error('Error fetching content:', error.message);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
