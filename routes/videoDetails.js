const express = require('express');
const puppeteer = require('puppeteer-core');
const chromeLambda = require('chrome-aws-lambda');
const router = express.Router();

router.post('/', async (req, res) => {
  const { url, onlyUhf = false } = req.body;

  // Validate URL
  if (!url) {
    return res.status(400).send('URL is required');
  }

  try {
    // Launch Puppeteer with chrome-aws-lambda configuration
    const browser = await puppeteer.launch({
      args: chromeLambda.args,
      defaultViewport: chromeLambda.defaultViewport,
      executablePath: await chromeLambda.executablePath,
      headless: chromeLambda.headless,
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    // Extract UHF and video details
    const { uhfHeader, uhfFooter, videoDetails } = await page.evaluate(async (onlyUhf) => {
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

      if (onlyUhf) {
        // Extract only UHF content (header/footer)
        const uhfHeader = document.querySelector('header') ? document.querySelector('header').outerHTML : '';
        const uhfFooter = document.querySelector('footer') ? document.querySelector('footer').outerHTML : '';

        return { uhfHeader, uhfFooter, videoDetails: [] }; // Return empty videoDetails
      } else {
        // Extract video details if onlyUhf is false
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

        return { uhfHeader: '', uhfFooter: '', videoDetails: videoDetailsList }; // Return empty UHF content
      }
    }, onlyUhf);

    await browser.close();

    // Respond with the relevant details based on onlyUhf
    if (onlyUhf) {
      res.json({ uhfHeader, uhfFooter });
    } else {
      res.json({ videos: videoDetails });
    }
  } catch (error) {
    console.error('Error in /api/video-details:', error.message);
    res.status(500).send('Failed to process page content.');
  }
});

module.exports = router;
