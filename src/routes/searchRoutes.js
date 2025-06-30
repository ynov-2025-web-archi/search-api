const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');

// Get search suggestions (autocomplete)
router.get('/suggestions', searchController.getSearchSuggestions);

module.exports = router; 