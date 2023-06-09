const express = require('express')
const router = express.Router() // router method from express

//middleware
const { authCheck, adminCheck } = require("../middlewares/auth");

//controller
const { create ,listAll, remove, read, update, list, productsCount, productStar, listRelated,searchFilters} = require("../controllers/product.js");

// routes
router.post("/product", authCheck, adminCheck, create);
router.get('/products/total', productsCount)
router.get("/products/:count", listAll);  // e.g products/100
router.delete("/product/:slug", authCheck, adminCheck, remove);
router.get("/product/:slug", read); // aceess to everyone 
router.put("/product/:slug",authCheck, adminCheck, update );
router.post("/products", list);  // use post cuz easy to req.param frm frt end.

//rating
router.put("/product/star/:productId", authCheck, productStar);

//related
router.get("/product/related/:productId", listRelated);

//search
router.post('/search/filters', searchFilters)


module.exports = router;