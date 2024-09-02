const axios = require('axios');
const getStatusColor = require('./getStatusColor');

const processLink = async (links, $) => {
  // Process each link using Promise.all to handle asynchronous requests
  const processedLinks = await Promise.all(
    links.map(async (link) => {
      const href = $(link).attr('href'); // Get the href attribute
      const text = $(link).text().trim(); // Get the text content of the link
      const ariaLabel = $(link).attr('aria-label'); // Get the aria-label attribute, if any
      const target = $(link).attr('target'); // Get the target attribute, if any
      const classNames = $(link).attr('class') || ''; // Get the class attribute, if any

      // Determine the link type based on class names
      let linkType = 'unknown';
      if (classNames.includes('cta')) {
        linkType = 'cta';
      } else if (classNames.includes('button')) {
        linkType = 'button';
      } else if (classNames.includes('link')) {
        linkType = 'link';
      }

      // Initialize linkDetails object with the link's attributes and defaults
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

      // If href is valid, proceed to make a request to the link's URL
      if (href) {
        try {
          const response = await axios.get(href, {
            maxRedirects: 5, // Allow up to 5 redirects
            timeout: 5000, // Set a timeout of 5 seconds
            validateStatus: () => true, // Accept all status codes for custom handling
          });

          // Update linkDetails based on the response
          linkDetails.statusCode = response.status;
          linkDetails.redirectedUrl = response.request.res.responseUrl || href;
          linkDetails.statusColor = getStatusColor(response.status);

          // If the original URL was redirected, update colors accordingly
          if (href !== linkDetails.redirectedUrl) {
            linkDetails.originalUrlColor = 'blue';
            linkDetails.redirectedUrlColor = 'purple';
          }
        } catch (error) {
          // Handle errors such as timeouts or failed requests
          linkDetails.statusCode = error.response ? error.response.status : 500;
          linkDetails.statusColor = 'red';
        }
      }

      return linkDetails; // Return the processed link details
    })
  );

  return processedLinks; // Return the array of processed links
};

module.exports = processLink;
