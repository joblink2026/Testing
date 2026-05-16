import express from "express";
import {
    addProduct,
    filterProducts,
    getBestSellers,
    getByCategory,
    getProduct,
    getProducts,
    getTopRated,
    listOfProducts,
    searchProducts,
}
    from "../controllers/productControllers.js";

const router = express.Router();

//Route to get all products
router.get('/', getProducts);

router.get('/product/:id', getProduct);

router.post("/product", addProduct);

router.get('/category/:category', getByCategory);

router.get('/filter/topRated', getTopRated);

//Route to get best sellers
router.get('/filter/bestSellers', getBestSellers)

//Route to search for an item
router.get('/products/search', searchProducts)

//Route to sort products
// router.get('/products/:category/sortby/:criteria/:order', sortProducts)

//Route to filter products
router.get('/products/filterBy', filterProducts)

//Route to get list of products
router.get('/products/:list', listOfProducts)


export default router;