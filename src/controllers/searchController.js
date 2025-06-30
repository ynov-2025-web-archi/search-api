const { PrismaClient } = require('@prisma/client');

// Create a new Prisma client instance
const prisma = new PrismaClient();

// Get search suggestions (autocomplete) by name
const getSearchSuggestions = async (req, res) => {
    try {
        const { q: query, limit = 5 } = req.query;

        if (!query || query.trim() === '') {
            return res.json({
                success: true,
                data: {
                    suggestions: []
                }
            });
        }

        const searchQuery = query.trim();

        const suggestions = await prisma.product.findMany({
            where: {
                name: {
                    contains: searchQuery,
                    mode: 'insensitive'
                }
            },
            select: {
                name: true,
            },
            distinct: ['name'],
            take: parseInt(limit),
            orderBy: {
                name: 'asc'
            }
        });

        const formattedSuggestions = suggestions.map(product => ({
            text: product.name,
            type: 'product'
        }));

        res.json({
            success: true,
            data: {
                suggestions: formattedSuggestions
            }
        });

    } catch (error) {
        console.error('Search suggestions error:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting search suggestions',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

module.exports = {
    getSearchSuggestions,
}; 