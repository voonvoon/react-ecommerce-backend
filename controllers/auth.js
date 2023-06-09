const Users = require('../models/user');

exports.createOrUpdateUser = async (req, res) => {
    const { name, picture, email } = req.user;  // cuz in middleware we hv req.user = firebaseUser. now info avail here.

    const user = await Users.findOneAndUpdate({email:email}, {name:email.split("@")[0], picture:picture}, {new: true})

    if(user) {
        //console.log('User updated', user)
        res.json(user);
    } else {
        const newUser = await new Users({
            email,
            name: email.split("@")[0],
            picture,
        }).save();
        //console.log('USER CREATED', newUser)
        res.json(newUser);
    }
  };

  //below code differnt from teacher
exports.currentUser = async (req, res) => {
    try {
      const user = await Users.findOne({ email: req.user.email });
      res.json(user);
    } catch (err) {
      throw new Error(err);
    }
  };