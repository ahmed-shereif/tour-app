/* eslint-disable no-console */
/* eslint-disable linebreak-style */
// eslint-disable-next-line linebreak-style
/* eslint-disable no-multiple-empty-lines */
/* eslint-disable padded-blocks */
/* eslint-disable linebreak-style */
// const { json } = require('express/lib/response');
const Tour = require('../models/tourModels');

exports.createTour = async (req, res) => {
  try {
    const newTour = await Tour.create(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        tour: newTour,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: 'invalid data',
    });
  }
};

exports.getAllTours = async (req, res) => {
  try {
    // BUILD QUERY
    const queryObj = { ...req.query };
    // i want to remove any property by this name from my object because this query are not
    // filter to the document so it will ruen the filter this properties are paginatian and sorting
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach((el) => delete queryObj[el]);

    // 1) Advance filtering
    // to replace gte gt lt lte with $gte $lte $lt $lte to become a valid query
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lt|lte)\b/g, (match) => `$${match}`);
    console.log(JSON.parse(queryStr));

    // هكتب ديه لوحدها وبعدين اعمل اويت عشان لو فى كذا كويرى وراء بعض يشتغلو صح
    let query = Tour.find(JSON.parse(queryStr));

    // 2) sort
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      console.log(sortBy);
      query = query.sort(sortBy);
    }
    // 3) fileds
    if (req.query.fields) {
      const sortBy = req.query.fields.split(',').join(' ');
      console.log(sortBy);
      query = query.select(sortBy);
    }

    // 4) pagination

    const page = req.query.page * 1;
    const limit = req.query.limit * 1;
    const skip = (page - 1) * limit;
    query = query.skip(skip).limit(limit);

    const allTours = await query;
    res.status(200).json({
      status: 'success',
      results: allTours.length,
      data: {
        tours: allTours,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err,
    });
  }
};

exports.getTour = async (req, res) => {
  try {
    const tour = await Tour.findById(req.params.id);
    res.status(200).json({
      status: 'success',
      data: tour,
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err,
    });
  }
};

exports.updateTour = async (req, res) => {
  try {
    const tour = await Tour.findOneAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    res.status(200).json({
      status: 'sucsess',
      data: {
        tour,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err,
    });
  }
};

exports.deletTour = async (req, res) => {
  try {
    const tour = await Tour.findByIdAndDelete(req.params.id);
    res.status(201).json({
      status: 'success',
      data: {
        tour,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err,
    });
  }
};
