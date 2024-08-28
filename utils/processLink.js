//utils/processLink.js
const axios = require('axios');
const getStatusColor = require('./getStatusColor');


const fetchStatusAndRedirect = async (url) => {
  try {
    const response = await axios.get(url, {
      validateStatus: (status) => {
        // Allow all status codes (even 3xx for redirects)
        return true;
      },
    });

    return {
      statusCode: response.status,
      redirectedUrl: response.request.res.responseUrl || url,
    };
  } catch (error) {
    if (error.response) {
      return {
        statusCode: error.response.status,
        redirectedUrl: error.response.request.res.responseUrl || url,
      };
    } else if (error.request) {
      // Handle cases where no response is received (network issues, etc.)
      return {
        statusCode: 500,
        redirectedUrl: url,
      };
    } else {
      // Handle other types of errors
      return {
        statusCode: 500,
        redirectedUrl: url,
      };
    }
  }
};

module.exports = fetchStatusAndRedirect;
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
    statusColor: 'green', // Default color
    originalUrlColor: '',
    redirectedUrlColor: '',
  };

  if (href) {
    try {
      // Fetch status and redirected URL
      const { statusCode, redirectedUrl } = await fetchStatusAndRedirect(href);
      linkDetails.statusCode = statusCode;
      linkDetails.redirectedUrl = redirectedUrl;
      linkDetails.statusColor = getStatusColor(statusCode);

      // Check if redirection happened
      if (href !== redirectedUrl) {
        linkDetails.originalUrlColor = 'blue';
        linkDetails.redirectedUrlColor = 'purple';
      }
    } catch (error) {
      // Handle unexpected errors
      linkDetails.statusCode = 500;
      linkDetails.statusColor = 'red'; // Error color
    }
  }

  return linkDetails;
};

module.exports = processLink;
