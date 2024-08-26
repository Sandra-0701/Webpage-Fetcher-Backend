const getStatusColor = (statusCode) => {
    if (statusCode >= 500) return 'red'; // Server errors
    if (statusCode >= 400) return 'orange'; // Client errors
    if (statusCode >= 300) return 'yellow'; // Redirects
    return 'green'; // Successful responses
  };
  
  module.exports = getStatusColor;
  