/* eslint-disable linebreak-style */
/* eslint-disable import/newline-after-import */
/* eslint-disable no-console */
/* eslint-disable linebreak-style */
const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });
const Tour = require('../../models/tourModels');

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

const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours-simple.json`));

const importDAta = async () => {
  try {
    await Tour.create(tours);
    console.log('data successfully loaded');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};
const deletCollectionData = async () => {
  try {
    await Tour.deleteMany();
    console.log('all Tour data deleted');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

if (process.argv[2] === '--import') {
  importDAta();
} else if (process.argv[2] === '--deleteAll') {
  deletCollectionData();
}
console.log(process.argv[2]);
