const  Category = require('../models/category');
const Product = require("../models/product");
const Sub = require('../models/sub');
const slugify = require('slugify');

exports.create = async(req, res) => {
    try {
        const { name } = req.body // deconstruct , frm frt end body
        const category = await new Category({name, slug: slugify(name)}).save();
        res.json(category);

    } catch(err) {
        //console.log(err)
        res.status(400).send('Create category failed')
    }
};

exports.list = async(req, res) => {
    res.json(await Category.find({}).sort({ createAt: -1 }).exec());
}

exports.read = async(req, res) => {
    let category = await Category.findOne({ slug: req.params.slug }).exec();
    //res.json(category);
   const products = await Product.find({category: category})  // find product base on category above found
    .populate('category')
    .exec();

    res.json({
        category,
        products,
    });
};

exports.update = async(req, res) => {
    const { name } = req.body;
    try {
        const updated = await Category.findOneAndUpdate(
            { slug: req.params.slug }, // what to update
             { name, slug:slugify(name) }, //update with what
             { new: true }  // tis 3rd argu to mk sure return new info , else old info also there
             );
             res.json(updated)  
    } catch (err) {
        res.status(400).send('update category failed')
    }
}

exports.remove = async(req, res) => {
    try{
        const deleted = await Category.findOneAndDelete({ slug: req.params.slug });
        res.json(deleted);
    } catch (err){
        res.status(400).send('delete category failed')
    }
};

// exports.getSubs = (req, res) => {
//     Sub.find({parent: req.params._id}).exec((err, subs) => {
//         if(err) console.log(err);
//         res.json(subs);
//     });
// };

exports.getSubs = async (req, res) => {
    try {
        const subs = await Sub.find({ parent: req.params._id });
        res.json(subs);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Internal server error' });
    }
};
