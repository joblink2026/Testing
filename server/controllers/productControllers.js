import mongoose from "mongoose";
import Products from "../models/productModel.js";

const fallbackProducts = [
    {
        _id: "fb1",
        img: "/GenInfo/adidas.jpg",
        brand: "Adidas",
        title: "Adidas Runner Pro",
        rating: 4.8,
        reviews: 180,
        sellPrice: 3499,
        orders: "500+",
        mrp: "₹4999",
        discount: 30,
        category: "men"
    },
    {
        _id: "fb2",
        img: "/GenInfo/nike.png",
        brand: "Nike",
        title: "Nike Air Motion",
        rating: 4.7,
        reviews: 210,
        sellPrice: 4299,
        orders: "700+",
        mrp: "₹5999",
        discount: 28,
        category: "women"
    },
    {
        _id: "fb3",
        img: "/GenInfo/puma.jpg",
        brand: "Puma",
        title: "Puma Street Flex",
        rating: 4.6,
        reviews: 160,
        sellPrice: 2999,
        orders: "450+",
        mrp: "₹4499",
        discount: 33,
        category: "men"
    },
    {
        _id: "fb4",
        img: "/GenInfo/skechers.jpg",
        brand: "Skechers",
        title: "Skechers Comfort Walk",
        rating: 4.9,
        reviews: 260,
        sellPrice: 3899,
        orders: "900+",
        mrp: "₹5499",
        discount: 29,
        category: "adult"
    },
    {
        _id: "fb5",
        img: "/shoe.png",
        brand: "Nike",
        title: "Nike Urban Core",
        rating: 4.5,
        reviews: 140,
        sellPrice: 2799,
        orders: "350+",
        mrp: "₹3999",
        discount: 25,
        category: "women"
    },
    {
        _id: "fb6",
        img: "/box.png",
        brand: "Adidas",
        title: "Adidas Kids Sprint",
        rating: 4.4,
        reviews: 120,
        sellPrice: 1999,
        orders: "300+",
        mrp: "₹2999",
        discount: 20,
        category: "child"
    },
    {
        _id: "fb7",
        img: "/GenInfo/puma.jpg",
        brand: "Puma",
        title: "Puma Kids Blaze",
        rating: 4.3,
        reviews: 95,
        sellPrice: 1799,
        orders: "220+",
        mrp: "₹2499",
        discount: 18,
        category: "child"
    },
    {
        _id: "fb8",
        img: "/shoe.png",
        brand: "Skechers",
        title: "Skechers Everyday Lite",
        rating: 4.6,
        reviews: 175,
        sellPrice: 3199,
        orders: "600+",
        mrp: "₹4499",
        discount: 27,
        category: "adult"
    }
];

const isDbReady = () => mongoose.connection.readyState === 1;

const normalize = (value) => String(value ?? "").toLowerCase().trim();

const normalizeCategory = (category) => {
    const value = normalize(category);
    if (value === "unisex") return "adult";
    if (value === "kids") return "child";
    return value;
};

const localMatchesText = (product, term) => {
    const needle = normalize(term);
    if (!needle) return true;
    return [
        product.title,
        product.brand,
        product.category
    ].some((field) => normalize(field).includes(needle));
};

