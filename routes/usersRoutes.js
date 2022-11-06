/* eslint-disable linebreak-style */
const express = require('express');
const usersControllers = require('../controllers/usersControllers');
const authController = require('../controllers/authControler');

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);
router.patch('/updatePassword', authController.updatePassword);
router.patch('/updateMe', authController.protect, usersControllers.updateMe);
router.delete('/deleteMe', authController.protect, usersControllers.deleteMe);

router
  .route('/')
  .get(usersControllers.getAllUsers)
  .post(usersControllers.addUser);

router
  .route('/:id')
  .get(usersControllers.getUser)
  .patch(usersControllers.updateUser)
  .delete(usersControllers.deletUser);

module.exports = router;
