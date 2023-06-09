//mongo pw:wVOew1SBGBM37BEI
//mongo username: peter_zai

const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const cors = require('cors');
const { readdirSync } = require('fs');  //from node module, no need npm i
require('dotenv').config();

 // import route

//app
const app = express() // execute express here, so it available here

//db
mongoose
  .connect(process.env.DATABASE, {})
  .then(() => console.log("DB connected"))
  .catch((err) => console.log("DB Error => ", err));

  //middleware
  app.use(morgan("dev")); 
  app.use(bodyParser.json({ limit: "2mb" }));
  app.use(cors());



 // routes middleware
  //app.use('/api', authRoutes);
  readdirSync("./routes").map((r) => app.use("/api",require('./routes/' + r)));

  //port
  const port  = process.env.PORT || 8000;

  app.listen(port, () => console.log(`Server is running on port${port}`));