const localSearch = (products, query) => {
    const cleaned = query
        .replace(/kids|boys|girls/gi, "child")
        .replace(/mens/gi, "men")
        .replace(/womens/gi, "women")
        .replace(/\b(shoe|shoes)\b/gi, " ")
        .replace(/'/g, "")
        .trim();

    const terms = cleaned.split(/\s+/).filter(Boolean);
    if (terms.length === 0) return [];

    return products.filter((product) => terms.some((term) => localMatchesText(product, term)));
};

const localFilter = (products, query) => {
    const { brand, rating, category, price, discount } = query;
    return products.filter((product) => {
        if (brand && !normalize(product.brand).includes(normalize(brand))) {
            return false;
        }

        if (rating) {
            const ratingValue = parseFloat(rating);
            if (!Number.isNaN(ratingValue) && Number(product.rating) < ratingValue) {
                return false;
            }
        }

        if (category) {
            const productCategory = normalize(product.category);
            const requestedCategory = normalizeCategory(category);
            if (productCategory !== requestedCategory) {
                return false;
            }
        }

        if (price) {
            const priceRangeMatch = price.match(/₹(\d+)-₹(\d+)/);
            if (priceRangeMatch) {
                const minPrice = parseFloat(priceRangeMatch[1].replace(",", ""));
                const maxPrice = parseFloat(priceRangeMatch[2].replace(",", ""));
                const value = Number(product.sellPrice);
                if (value < minPrice || value > maxPrice) return false;
            } else if (price === "₹3000+") {
                if (Number(product.sellPrice) < 3000) return false;
            }
        }

        if (discount) {
            const discountMatch = discount.match(/(\d+)%/);
            if (discountMatch) {
                const discountValue = parseInt(discountMatch[1], 10);
                if (Number(product.discount) < discountValue) {
                    return false;
                }
            }
        }

        return true;
    });
};

const localListLookup = (list) => {
    const idArray = list.split(",").map((id) => id.trim()).filter(Boolean);
    return fallbackProducts.filter((product) => idArray.includes(String(product._id)));
};

//Get all products
export const getProducts = async (req, res) => {
    try {
        const products = isDbReady() ? await Products.find() : fallbackProducts;
        res.status(200).json(products);
    } catch (error) {
        console.error(`Error while fetching products: ${error.message}`);
        res.status(500).json({ message: error.message });
    }
};

//Get single product by id
export const getProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const product = isDbReady()
            ? await Products.findById(id)
            : fallbackProducts.find((item) => String(item._id) === String(id));

        if (!product) {
            return res.status(400).json({ message: "Product doesn't exist." });
        }

        res.status(200).json(product);
    } catch (error) {
        console.error(`Error while fetching product: ${error.message}`);
        res.status(500).json({ message: error.message });
    }
};

//Add a product
export const addProduct = async (req, res) => {
    try {
        const { img, brand, title, rating, reviews, sellPrice, orders, mrp, discount, category } = req.body;

        if (!isDbReady()) {
            const newProduct = {
                _id: `fb-${Date.now()}`,
                img,
                brand,
                title,
                rating,
                reviews,
                sellPrice,
                orders,
                mrp,
                discount,
                category
            };
            fallbackProducts.unshift(newProduct);
            return res.status(201).json({ message: "Product created successfully", product: newProduct });
        }

        const newProduct = await Products.create({ img, brand, title, rating, reviews, sellPrice, orders, mrp, discount, category });
        return res.status(201).json({ message: "Product created successfully", product: newProduct });
    } catch (error) {
        console.error(`Error while adding product: ${error.message}`);
        res.status(500).json({ message: error.message });
    }
};

//Get products by Category
export const getByCategory = async (req, res) => {
    const { category } = req.params;
    try {
        const normalizedCategory = normalizeCategory(category);
        const products = isDbReady()
            ? await Products.find({ category: normalizedCategory })
            : fallbackProducts.filter((product) => normalize(product.category) === normalizedCategory);

        res.status(200).json(products);
    } catch (error) {
        console.error("Error fetching products:", error.message);
        res.status(500).send("Internal Server Error");
    }
};

//Get top rated
export const getTopRated = async (req, res) => {
    try {
        const topRatedShoes = isDbReady()
            ? await Products.find().sort({ rating: -1 }).limit(12)
            : [...fallbackProducts].sort((a, b) => Number(b.rating) - Number(a.rating)).slice(0, 12);

        return res.status(200).json(topRatedShoes);
    } catch (err) {
        console.error("Error fetching top-rated shoes:", err);
        res.status(500).send("Internal Server Error");
    }
};

//Get best Sellers
export const getBestSellers = async (req, res) => {
    try {
        const products = isDbReady()
            ? await Products.find().sort({ reviews: -1 }).limit(12)
            : [...fallbackProducts].sort((a, b) => Number(b.reviews) - Number(a.reviews)).slice(0, 12);

        return res.status(200).json(products);
    } catch (err) {
        console.error("Error fetching top-rated shoes:", err.message);
        res.status(500).send("Internal Server Error");
    }
};

