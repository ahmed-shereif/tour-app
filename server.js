/* eslint-disable linebreak-style */
/* eslint-disable padded-blocks */
/* eslint-disable linebreak-style */
const dotenv = require('dotenv');
const mongoose = require('mongoose');

// to read the environment var in confic.env and save them to node js environmental variables
dotenv.config({ path: './config.env' });

const app = require('./app.js');

// to connect to database
const DB = process.env.DaTABASE;
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('DB connected successfully');
  });

// console.log(DB);
// to get all env
// console.log(process.env);
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`listening to ${port}`);
});
