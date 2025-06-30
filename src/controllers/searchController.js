const { PrismaClient } = require('@prisma/client');

// Create a new Prisma client instance
const prisma = new PrismaClient();

//ETAPE REDIS 
//1 CRÉER UN VOLUME REDIS / AVOIR UN REDIS EN CLOUD
//2 INSTALLER NODE REDIS
//3 CONFIGURER LE CLIENT REDIS => URL 

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

        // créer key : `search:${searchQuery}:${limit}`
        // => search_product:5
        // => search_product_a:5

        // chercher si la clé existe dans ma basde redis => client.get(key)
        // si elle existe => return en json la valeur de cette clé
        // sinon, faire la requête à la base de données
        //stocker a données retournée (depuis Prisma/Postgre) en cache dans redis

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