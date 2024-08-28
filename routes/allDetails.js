const express = require('express');
const cheerio = require('cheerio');
const axios = require('axios');
const processLink = require('../utils/processLink');

const router = express.Router();

router.post('/', async (req, res) => {
  const { url, onlyUhf = false } = req.body; // Default to false if not provided

  try {
    // Fetch page content based on the UHF flag
    const { content, header, footer } = await getPageContent(url, onlyUhf);

    // Handle cases where content might be empty
    if (!content && !header && !footer) {
      return res.status(500).send('Failed to fetch page content.');
    }

    // Initialize response variables
    let links = [];
    let images = [];
    let headings = [];
    let videoDetails = [];
    let pageProperties = {};

    // Load Cheerio depending on the onlyUhf flag
    const $ = cheerio.load(onlyUhf ? `${header || ''}${footer || ''}` : content);

    // Extract page properties
    pageProperties = {
      title: $('title').text().trim() || 'No Title',
      description: $('meta[name="description"]').attr('content')?.trim() || 'No Description',
      keywords: $('meta[name="keywords"]').attr('content')?.trim() || 'No Keywords',
    };

    // Extract link details
    const linkElements = $('a').toArray();
    const linkPromises = linkElements.map(link => processLink(link, $));
    links = await Promise.all(linkPromises);

    // Extract images
    images = $('img').map((_, element) => ({
      imageName: $(element).attr('src')?.trim() || 'No Source',
      alt: $(element).attr('alt')?.trim() || 'No Alt Text',
      hasAlt: !!$(element).attr('alt'),
    })).get();

    // Extract headings
    headings = $('h1, h2, h3, h4, h5, h6').map((_, element) => ({
      level: element.tagName,
      text: $(element).text().trim(),
    })).get();

    // Extract video details
    videoDetails = $('universal-media-player').map((_, element) => {
      const options = JSON.parse($(element).attr('options') || '{}');
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

    // Send the response with all details
    res.json({ 
      pageProperties, 
      links, 
      images, 
      headings, 
      videoDetails 
    });
  } catch (error) {
    console.error('Error in /all-details route:', error.message);
    res.status(500).send('Failed to process page content.');
  }
});

module.exports = router;
