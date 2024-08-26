const express = require('express');
const cors = require('cors');
// const helmet = require('helmet'); // Uncomment if using helmet for security

const app = express();
const port = process.env.PORT || 5000; // Fallback to 5000 for local development or Vercel's dynamic port

app.use(express.json());
app.use(cors());
// app.use(helmet()); // Uncomment if using helmet for security

// Route imports
const extractUrls = require('./routes/extractUrls');
const linkDetails = require('./routes/linkDetails');
const imageDetails = require('./routes/imageDetails');
const videoDetails = require('./routes/videoDetails');
const pageProperties = require('./routes/pageProperties');
const headingHierarchy = require('./routes/headingHierarchy');
const allDetails = require('./routes/allDetails');
app.get('/test', (req, res) => {
  res.send('Server is running correctly!');
});
// Route use
app.use('/extract-urls', extractUrls);
app.use('/link-details', linkDetails);
app.use('/image-details', imageDetails);
app.use('/video-details', videoDetails);
app.use('/page-properties', pageProperties);
app.use('/heading-hierarchy', headingHierarchy);
app.use('/all-details', allDetails);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
