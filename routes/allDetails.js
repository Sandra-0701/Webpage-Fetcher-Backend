const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const processLink = require('../utils/processLink');
const getStatusColor = require('../utils/getStatusColor');

const router = express.Router();

router.post('/', async (req, res) => {
  const { url, onlyUhf } = req.body;

  if (!url) {
    return res.status(400).send('URL is required');
  }

  try {
    const { data } = await axios.get(url);
    console.log('Page content fetched successfully.');
    const $ = cheerio.load(data);

    let links = [];
    let images = [];
    let headings = [];
    let videoDetails = [];
    let pageProperties = [];

    // Extract all meta tags
    $('meta').each((_, element) => {
      const name = $(element).attr('name') || $(element).attr('property');
      const content = $(element).attr('content');
      if (name && content) {
        pageProperties.push({ name, content });
      }
    });

    // Add title to page properties
    pageProperties.push({
      name: 'title',
      content: $('title').text().trim() || 'No Title',
    });

    // Extract link details
    const linkElements = $('a').toArray();
    console.log("linkElements:", linkElements); // Debugging: Check the content of linkElements

    if (Array.isArray(linkElements)) {
      const linkPromises = linkElements.map((link) => processLink(link, $));
      links = await Promise.all(linkPromises);
    } else {
      console.error('linkElements is not an array.');
    }
    
    // Extract images
    images = $('img')
      .map((_, element) => ({
        imageName: $(element).attr('src')?.trim() || 'No Source',
        alt: $(element).attr('alt')?.trim() || 'No Alt Text',
        hasAlt: !!$(element).attr('alt'),
      }))
      .get();

    // Extract heading hierarchy
    const extractHeadings = (element, level = 1) => {
      const headings = [];
      $(element).children().each((_, child) => {
        const $child = $(child);
        const tagName = child.name.toLowerCase();
        if (tagName.match(/^h[1-6]$/)) {
          const headingLevel = parseInt(tagName.charAt(1));
          headings.push({
            level: headingLevel,
            text: $child.text().trim(),
            children: extractHeadings($child, level + 1),
          });
        } else {
          headings.push(...extractHeadings($child, level));
        }
      });
      return headings;
    };

    headings = extractHeadings($('body'));

    // Extract video details
    $('universal-media-player').each((i, element) => {
      const videoElement = $(element);
      const options = JSON.parse(videoElement.attr('options') || '{}');

      const audioTrackButton =
        videoElement.find('.vjs-audio-button.vjs-menu-button.vjs-menu-button-popup.vjs-button').length > 0;
      const audioTrackPresent = audioTrackButton ? 'yes' : 'no';

      const videoDetail = {
        transcript: (options.downloadableFiles || [])
          .filter((file) => file.mediaType === 'transcript')
          .map((file) => file.locale || ''),
        cc: (options.ccFiles || []).map((file) => file.locale || ''),
        autoplay: options.autoplay ? 'yes' : 'no',
        muted: options.muted ? 'yes' : 'no',
        ariaLabel: options.ariaLabel || options.title || '',
        audioTrack: audioTrackPresent,
      };

      videoDetails.push(videoDetail);
    });

    // Extract UHF content
    const uhfHeader = $('header').html() || '';
    const uhfFooter = $('footer').html() || '';

    console.log('Extracted UHF Header:', uhfHeader);
    console.log('Extracted UHF Footer:', uhfFooter);

    // Prepare response object based on onlyUhf flag
    const response = {
      links,
      images,
      headingHierarchy: headings,
      uhfHeader,
      uhfFooter,
      pageProperties,
      videoDetails,
    };

    res.json(response);
  } catch (error) {
    console.error('Error processing URL:', url);
    console.error('Detailed error:', error);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

module.exports = router;