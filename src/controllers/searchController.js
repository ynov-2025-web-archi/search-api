const { PrismaClient } = require('@prisma/client');
const { createClient } = require('redis');

// Create a new Prisma client instance
const prisma = new PrismaClient();

//ETAPE REDIS 
//3 CONFIGURER LE CLIENT REDIS => URL 

// Get search suggestions (autocomplete) by name
const getSearchSuggestions = async (req, res) => {

    const client = await createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        legacyMode: true
    })
        .on('error', err => console.log('Redis Client Error', err))
        .connect();

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
        const key = `search:${searchQuery}:${limit}`;
        const cachedSuggestions = await client.get(key);
        if (cachedSuggestions) {
            console.log('Search suggestions from cache:', JSON.parse(cachedSuggestions));
            return res.json({
                success: true,
                data: {
                    suggestions: JSON.parse(cachedSuggestions)
                }
            });
        }

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

        await client.set(key, JSON.stringify(formattedSuggestions));

        console.log('Search suggestions:', formattedSuggestions);

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