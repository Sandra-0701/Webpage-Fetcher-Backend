//utils/fetchStatusAndRedirect.js
const axios = require('axios');
const { get } = require('follow-redirects');
const getStatusColor = require('./getStatusColor');

const fetchStatusAndRedirect = async (url) => {
  try {
    const response = await axios({
      method: 'get',
      url,
      maxRedirects: 0, // Disable automatic redirects
      validateStatus: () => true, // Accept all status codes
      responseType: 'text', // Ensure response is treated as text
    });

    const redirectedUrl = response.request.res.responseUrl || url;
    return {
      statusCode: response.status,
      redirectedUrl,
      statusColor: getStatusColor(response.status),
    };
  } catch (error) {
    if (error.response) {
      // Response error
      return {
        statusCode: error.response.status,
        redirectedUrl: error.response.request.res.responseUrl || url,
        statusColor: getStatusColor(error.response.status),
      };
    } else if (error.request) {
      // No response received
      return {
        statusCode: 500,
        redirectedUrl: url,
        statusColor: getStatusColor(500),
      };
    } else {
      // Other errors
      return {
        statusCode: 500,
        redirectedUrl: url,
        statusColor: getStatusColor(500),
      };
    }
  }
};

module.exports = fetchStatusAndRedirect;
