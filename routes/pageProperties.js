// Backend: routes/pageProperties.js
const express = require('express');
const router = express.Router();
const getPageContent = require('../utils/getPageContent');

router.post('/', async (req, res) => {
  const { url, onlyUhf = false } = req.body;

  try {
    const result = await getPageContent(url, onlyUhf);
    if (!result) return res.status(500).send('Failed to fetch page content.');

    // Ensure we're sending the pageProperties array
    res.json({ metaTags: result.pageProperties });
  } catch (error) {
    console.error('Error in /route:', error.message);
    return res.status(500).send('Failed to process page content.');
  }
});

module.exports = router;

// Frontend: App.js (relevant part)
const fetchData = async () => {
  setLoading(true);
  try {
    const response = await axios.post(`${API_BASE_URL}/${dataType}`, {
      url,
      onlyUhf,
    });
    const responseData = response.data;
    console.log('API Response:', responseData);

    if (dataType === 'page-properties') {
      setColumns([
        { title: 'Name', dataIndex: 'name', key: 'name' },
        { title: 'Content', dataIndex: 'content', key: 'content' },
      ]);
      const metaTagsData = Array.isArray(responseData.metaTags) 
        ? responseData.metaTags.map((meta, index) => ({ 
            key: index, 
            name: meta.name || meta.property || 'Unknown',
            content: meta.content || 'N/A'
          }))
        : [];
      console.log('Processed metaTagsData:', metaTagsData);
      setData(metaTagsData);
    }
    // ... rest of the function
  } catch (error) {
    console.error('Error fetching data:', error);
    message.error('Failed to fetch data.');
  } finally {
    setLoading(false);
  }
};