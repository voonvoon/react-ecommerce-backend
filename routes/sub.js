const express = require('express')

const router = express.Router() // router method from express

//middleware
const { authCheck, adminCheck } = require("../middlewares/auth");
//controller
const { create, read, update, remove, list } = require("../controllers/sub");

// routes
router.post("/sub", authCheck, adminCheck, create);
router.get("/subs", list ); // this is public no need middleware check auth
router.get("/sub/:slug", read);
router.put("/sub/:slug", authCheck, adminCheck, update);
router.delete("/sub/:slug", authCheck, adminCheck, remove);


  module.exports = router;