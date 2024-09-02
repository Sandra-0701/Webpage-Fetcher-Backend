const axios = require('axios');
const getStatusColor = require('./getStatusColor');

const processLink = async (links, $) => {
  const processedLinks = await Promise.all(links.map(async (link) => {
    const href = $(link).attr('href');
    const text = $(link).text().trim();
    const ariaLabel = $(link).attr('aria-label');
    const target = $(link).attr('target');
    const classNames = $(link).attr('class') || '';

    let linkType = 'unknown';
    if (classNames.includes('cta')) {
      linkType = 'cta';
    } else if (classNames.includes('button')) {
      linkType = 'button';
    } else if (classNames.includes('link')) {
      linkType = 'link';
    }

    let linkDetails = {
      linkType,
      linkText: text,
      ariaLabel: ariaLabel || '',
      url: href,
      redirectedUrl: '',
      statusCode: 200,
      target: target || '',
      statusColor: 'green',
      originalUrlColor: '',
      redirectedUrlColor: '',
    };

    if (href) {
      try {
        const response = await axios.get(href, {
          maxRedirects: 5,
          timeout: 5000,
          validateStatus: () => true,
        });

        linkDetails.statusCode = response.status;
        linkDetails.redirectedUrl = response.request.res.responseUrl || href;
        linkDetails.statusColor = getStatusColor(response.status);

        if (href !== linkDetails.redirectedUrl) {
          linkDetails.originalUrlColor = 'blue';
          linkDetails.redirectedUrlColor = 'purple';
        }
      } catch (error) {
        linkDetails.statusCode = error.response ? error.response.status : 500;
        linkDetails.statusColor = 'red';
      }
    }

    return linkDetails;
  }));

  return processedLinks;
};

module.exports = processLink;