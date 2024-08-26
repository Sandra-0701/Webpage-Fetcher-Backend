const express = require('express');
const router = express.Router();
const getPageContent = require('../utils/getPageContent');

router.post('/', async (req, res) => {
  const { url, onlyUhf = false } = req.body; // Default to false if not provided

  try {
    // Fetch page content based on the UHF flag
    const { content, header, footer } = await getPageContent(url, onlyUhf);

    if (!content && !header && !footer) {
      return res.status(500).send('Failed to fetch page content.');
    }

    // Load Cheerio depending on the onlyUhf flag
    const cheerio = require('cheerio');
    let images = [];

    if (onlyUhf) {
      // Combine header and footer for UHF content
      const uhfContent = `${header || ''}${footer || ''}`;
      const $ = cheerio.load(uhfContent);

      // Extract image details from the UHF content
      $('img').each((_, element) => {
        const src = $(element).attr('src');
        if (src) {
          const alt = $(element).attr('alt');
          images.push({
            imageName: src,
            alt: alt || 'No Alt Text',
            hasAlt: !!alt,
          });
        }
      });

      // Return only image details from UHF content
      return res.json({ images });
    } else {
      // Load main content excluding UHF
      const $ = cheerio.load(content);

      // Extract image details from the main content
      $('img').each((_, element) => {
        const src = $(element).attr('src');
        if (src) {
          const alt = $(element).attr('alt');
          images.push({
            imageName: src,
            alt: alt || 'No Alt Text',
            hasAlt: !!alt,
          });
        }
      });

      // Return only image details
      return res.json({ images });
    }
  } catch (error) {
    console.error('Error in /image-details route:', error.message);
    return res.status(500).send('Failed to process page content.');
  }
});

module.exports = router;
