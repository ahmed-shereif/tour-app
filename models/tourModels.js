/* eslint-disable max-len */
/* eslint-disable linebreak-style */
const mongoose = require('mongoose');

// create schema
const toursSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'astory must have a name '],
    unique: true,
  },
  duration: {
    type: Number,
    required: [true, 'a tour must has a duration'],
  },
  maxGroupSize: {
    type: Number,
    required: [true, 'a tour must has a duration'],
  },
  difficulty: {
    type: String,
    required: [true, 'a tour must has a duration'],
  },
  ratingAverage: {
    type: Number,
    default: 4.5,
  },
  ratingQuantity: {
    type: Number,
    default: 0,
  },
  price: {
    type: Number,
    required: true,
  },
  priceDiscount: Number,
  summary: {
    type: String,
    trim: true,
    required: [true, 'a tour must has a duration'],
  },
  description: {
    type: String,
    trim: true,
  },
  imageCover: {
    type: String,
    required: [true, 'a tour must has a duration'],
  },
  images: [String],
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  startDate: [Date],
});

// create model from schema
//  hna byro7 y3mly collection fy al database asmha [tours] btkon wa5da shklha mn al model aly ana 3mlo da toursSchema
// [tours] da ally byro7 y3ml kol al queries 3lih lma ast5dm mthln Tour.find()=>  hwa byran 3ndo db.tours.find()
const Tour = mongoose.model('Tour', toursSchema);

// default export
module.exports = Tour;
