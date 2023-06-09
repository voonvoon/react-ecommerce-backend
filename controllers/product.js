const { query } = require("express");
const Product = require("../models/product");
const Users = require("../models/user"); // i import it myself first
const slugify = require("slugify");

exports.create = async (req, res) => {
  try {
    console.log(req.body); // tis see whatever data from frnt end receive here in bc end.
    req.body.slug = slugify(req.body.title); // can create slug bs on title and add to req.body itself.
    const newProduct = await new Product(req.body).save();
    res.json(newProduct);
  } catch (err) {
    console.log(err);
    //res.status(400).send("Create product failed!")
    res.status(400).json({
      err: err.message,
    });
  }
};

exports.listAll = async (req, res) => {
  let products = await Product.find({})
    .limit(parseInt(req.params.count)) //mk sure is integer !string
    .populate("category") // in product modal we hv tis with ref , so can populate
    .populate("subs") // in product modal we hv tis with ref , so can populate
    .sort([["createAt", "desc"]])
    .exec();
  res.json(products);
};

exports.remove = async (req, res) => {
  try {
    const deleted = await Product.findOneAndRemove({
      slug: req.params.slug,
    }).exec(); // cuz we use slug so don't use find id method.
    res.json(deleted);
  } catch (err) {
    console.log(err);
    return res.status(400).send("Product delete failed!");
  }
};

exports.read = async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug })
    .populate("category")
    .populate("subs")
    .exec();
  res.json(product);
};

// take note to only update title not slug for benefit of SEO in future
exports.update = async (req, res) => {
  try {
    // tis for update slug , if update title slug will update too.
    if (req.body.title) {
      req.body.slug = slugify(req.body.title);
    }
    const updated = await Product.findOneAndUpdate(
      { slug: req.params.slug }, // which to update
      req.body, // update with what - everything
      { new: true } // if want res with all new updated info use tis.else old data will show.
    ).exec();
    res.json(updated);
  } catch (err) {
    console.log("Product Updata Error --->", err);
    //return res.status(400).send("Product update failed!");
    res.status(400).json({
      err: err.message,
    });
  }
};

// NO PAGINATION
// exports.list = async (req, res) => {
//   try {
//     //sort: createdAt/ updatedAt, order:desc/asc, limit:3
//     const  { sort, order, limit} = req.body
//     const products = await Product.find({})
//     .populate('category')
//     .populate('subs')
//     .sort([[sort, order]])   // more than 1 so uses 2 array.
//     .limit(limit)
//     .exec();

//     res.json(products);
//   } catch (err) {
//     console.log(err)
//   }
// }

//With Pagination
exports.list = async (req, res) => {
  //console.table(req.body);    // see what data send from frt to bc end/
  try {
    //sort: createdAt/ updatedAt, order:desc/asc, page
    const { sort, order, page } = req.body;
    const currentPage = page || 1;
    const perPage = 3;

    const products = await Product.find({})
      .skip((currentPage - 1) * perPage)
      .populate("category")
      .populate("subs")
      .sort([[sort, order]]) // more than 1 so uses 2 array.
      .limit(perPage)
      .exec();

    res.json(products);
  } catch (err) {
    console.log(err);
  }
};

exports.productsCount = async (req, res) => {
  let total = await Product.find({}).estimatedDocumentCount().exec(); // estima... is mongoose method.
  res.json(total);
};

exports.productStar = async (req, res) => {
  //find the product
  const product = await Product.findById(req.params.productId).exec();
  //also find user
  const user = await Users.findOne({ email: req.user.email }).exec(); // cuz we apply authcheck middleware so can access req.user from firebase

  const { star } = req.body; // will be: 1,2,3,4,5
  // who is updating?

  //check if currently logged in user hv already added rating to tis product?
  let existingRatingObject = product.ratings.find(
    (ele) => ele.postedBy.toString() === user._id.toString() // toString() so both type is string so can compare. or jz user ==
  ); // so it will return the object or undefine

  // if user haven't left rating yet = undefine. push it:
  if (existingRatingObject === undefined) {
    let ratingAdded = await Product.findOneAndUpdate(
      product._id, // which product to update?
      {
        $push: { ratings: { star: star, postedBy: user._id } }, // append a new object to the ratings array in a document of the Product collection.
      },
      { new: true } // if don't use it only update in db not in the var ratingAdded cuz not return from mongo
    ).exec();
    console.log("ratingAdded", ratingAdded);
    res.json(ratingAdded);
  } else {
    //if user already left rating. update it
    const ratingUpdated = await Product.updateOne(
      {
        ratings: { $elemMatch: existingRatingObject }, // tis way means update with object already in rating array.
      }, //$elemMatch is a MongoDB operator used to match an element in an array.
      { $set: { "ratings.$.star": star } }, // tis way only update star wont touch userId.
      //"ratings.$.star" is a string that represents the field to be updated.
      //The $ character is a positional operator that refers to the matched element in the "ratings" array.
      { new: true }
    ).exec();
    console.log("ratingUpdated", ratingUpdated);
    res.json(ratingUpdated);
  }
};

