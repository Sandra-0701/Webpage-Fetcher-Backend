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
    const $ = cheerio.load(data);

    if (onlyUhf) {
      // Extract only UHF content (header/footer)
      const uhfHeader = $('header').html() || '';
      const uhfFooter = $('footer').html() || '';
      return res.json({ uhfHeader, uhfFooter });
    }

    // Extract video details
    const videoDetailsList = [];
    $('universal-media-player').each((i, element) => {
      const videoElement = $(element);
      const options = JSON.parse(videoElement.attr('options') || '{}');

      const audioTrackButton = videoElement.find('.vjs-audio-button.vjs-menu-button.vjs-menu-button-popup.vjs-button').length > 0;
      const audioTrackPresent = audioTrackButton ? 'yes' : 'no';

      const videoDetail = {
        transcript: (options.downloadableFiles || [])
          .filter(file => file.mediaType === 'transcript')
          .map(file => file.locale),
        cc: (options.ccFiles || []).map(file => file.locale),
        autoplay: options.autoplay ? 'yes' : 'no',
        muted: options.muted ? 'yes' : 'no',
        ariaLabel: options.ariaLabel || options.title || '',
        audioTrack: audioTrackPresent,
      };

      videoDetailsList.push(videoDetail);
    });

    // Respond with video details only
    res.json({ videoDetails: videoDetailsList });
  } catch (error) {
    console.error('Error in /api/video-details:', error.message);
    res.status(500).send('Failed to process page content.');
  }
});

module.exports = router;
