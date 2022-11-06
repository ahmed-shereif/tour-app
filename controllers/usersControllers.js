/* eslint-disable no-restricted-syntax */
/* eslint-disable no-console */
/* eslint-disable prefer-const */
/* eslint-disable no-multiple-empty-lines */
/* eslint-disable padded-blocks */
/* eslint-disable linebreak-style */
const User = require('../models/usersModel');
const AppError = require('./../utils/appError');

const filterObj = (req, ...propsToUpdate) => {
  let updatedReq = req;
  for (let key in updatedReq) {
    if (propsToUpdate.includes(key) === false) {
      console.log('---------', key);
      delete updatedReq[key];
    }
  }
  return updatedReq;
};
//  update loged in user data
exports.updateMe = async (req, res, next) => {
  try {
    // 1) create Error if user posts a password data
    if (req.body.password || req.body.passwordConfirm) {
      return next(
        new AppError("You can't update the password from here ", 400)
      );
    }

    // 2)update user document
    // I want the user not to be able to update every thing in the db because this will be insecure , bec any one can update his role to admin
    // so i must control what user can update
    // so user can update only the property that i will added to filteredBody fn and every thing else in the req.body will be ignored
    const filteredBody = filterObj(req.body, 'name', 'email');
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      filteredBody,
      {
        new: true, //to return the new user after updated not the old one
        runValidators: true,
      }
    );

    res.status(200).json({
      status: 'succes',
      data: {
        user: updatedUser,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err,
    });
  }
};

// delete user by changing active:false
exports.deleteMe = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user.id, { active: false });
    res.status(204).json({
      status: 'succes',
      data: null,
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err,
    });
  }
};

exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find();
    console.log('🤠', users);
    res.status(200).json({
      status: 'success',
      results: users.length,
      data: {
        users,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err,
    });
  }
};

exports.addUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'this route not created yet',
  });
};
exports.getUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'this route not created yet',
  });
};
exports.updateUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'this route not created yet',
  });
};

exports.deletUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'this route not created yet',
  });
};
