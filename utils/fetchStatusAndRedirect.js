const axios = require('axios');
const getStatusColor = require('./getStatusColor');

const fetchStatusAndRedirect = async (url) => {
  try {
    console.log(`Fetching status for URL: ${url}`);
    const response = await axios.get(url, {
      timeout: 10000, // 10-second timeout
      validateStatus: () => true,
    });

    const redirectedUrl = response.request.res.responseUrl || url;
    return {
      statusCode: response.status,
      redirectedUrl,
      statusColor: getStatusColor(response.status),
    };
  } catch (error) {
    console.error(`Error fetching status for URL: ${url}`, error.message);
    if (error.response) {
      return {
        statusCode: error.response.status,
        redirectedUrl: error.response.request.res.responseUrl || url,
        statusColor: getStatusColor(error.response.status),
      };
    } else if (error.request) {
      return {
        statusCode: 500,
        redirectedUrl: url,
        statusColor: getStatusColor(500),
      };
    } else {
      return {
        statusCode: 500,
        redirectedUrl: url,
        statusColor: getStatusColor(500),
      };
    }
  }
};

module.exports = fetchStatusAndRedirect;
