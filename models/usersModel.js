/* eslint-disable comma-dangle */
/* eslint-disable indent */
/* eslint-disable max-len */
/* eslint-disable linebreak-style */
const mongoose = require('mongoose');
// npm i validator
const validator = require('validator');
// npm i bcryptjs
const bcrypt = require('bcryptjs');
// built in node module
const crypto = require('crypto');

const usersSchema = new mongoose.Schema({
  name: {
    type: String,
    // required only means that it should be inputted only not sent to db
    required: [true, 'you must enter a name'],
  },
  password: {
    type: String,
    required: [true, 'you must enter a password'],
    minlength: 8,
    // this will make sure that the pass never show any where when we send requset or when we signup {this is for security}
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'you must enter a password'],
    // must be validate
    validate: {
      // this custome validation is a callback function will call when new document is created to compare password and passwordCOnfirm and return true or false if false error will happen
      // this only works on create or save queries [very important]
      // this function will only run when we create a new object from user or on save
      validator: function (passConf) {
        return passConf === this.password;
      },
      message: 'passwords are not the same',
    },
  },
  email: {
    type: String,
    required: [true, 'you must enter your email'],
    unique: true,
    lowercase: true, // transfer email to lower case
    validate: [validator.isEmail, 'please provide a valid email'],
  },
  photo: {
    type: String,
  },
  role: {
    // we specify here the role of the app user it should be one of this values user is the default role
    type: String,
    enum: ['user', 'guid', 'lead-guid', 'admin'],
    default: 'user',
  },
  passwordChangedAt: { type: Date }, // this will hold the time that the password changed at
  passwordResetToken: String,
  passwordResetExpire: Date,
  // this is will be set to false if the user want to delete his account because we never actually  delete data
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

// _____________________________________________
// _____________________________________________
// _____________________________________________
// middle ware to incrypt the password before sending it to the db
// pre('save') is a middle ware runs between getting data and saving it to db so this is a best time to manipulate the data before saving it to db

// we must never save password as it is in database we must encrypt it
// we will use mongoose middleware to encrypt the pass
// the middle ware fn will happen between the momoent that we recive the data and the moment that we actually sending it to db
// we use async fn because bcrypt returns promise
usersSchema.pre('save', async function (next) {
  // we will encrypt the pass if the pass field is actually been updated only we the pass is really changed or when it is created for the first time
  // this refers to the user where the fn is called by
  // if the pass didnt modified then do nothing and go to next step
  // عشان ممكن يكون المستخدم بيعمل تغيير للايمل فقط فمش هحتاج اغر الباسورد ثانى
  if (!this.isModified('password')) {
    return next();
  }
  // we will hash the pass by algorithm called bcrypt //npm i bcryptjs
  // 12 represents the hash cost the higher the number the more it is secured
  this.password = await bcrypt.hash(this.password, 12);
  // then i will delete the field of the confirmPassword from db becausse i dont want it any more.
  // i only needed to check that the pass is the same
  this.passwordConfirm = undefined;
  return next();
});
// _____________________________________________
// _____________________________________________
//-------------------------------------------------
// function to check if the given password is equal to the pass in db
// we will use new thing called instanse method
// instanse method => is a method that is available on all the document of a certain collection like user
/**
 *
 * Functions added to the methods property of a schema get compiled into the Model prototype and exposed on each document instance:
 */
usersSchema.methods.isCorrectPassword = async function (
  candidatePassword,
  userPassword
) {
  // this fn will return true if the pass is the same and false if not
  return bcrypt.compare(candidatePassword, userPassword);
};

// ``````````````````````````````````````````````````````````````````
// ``````````````````````````````````````````````````````````````````
// ``````````````````````````````````````````````````````````````````
// in instance mehod this key word refers to the current document

usersSchema.methods.changePasswordAfter = function (JWTTimesstamp) {
  //  if the password is changed then passwordCangedAt property will has a value
  if (this.passwordChangedAt) {
    // getTime() will get the time in millisecond so i divided by / 1000 to conver it to second and compare it with JWTTimesstamp
    const changetTimeStamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    console.log(changetTimeStamp, JWTTimesstamp);
    // if the passwordchangeAt > JWTTimestamp   this means  that the pass is changed after the token is initiated
    return JWTTimesstamp < changetTimeStamp;
  }
  // false measns NOt Changed
  return false;
};

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~|
// password reset middleware
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~|

usersSchema.methods.createPasswordResetToken = function () {
  console.log('👦');
  // crypto is like bycript but less secure
  // this will create a random password and then we will hash it and save it in the db
  // and send the unhasherd token password to user email, so then we can compare between both of them
  const resetToken = crypto.randomBytes(32).toString('hex');
  // this will hash reset pass and save it to db
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // I want this password to Expire after a 10 minutes only
  this.passwordResetExpire = Date.now() + 10 * 60 * 1000;

  console.log(resetToken, this.passwordResetToken, this.passwordResetExpire);
  // i will return this password to then send it to user email
  return resetToken;
};

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// update passwordChangedAt after it is changed by the email and token
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
usersSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) {
    return next();
  }
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~|
// this is query middle ware it run before every query starts with find I          |
// i need it to check if user.active is true so complete query or false so stop    |
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~|

usersSchema.pre(/^find/, function (next) {
  // $ne means not equal
  this.find({ active: { $ne: false } });
  next();
});

// A model is a class with which we construct documents.
// In this case, each document will be a User with properties and behaviors as declared in our schema.
const User = mongoose.model('User', usersSchema);

module.exports = User;
