const express = require('express')

const router = express.Router() // router method from express

//middleware
const { authCheck, adminCheck } = require("../middlewares/auth");

//controller
const { create, read, update, remove, list, getSubs } = require("../controllers/category");

// routes
router.post("/category", authCheck, adminCheck, create);
router.get("/categories", list ); // this is public no need middleware check auth
router.get("/category/:slug", read);
router.put("/category/:slug", authCheck, adminCheck, update);
router.delete("/category/:slug", authCheck, adminCheck, remove);
router.get("/category/subs/:_id", getSubs);


  module.exports = router;