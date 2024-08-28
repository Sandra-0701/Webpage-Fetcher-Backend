const express = require('express');
const cheerio = require('cheerio');
const axios = require('axios');
const processLink = require('../utils/processLink');

const router = express.Router();

const getPageContent = async (url, onlyUhf = false) => {
  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);

    const header = $('header').html() || '';
    const footer = $('footer').html() || '';
    const content = onlyUhf ? '' : $('body').html() || '';

    return { content, header, footer };
  } catch (error) {
    console.error('Error fetching page content:', error.message);
    throw error;
  }
};

router.post('/', async (req, res) => {
  const { url, onlyUhf = false } = req.body;

  try {
    const { content, header, footer } = await getPageContent(url, onlyUhf);

    if (!content && !header && !footer) {
      return res.status(404).send('No content found.');
    }

    const $ = cheerio.load(onlyUhf ? `${header}${footer}` : content);

    const pageProperties = {
      title: $('title').text().trim() || 'No Title',
      description: $('meta[name="description"]').attr('content')?.trim() || 'No Description',
      keywords: $('meta[name="keywords"]').attr('content')?.trim() || 'No Keywords',
    };

    const linkElements = $('a').toArray();
    const linkPromises = linkElements.map(link => processLink(link, $));
    const links = await Promise.all(linkPromises);

    const images = $('img').map((_, element) => ({
      imageName: $(element).attr('src')?.trim() || 'No Source',
      alt: $(element).attr('alt')?.trim() || 'No Alt Text',
      hasAlt: !!$(element).attr('alt'),
    })).get();

    const headings = $('h1, h2, h3, h4, h5, h6').map((_, element) => ({
      level: element.name,
      text: $(element).text().trim(),
    })).get();

    const videoDetails = $('universal-media-player').map((_, element) => {
      let options = {};
      try {
        options = JSON.parse($(element).attr('options') || '{}');
      } catch (error) {
        console.error('Error parsing video options:', error);
      }
      return {
        transcript: options.downloadableFiles
          ? options.downloadableFiles.filter(file => file.mediaType === "transcript").map(file => file.locale)
          : [],
        cc: options.ccFiles ? options.ccFiles.map(file => file.locale) : [],
        autoplay: options.autoplay ? "yes" : "no",
        muted: options.muted ? "yes" : "no",
        ariaLabel: options.ariaLabel || options.title || "",
        audioTrack: $(element).find('.vjs-audio-button').length > 0 ? "yes" : "no",
      };
    }).get();

    res.json({
      pageProperties,
      links,
      images,
      headings,
      videoDetails
    });
  } catch (error) {
    console.error('Error in /all-details route:', error);
    res.status(500).send('Failed to process page content: ' + error.message);
  }
});

module.exports = router;