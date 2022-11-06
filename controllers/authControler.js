/* eslint-disable no-else-return */
/* eslint-disable space-before-blocks */
/* eslint-disable arrow-body-style */
/* eslint-disable comma-dangle */
/* eslint-disable consistent-return */
/* eslint-disable operator-linebreak */
/* eslint-disable prefer-destructuring */
/* eslint-disable no-underscore-dangle */
//  npm i jsonwebtoken
const bcrypt = require('bcryptjs');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/usersModel');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/email');
const crypto = require('crypto');
const { findOne } = require('../models/usersModel');

// create token function
function signToken(id) {
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
}
// send token function
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user.id);
  const cookieOptions = {
    // this will make browser delete cookie after this date in millisecond
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true, // this will prevent any manibulation in cookie by the browser
  };
  // when secure:true this will send the cookie only on https and this will not available in devlopment env so i need to put it only when we are in production
  if (process.env.NODE_ENV === 'production') {
    cookieOptions.secure = true;
  }

  // add cookie to res object with name="jwt" value= token
  // cookie(name,value,options)
  res.cookie('jwt', token, cookieOptions);

  //  remove password from output so it doesnt show in response
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

// ~~~~~~~~~~~~~~|
//  sign up fn   |
// ~~~~~~~~~~~~~~|
exports.signup = async (req, res) => {
  try {
    // I will send this instead of sending all the req.body
    // to avoid any one adding him self as an admin and we can add  admin directly from mongo db
    const newUser = await User.create({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      passwordConfirm: req.body.passwordConfirm,
      passwordChangedAt: req.body.passwordChangedAt,
    });
    console.log('assdasdad');
    // this is the mongodb id =>> _id
    createSendToken(newUser, 201, res);
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err,
    });
  }
};

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~|
// logging user in function   |
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~|

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    // 1)check if the email and password is actually exists
    if (!email || !password) {
      return next(new AppError('Please provide email and password!', 400));
    }
    // 2) CHeck if user exists&& password is correct
    // ----------------------------------------------
    // select('+password') to select a field that took select:false in usermodel.
    // so +password select the field that is shouldnt be selectted
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return next(new AppError('incorrect email or password', 401));
    }

    // isCorrectPassword => is an instance method availabe on any document of the user collection ,directly without epxorting it
    const correct = await user.isCorrectPassword(password, user.password);

    if (!user || !correct) {
      return next(new AppError('incorrect email or password', 401));
    }

    // 3) if every thing is ok ,send token to client////if there is a token this means that this user is logedin
    // ----------------------------------------------

    createSendToken(user, 200, res);
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err,
    });
  }
};

// |~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~|
// | protecting route middleware      |
// |~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~|

exports.protect = async (req, res, next) => {
  // 1) getting the token and check of it's there
  // ------------------------------------------
  let token;
  if (
    req.headers.authoriztion &&
    req.headers.authoriztion.startsWith('Bearer')
  ) {
    // getting the user token sent in req by cookies
    token = req.headers.authoriztion.split(' ')[1];
  }

  if (!token) {
    return next(
      new AppError('You are not logged in! please log in to get access. ', 401)
    );
  }
  // 2) verification token
  // --------------------
  // jwt.verify() is a function that verify the passed token and check if it is valid or not
  // jwt.verify(token,server secret,callback fn has the decoded data from token)
  // promisify is a built in method in nodejs that takes a function with callbackfn an make it return promise instead, to be easier to use
  let decoded;
  try {
    decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    console.log(decoded);
  } catch (err) {
    return next(new AppError(err));
  }

  // without promisify
  // ```````````````````
  // jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
  //   // if the token is valid it will be decoded and get back the payload in decoded
  //   console.log('aaaaaaaaaaaaaaaaaaaaaaaaa', decoded);
  //   if (err) {
  //     return next(new AppError(err));
  //   }
  // });

  // 3)check if user is still exists in db and did not deleted
  // ---------------------------------------------------------
  const curentUser = await User.findById(decoded.id);
  console.log(curentUser);
  if (!curentUser) {
    return next(new AppError('The User is No longer exist'));
  }
  // 4) check if user changed password after the token was issued
  if (curentUser.changePasswordAfter(decoded.iat)) {
    return next(
      new AppError(
        'User recently changed the password! Please login again.',
        401
      )
    );
  }

  // you are now has access to the route, so i will call next()
  // then I will add the user to the request to be availabe to use at any time after his middleware instead of getting it again every time
  // so the user will be available in any middleware after the protected bec I added it to the req
  req.user = curentUser;
  next();
};

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~|
// add middleWare to give some user a privalage/authoriztion  to delete a tour |
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~|
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // rolse will be availbe in this fn due to closure
    if (roles.includes(req.user.role)) {
      next();
    } else {
      return next(new AppError('you dont have the access to do this action'));
    }
  };
};

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~|
// forgotPassword fn           |
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~|

