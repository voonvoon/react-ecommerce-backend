const express = require('express')

const router = express.Router() // router method from express

//middleware
const { authCheck, adminCheck } = require("../middlewares/auth");

//controller

//import
const {createOrUpdateUser, currentUser} = require("../controllers/auth");

router.post('/create-or-update-user', authCheck, createOrUpdateUser); //post cuz post from frt end to bc end
router.post('/current-user', authCheck, currentUser);
router.post('/current-admin', authCheck, adminCheck, currentUser);  

  module.exports = router;