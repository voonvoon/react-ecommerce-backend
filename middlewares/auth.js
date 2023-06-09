const admin = require('../firebase');
const Users = require("../models/user");

exports.authCheck = async (req, res, next) => {
    //console.log(req.headers); // token
    try {
        const firebaseUser = await admin.auth().verifyIdToken(req.headers.authtoken);
        //console.log('Firebase user in authcheck', firebaseUser)
        req.user = firebaseUser; // mk it available in req.user, easy access in controller.
        next();
    } catch (err) {
        console.log(err);
        res.status(401).json({
            err: "Invalide or expired token",
        });
    }
}

// exports.adminCheck = async (req, res, next) => {
//     const {email} = req.user  // cuz we alr got it from the authCheck middleware
//     //base on email can query db
//     const adminUser = await Users.findOne({email:email}).exec()

//     if(adminUser.role !== 'admin') {
//         res.status(403).json({
//             err: "Admin resource. Access denied!",
//         });
//     } else {
//         next();
//     }
// }

exports.adminCheck = async (req, res, next) => {
    const { email } = req.user;
    try {
      const adminUser = await Users.findOne({ email: email }).lean();
  
      if (adminUser && adminUser.role === 'admin') {
        next();
      } else {
        res.status(403).json({
          err: 'Admin resource. Access denied!',
        });
      }
    } catch (err) {
      next(err);
    }
  };