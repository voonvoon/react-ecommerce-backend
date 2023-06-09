const Sub = require('../models/sub');
const Product = require("../models/product");
const slugify = require('slugify');

exports.create = async(req, res) => {
    try {
        const { name, parent } = req.body // deconstruct , frm frt end body
        const sub = await new Sub({name, parent, slug: slugify(name)}).save();
        res.json(sub);

    } catch(err) {
        console.log("Sub Create Error ==>", err)
        res.status(400).send('Create sub failed')
    }
};

exports.list = async(req, res) => {
    res.json(await Sub.find({}).sort({ createAt: -1 }).exec());
}

exports.read = async(req, res) => {
    let sub = await Sub.findOne({ slug: req.params.slug }).exec();
    const products = await Product.find({ subs: sub })  //find subs in Product modal, value will be above single sub
    .populate('category')
    .exec();
    res.json({
        sub,
        products
    });
};

exports.update = async(req, res) => {
    const { name, parent } = req.body;
    try {
        const updated = await Sub.findOneAndUpdate(
            { slug: req.params.slug }, // what to update
             { name, parent, slug:slugify(name) }, //update with what
             { new: true }  // tis 3rd argu to mk sure return new info , else old info also there
             );
             res.json(updated)  
    } catch (err) {
        res.status(400).send('sub update failed')
    }
};

exports.remove = async(req, res) => {
    try{
        const deleted = await Sub.findOneAndDelete({ slug: req.params.slug });
        res.json(deleted);
    } catch (err){
        res.status(400).send('delete sub failed')
    }
};