exports.forgotPassword = async (req, res, next) => {
  try {
    // 1) Get uSer based on posted email
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      return next(new AppError('ther is no user with email address', 404));
    }
    // 2) Generate the random reset token
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~``
    const resetToken = user.createPasswordResetToken();
    console.log('💇‍♀️', resetToken);
    // this will save the resetpassword created by the function to this specific user
    // we need to add .save({validateBeforeSave:false}) to avoid revalidation of all the feel as we updating only one feeld
    await user.save({ validateBeforeSave: false });
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // 3) Send Email to user's Email
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // building the url that it will be sent to the user inbox to hit this link and reset his password
    // and we build this email like that to work in devloping and production environment
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}`;

    const message = `Forgot your password? Submit a PATCH request with your new password and Passwordconfirm to: ${resetURL}.\n if you
    didn't forget your password, please ignore this message 
    `;
    // actually sending the email
    try {
      console.log('😑', '0000000000000000000000000');
      await sendEmail({
        email: user.email,
        subject: 'you password reset token (valid for 10 min) ',
        message,
      });
      res.status(200).json({
        status: 'success',
        message: 'Token sent to email!',
      });
    } catch (err) {
      // if the message didnt sent correctly then remove all tokens from db
      user.passwordResetToken = undefined;
      user.passwordResetExpire = undefined;
      await user.save({ validateBeforeSave: false });

      return next(
        new AppError(
          'there was an error sending the email. Try again later! ',
          500
        )
      );
    }
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err,
    });
  }
};

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~|
// resetPassword fn            |
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~|
exports.resetPassword = async (req, res, next) => {
  try {
    // 1)Get user based on the token
    // ``````````````````````````````
    // check if the token with in the Url is actually the same as the resretToken in db

    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');
    // get the user by the reset token
    console.log('🦹', hashedToken);
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpire: { $gt: Date.now() },
    });

    console.log(user);

    // 2) if the token has not expired , and there is user ,set the new password
    // ````````````````````````````````````````````````````````````````````````````
    if (!user) {
      return next(new AppError('TOken is invalid or has expired', 400));
    }
    // set the new pass
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpire = undefined;
    // then save every thing to db
    // we allways need to use save not update one because save run all validator and middle ware again by default which i needed in password
    await user.save();
    // 3) update ChangedPasswordAt property for the user
    // ``````````````````````````````````````````````````
    // 4)lo the user in , send JWT to the client
    // ```````````````````````````````````````````
    const token = signToken(user._id);
    res.status(201).json({
      status: 'success',
      token,
      data: {
        user,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err,
    });
  }
};

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~|
// upadting the current user password              |
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~|

exports.updatePassword = async (req, res, next) => {
  try {
    // 1) getting the token and check of it's there
    // ------------------------------------------

    let token;
    if (
      req.headers.authoriztion &&
      req.headers.authoriztion.startsWith('Bearer')
    ) {
      // getting the user token sent in req by cookies
      token = req.headers.authoriztion.split(' ')[1];
    }

    if (!token) {
      return next(
        new AppError(
          'You are not logged in! please log in to get access. ',
          401
        )
      );
    }
    // 2) verification token
    // --------------------
    // jwt.verify() is a function that verify the passed token and check if it is valid or not
    // jwt.verify(token,server secret,callback fn has the decoded data from token)
    // promisify is a built in method in nodejs that takes a function with callbackfn an make it return promise instead, to be easier to use
    let decoded;
    try {
      decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
      console.log(decoded);
    } catch (err) {
      return next(new AppError(err));
    }

    const currentUser = await User.findOne({ _id: decoded.id }).select(
      '+password'
    );

    if (!currentUser) {
      return next(new AppError('wrong credentials'));
    }

    const { oldPassword, newPassword } = req.body;

    const isCorrectPassword = await currentUser.isCorrectPassword(
      oldPassword,
      currentUser.password
    );
    console.log('😏', isCorrectPassword);
    if (!isCorrectPassword) {
      return next(new AppError('WRONG CREDENTIALS!'));
    }

    let newToken;
    if (isCorrectPassword) {
      currentUser.password = newPassword;
      currentUser.passwordConfirm = newPassword;
      newToken = signToken(currentUser._id);
      await currentUser.save();
    }

    res.status(201).json({
      status: 'success',
      token: newToken,
      message: 'password is updated correctly ',
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err,
    });
  }
};