//Get search results
export const searchProducts = async (req, res) => {
    try {
        let query = req.query.q ? req.query.q.trim() : "";
        if (query.length === 0) {
            return res.status(400).json({ message: "Empty search field" });
        }

        if (!isDbReady()) {
            const results = localSearch(fallbackProducts, query);
            return res.json(results);
        }

        if (query.includes("sneakers")) {
            query = query.replace("sneakers", "sneaker");
        }

        query = query.replace(/kids|boys|girls/gi, "child");
        query = query.replace(/mens/gi, "men");
        query = query.replace(/womens/gi, "women");
        query = query.replace(/\b(shoe|shoes)\b/gi, " ").trim();
        query = query.replace(/'/g, "");

        const terms = query.split(/\s+/);
        const searchQuery = {
            $or: [
                ...terms.map((term) => ({
                    $or: [
                        { title: { $regex: term, $options: "i" } },
                        { brand: { $regex: term, $options: "i" } },
                        { category: { $in: term } }
                    ]
                }))
            ]
        };

        const results = await Products.find(searchQuery);
        res.json(results);
    } catch (error) {
        console.error("Error performing search:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

//Sort products
// export const sortProducts = async (req, res) => {
//     try {
//         const { category, criteria, order } = req.params;
//         const orderby = parseInt(order);
//
//         const result = await Products.find({ category: category })
//             .sort({ [criteria]: orderby })
//
//         if (!result) {
//             return res.status(400).json(`Product not found.`)
//         }
//         res.status(200).json(result);
//
//
//     } catch (error) {
//         console.error('Error while sorting:', error.message);
//         res.status(500).send('Internal Server Error');
//     }
// }

export const filterProducts = async (req, res) => {
    try {
        const { brand, rating, category, price, discount } = req.query;

        if (!isDbReady()) {
            const result = localFilter(fallbackProducts, req.query);
            if (result.length === 0) {
                return res.status(404).json({ message: "No products found matching the criteria." });
            }
            return res.status(200).json(result);
        }

        const filter = {};

        if (brand) filter.brand = new RegExp(brand, "i");

        if (rating) {
            const ratingValue = parseFloat(rating);
            if (!isNaN(ratingValue) && ratingValue >= 1 && ratingValue <= 5) {
                filter.rating = { $gte: ratingValue };
            }
        }

        if (category) {
            if (category === "Unisex") {
                filter.category = "adult";
            } else if (category === "Kids") {
                filter.category = "child";
            } else {
                filter.category = category.toLowerCase();
            }
        }

        let priceRange = {};
        if (price) {
            const priceRangeMatch = price.match(/₹(\d+)-₹(\d+)/);
            if (priceRangeMatch) {
                const minPrice = parseFloat(priceRangeMatch[1].replace(",", ""));
                const maxPrice = parseFloat(priceRangeMatch[2].replace(",", ""));
                priceRange = { $gte: minPrice, $lte: maxPrice };
            } else if (price === "₹3000+") {
                priceRange = { $gte: 3000 };
            }
            filter.sellPrice = priceRange;
        }

        if (discount) {
            const discountMatch = discount.match(/(\d+)%/);
            if (discountMatch) {
                const discountValue = parseInt(discountMatch[1], 10);
                filter.discount = { $gte: discountValue };
            }
        }

        const result = await Products.find(filter);

        if (result.length === 0) {
            return res.status(404).json({ message: "No products found matching the criteria." });
        }
        return res.status(200).json(result);
    } catch (error) {
        console.error("Error while filtering products:", error.message);
        res.status(500).send("Internal Server Error");
    }
};

export const listOfProducts = async (req, res) => {
    try {
        const { list } = req.params;
        const idArray = list.split(",").map((id) => id.trim()).filter(Boolean);

        if (idArray.length === 0) {
            return res.status(200).json({ message: "No product IDs provided" });
        }

        const result = isDbReady()
            ? await Products.find({ _id: { $in: idArray } })
            : localListLookup(list);

        if (result.length === 0) {
            return res.status(200).json({ message: "Products not found" });
        }

        res.status(200).json(result);
    } catch (error) {
        console.error("Error while fetching products:", error.message);
        res.status(500).send("Internal Server Error");
    }
};
