//utils/getPageContent.js
const axios = require('axios');
const cheerio = require('cheerio');

const getPageContent = async (url, onlyUhf = false) => {
  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);

    // Extract UHF content (header/footer)
    const header = $('header').html() || '';
    const footer = $('footer').html() || '';

    // Extract main content if not onlyUhf
    const content = onlyUhf ? '' : $('main.microsoft-template-layout-container').html() || '';

    // Extract meta tags or other page properties
    const pageProperties = $('meta').map((_, meta) => ({
      name: $(meta).attr('name') || $(meta).attr('property'),
      content: $(meta).attr('content') || 'No Content',
    })).get();

    return {
      content: onlyUhf ? '' : content,
      header,
      footer,
      pageProperties: pageProperties.length ? pageProperties : [],
    };
  } catch (error) {
    console.error('Error fetching page content:', error.message);
    return { content: null, header: null, footer: null, pageProperties: [] };
  }
};

module.exports = getPageContent;
