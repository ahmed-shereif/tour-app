/* eslint-disable linebreak-style */
const express = require('express');
// eslint-disable-next-line import/newline-after-import
const toursContrallers = require('../controllers/toursControllers');
const authcontroller = require('../controllers/authControler');

const router = express.Router();

router
  .route('/')
  .get(authcontroller.protect, toursContrallers.getAllTours)
  .post(toursContrallers.createTour);

router
  .route('/:id')
  .get(toursContrallers.getTour)
  .patch(toursContrallers.updateTour)
  .delete(
    authcontroller.protect,
    authcontroller.restrictTo('admin', 'lead-guide'),
    toursContrallers.deletTour
  );

module.exports = router;
