const express = require('express');
const router = express.Router();
const getPageContent = require('../utils/getPageContent');

router.post('/', async (req, res) => {
  const { url, onlyUhf = false } = req.body;

  try {
    const result = await getPageContent(url, onlyUhf);
    if (!result) return res.status(500).send('Failed to fetch page content.');

    res.json(result);
  } catch (error) {
    console.error('Error in /route:', error.message);
    return res.status(500).send('Failed to process page content.');
  }
});

module.exports = router;
