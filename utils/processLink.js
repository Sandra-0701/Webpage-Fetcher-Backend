const fetchStatusAndRedirect = require('./fetchStatusAndRedirect');
const getStatusColor = require('./getStatusColor');

const processLink = async (link, $) => {
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
    linkType: linkType,
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
      console.log(`Processing link: ${href}`);
      const { statusCode, redirectedUrl } = await fetchStatusAndRedirect(href);
      linkDetails.statusCode = statusCode;
      linkDetails.redirectedUrl = redirectedUrl;
      linkDetails.statusColor = getStatusColor(statusCode);

      if (href !== redirectedUrl) {
        linkDetails.originalUrlColor = 'blue';
        linkDetails.redirectedUrlColor = 'purple';
      }
    } catch (error) {
      console.error(`Error processing link: ${href}`, error.message);
      linkDetails.statusCode = 500;
      linkDetails.statusColor = 'red';
    }
  }

  return linkDetails;
};

module.exports = processLink;