exports.listRelated = async (req, res) => {
  const product = await Product.findById(req.params.productId).exec();

  const related = await Product.find({
    _id: { $ne: product._id }, //$ne = not include
    category: product.category, // can use more than 1 expression here to query db. _id & category
  })
    .limit(3)
    .populate("category")
    .populate("subs")
    //populate('postedBy')
    .exec();

  res.json(related);
};

// Search  / Filter

const handleQuery = async (req, res, query) => {
  const products = await Product.find({ $text: { $search: query } }) // mongodb text search
    .populate("category", "_id name")
    .populate("subs", "_id name")
    //.populate('postedBy', '_id name')
    // .populate({
    //   path: 'postedBy',
    //   select: '_id name',
    //   options: { strictPopulate: false }
    // })
    .exec();

  res.json(products);
};

const handlePrice = async (req, res, price) => {
  try {
    let products = await Product.find({
      price: {
        $gte: price[0], // greater than  -- e.g price[10, 30] so 10 is [0], 30 is [1]
        $lte: price[1], // lesser than
      },
    })
      .populate("category", "_id name")
      .populate("subs", "_id name")
      .exec();

    res.json(products);
  } catch (err) {
    console.log(err);
  }
};

const handleCategory = async (req, res, category) => {
  try {
    let products = await Product.find({ category })
      .populate("category", "_id name")
      .populate("subs", "_id name")
      .exec();

    res.json(products);
  } catch (err) {
    console.log(err);
  }
};
//this code not works:
// const handleStar =  (req, res, stars) => {
//   Product.aggregate([
//     // This stage defines the fields to include in the projected documents
//     {
//       $project: {
//         document: "$$ROOT",    // it includes the entire document
//         // title : "$title",  u can do tis too but we use above way better
//         floorAverage: {
//           $floor: { $avg: "$ratings.star" }   // if 3.33 then is 3 , mongo method
//         }

//       }
//     },
//     //This stage filters the documents based on the floorAverage field, matching it with the stars
//     //parameter passed to the handleStar function.
//     { $match: {floorAverage : stars } }
//   ])
//   .limit(12)
//   .exec((err, aggregates) => {
//     if(err) console.log('Aggregate error', err)
//     Product.find({_id:aggregates})  //the code fetches the products that match the _id values retrieved from the previous aggregation results.
//     .populate('category', '_id name')
//     .populate('subs', '_id name')
//     .exec((err, products) => {
//       if(err) console.log("Product aggregate error", err)
//       res.json(products);
//     });
//   })
// }

const handleStar = async (req, res, stars) => {
  try {
    const aggregates = await Product.aggregate([
      {
        $project: {
          document: "$$ROOT", // entire project field..
          floorAverage: {
            $floor: { $avg: "$ratings.star" },
          },
        },
      },
      { $match: { floorAverage: stars } },
    ])
      .limit(12)
      .exec();

    const productIds = aggregates.map((aggregate) => aggregate.document._id);

    const products = await Product.find({ _id: { $in: productIds } })
      .populate("category", "_id name")
      .populate("subs", "_id name")
      .exec();

    res.json(products);
  } catch (err) {
    console.log("Error", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

const handleSub = async (req, res, sub) => {
  const products = await Product.find({ subs: sub })
    .populate("category", "_id name")
    .populate("subs", "_id name")
    .exec();

  res.json(products);
};

const handleShipping = async (req, res, shipping) => {
  const products = await Product.find({ shipping })
    .populate("category", "_id name")
    .populate("subs", "_id name")
    .exec();

  res.json(products);
};

const handleColor = async (req, res, color) => {
  const products = await Product.find({ color })
    .populate("category", "_id name")
    .populate("subs", "_id name")
    .exec();

  res.json(products);
};

const handleBrand = async (req, res, brand) => {
  const products = await Product.find({ brand })
    .populate("category", "_id name")
    .populate("subs", "_id name")
    .exec();

  res.json(products);
};

exports.searchFilters = async (req, res) => {
  const { query, price, category, stars, sub, shipping, color, brand } =
    req.body; // u can call query: search..tis from client search

  if (query) {
    console.log("query", query);
    await handleQuery(req, res, query); //create tis func seperately, cuz each time input different
  }
  // e.g price [10,20]
  if (price !== undefined) {
    console.log("price --->", price);
    await handlePrice(req, res, price);
  }

  if (category) {
    console.log("Category--->", category);
    await handleCategory(req, res, category);
  }

  if (stars) {
    console.log("stars--->", stars);
    await handleStar(req, res, stars);
  }

  if (sub) {
    console.log("sub--->", sub);
    await handleSub(req, res, sub);
  }

  if (shipping) {
    console.log("shipping --->", shipping);
    await handleShipping(req, res, shipping);
  }

  if (color) {
    console.log("color --->", color);
    await handleColor(req, res, color);
  }

  if (brand) {
    console.log("brand --->", brand);
    await handleBrand(req, res, brand);
  }
};
