const express = require('express');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const getPageContent = require('../utils/getPageContent');
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

    // Fetch video details only if not in UHF mode
    if (!onlyUhf) {
      const browser = await puppeteer.launch();
      const page = await browser.newPage();
      await page.goto(url);

      videoDetails = await page.evaluate(async () => {
        const videoDetailsList = [];
        const videoElements = document.querySelectorAll("universal-media-player");

        // Helper function to wait for the audio track button to be rendered
        const waitForRender = (videoElement) => {
          return new Promise((resolve) => {
            const checkButton = () => {
              const audioTrackButton = videoElement.querySelector('.vjs-audio-button.vjs-menu-button.vjs-menu-button-popup.vjs-button');
              if (audioTrackButton) {
                resolve(audioTrackButton);
              } else {
                requestAnimationFrame(checkButton);
              }
            };
            checkButton();
          });
        };

        for (const videoElement of videoElements) {
          const options = JSON.parse(videoElement.getAttribute("options"));

          const audioTrackButton = await waitForRender(videoElement);
          const audioTrackPresent = audioTrackButton && audioTrackButton.querySelector('span.vjs-control-text') ? "yes" : "no";

          const videoDetail = {
            transcript: options.downloadableFiles
              .filter(file => file.mediaType === "transcript")
              .map(file => file.locale),
            cc: options.ccFiles.map(file => file.locale),
            autoplay: options.autoplay ? "yes" : "no",
            muted: options.muted ? "yes" : "no",
            ariaLabel: options.ariaLabel || options.title || "",
            audioTrack: audioTrackPresent,
          };

          videoDetailsList.push(videoDetail);
        }

        return videoDetailsList;
      });

      await browser.close();
    }

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
