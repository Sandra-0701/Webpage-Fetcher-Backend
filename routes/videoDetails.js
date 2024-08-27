const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const router = express.Router();

router.post('/', async (req, res) => {
  const { url, onlyUhf = false } = req.body;

  // Validate URL
  if (!url) {
    return res.status(400).send('URL is required');
  }

  try {
    // Fetch the page content
    const { data } = await axios.get(url);

    // Load the HTML content into cheerio
    const $ = cheerio.load(data);

    // Extract UHF content
    const uhfHeader = onlyUhf ? $('header').html() || '' : '';
    const uhfFooter = onlyUhf ? $('footer').html() || '' : '';

    // Extract video details
    const videoDetailsList = [];
    
    if (!onlyUhf) {
      $('universal-media-player').each((index, element) => {
        // Example for extracting options, adjust based on your HTML structure
        const options = $(element).attr('options');
        const videoDetail = {
          transcript: [], // Adjust as necessary
          cc: [], // Adjust as necessary
          autoplay: $(element).attr('autoplay') ? "yes" : "no",
          muted: $(element).attr('muted') ? "yes" : "no",
          ariaLabel: $(element).attr('aria-label') || $(element).attr('title') || "",
          audioTrack: $(element).find('.vjs-audio-button').length > 0 ? "yes" : "no",
        };

        videoDetailsList.push(videoDetail);
      });
    }

    // Respond with the relevant details based on onlyUhf
    if (onlyUhf) {
      res.json({ uhfHeader, uhfFooter });
    } else {
      res.json({ videos: videoDetailsList });
    }
  } catch (error) {
    console.error('Error in /api/video-details:', error); // Log the full error object
    res.status(500).send('Failed to process page content.');
  }
});

module.exports = router;
