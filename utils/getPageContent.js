const axios = require('axios');
const cheerio = require('cheerio');

const getPageContent = async (url, onlyUhf = false) => {
  try {
    console.log(`Fetching content from URL: ${url}`);
    const { data } = await axios.get(url, { timeout: 10000 }); // 10-second timeout
    const $ = cheerio.load(data);

    const header = $('header').html() || '';
    const footer = $('footer').html() || '';
    const content = onlyUhf ? '' : $('main.microsoft-template-layout-container').html() || '';

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
