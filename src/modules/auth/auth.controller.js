import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import catchAsync from "../../utils/middleWare/catchAsyncError.js";
import AppError from "../../utils/appError.js";
import { userModel } from "../../../database/models/user.model.js";
import generateUniqueId from "generate-unique-id";
import { sendEmail } from "../../email/sendEmail.js";

export const signUp = catchAsync(async (req, res, next) => {
  let err_phone = "This Phone  already exist";
  let err_phone2 = "This Phone  is not valid";
  let err_email = "This Email  already exist";
  let err_email2 = "This Email  is not valid";
  let err_pass = "Password must be at least 8 characters";
  let text = `Email Verification Code: `;
  if (req.query.lang == "ar") {
    err_phone = "هذا الهاتف موجود بالفعل";
    err_phone2 = "هذا الهاتف غير صحيح";
    err_email = "هذا البريد الالكتروني موجود بالفعل";
    err_email2 = "هذا البريد الالكتروني غير صحيح";
    err_pass = "كلمة المرور يجب ان تكون 8 حروف على الاقل";
    text = ` : رمز التحقق من البريد الالكتروني: `;
  }
  let emailFormat = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;
  if (req.body.phone === "" || req.body.phone.length < 10) {
    return res.status(409).json({ message: err_phone2 });
  }
  if (req.body.email !== "" && req.body.email.match(emailFormat)) {
    let existUser = await userModel.findOne({ phone: req.body.phone });
    let existUser2 = await userModel.findOne({ email: req.body.email });
    if (existUser) {
      return res.status(409).json({ message: err_phone });
    }
    if (existUser2) {
      return res.status(409).json({ message: err_email });
    }
  } else {
    return res.status(409).json({ message: err_email2 });
  }


  req.body.dateOfBirth = new Date("1950/01/02");
  req.body.verificationCode = generateUniqueId({
    length: 4,
    useLetters: false,
  });
  if (req.body.password.length < 8) {
    return res.status(409).json({ message: err_pass });
  }
  req.body.password = bcrypt.hashSync(
    req.body.password,
    Number(process.env.SALT_ROUNDS)
  );

  let results = new userModel(req.body);
  let token = jwt.sign(
    { name: results.name, userId: results._id },
    process.env.JWT_SECRET_KEY
  );
  text = text + `${results.verificationCode}`;

  sendEmail(results.email, text);
  await results.save();
  res.json({ message: "added", token, results });
});

// export const signInWithPhone = catchAsync(async (req, res, next) => {
//   // let phoneFormat = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/; //+XX XXXXX XXXXX
//   let emailFormat = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;
//   if (
//     req.body.email !== "" &&
//     req.body.email.match(emailFormat) &&
//     req.body.phone !== ""
//     // req.body.phone.match(phoneFormat)
//   ) {
//     // if (req.body.phone !== "") {
//     let { phone } = req.body.phone;
//     let userData = await userModel.findOne({ phone });
//     if (!userData) return res.status(404).json({ message: "User Not Found" });
//     if (userData) {
//       let token = jwt.sign(
//         { name: userData.name, userId: userData._id },
//         process.env.JWT_SECRET_KEY
//       );
//       return res.json({ message: "success", token, userData });
//     }
//     return res.status(401).json({ message: "worng phone " });
//   } else {
//     return res.status(409).json({ message: "this phone is not valid" });
//   }
// });

export const signIn = catchAsync(async (req, res, next) => {
  let err_email2 = "this email  is not valid";
  let err_pass = "worng email or password";
  let text = `Email Verification Code: `;
  if (req.query.lang == "ar") {
    err_email2 = "هذا البريد الالكتروني غير صحيح";
    err_pass = "البريد الالكتروني او كلمة المرور غير صحيحة";
    err_admin = "انت ادمن اذهب الى صفحة تسجيل الدخول لادمن";
    text = ` : رمز التحقق من البريد الالكتروني: `;
  }
  let emailFormat = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;
  if (req.body.email !== "" && req.body.email.match(emailFormat)) {
    let { email, password } = req.body;
    let userData = await userModel.findOne({ email });
    if (!userData) return res.status(401).json({ message: err_pass });
    const match = bcrypt.compareSync(password, userData.password);
    if (match && userData) {
      // if (userData.userType == "admin") {
      //   return res.status(401).json({ message: err_admin });
      // }
      userData.verificationCode = generateUniqueId({
        length: 4,
        useLetters: false,
      });
      text = text + `${userData.verificationCode}`;
      sendEmail(userData.email, text);
      await userData.save();
      let token = jwt.sign(
        { name: userData.name, userId: userData._id },
        process.env.JWT_SECRET_KEY
      );
      let lastSignIn = new Date();
      req.lastSignIn = lastSignIn;
      return res.json({ message: "success", token, userData, lastSignIn });
    }
    return res.status(401).json({ message: err_pass });
  } else {
    return res.status(409).json({ message: err_email2 });
  }
});
export const adminSignIn = catchAsync(async (req, res, next) => {
  let err_email2 = "this email  is not valid";
  let err_pass = "worng email or password";
  let err_admin = "unoauthorized";
  let text = `Email Verification Code: `;
  if (req.query.lang == "ar") {
    err_email2 = "هذا البريد الالكتروني غير صحيح";
    err_pass = "البريد الالكتروني او كلمة المرور غير صحيحة";
    err_admin = "غير مصرح";
    text = ` : رمز التحقق من البريد الالكتروني: `;
  }
  let emailFormat = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;
  if (req.body.email !== "" && req.body.email.match(emailFormat)) {
    let { email, password } = req.body;
    let userData = await userModel.findOne({ email });
    if (!userData) return res.status(401).json({ message: err_pass });
    const match = bcrypt.compareSync(password, userData.password);
    if (match && userData) {
      if (userData.userType !== "admin") {
        return res.status(401).json({ message: err_admin });
      }
      let token = jwt.sign(
        { name: userData.name, userId: userData._id },
        process.env.JWT_SECRET_KEY
      );
      let lastSignIn = new Date();
      req.lastSignIn = lastSignIn;
      return res.json({ message: "success", token, userData, lastSignIn });
    }
    return res.status(401).json({ message: err_pass });
  } else {
    return res.status(409).json({ message: err_email2 });
  }
});

export const resend = catchAsync(async (req, res, next) => {
  let err_email = "worng email";
  let err_email2 = "this email  is not valid";
  let err_pass = "worng email or password";
  let text = `Email Verification Code: `;

  if (req.query.lang == "ar") {
    err_email = "البريد الالكتروني غير صحيح";
    err_email2 = "هذا البريد الالكتروني غير صحيح";
    err_pass = "البريد الالكتروني او كلمة المرور غير صحيحة";
    text = ` : رمز التحقق من البريد الالكتروني: `;
  }
  if (req.body.email !== "") {
    let { email } = req.body;
    let userData = await userModel.findOne({ email });
    if (!userData) return res.status(401).json({ message: err_pass });
    if (userData) {
      userData.verificationCode = generateUniqueId({
        length: 4,
        useLetters: false,
      });
      text = text + `${userData.verificationCode}`;

      sendEmail(userData.email, text);
      await userData.save();
      let token = jwt.sign(
        { name: userData.name, userId: userData._id },
        process.env.JWT_SECRET_KEY
      );
      let verificationCode = userData.verificationCode;
      return res.json({
        message: "success",
        verificationCode,
        userData,
        token,
      });
    }
    return res.status(401).json({ message: err_email });
  } else {
    return res.status(409).json({ message: err_email2 });
  }
});
export const forgetPassword = catchAsync(async (req, res, next) => {
  let err_email2 = "this email  is not valid";
  let err_email = "Email Not Found";
  let text = `Email Verification Code: `;
  if (req.query.lang == "ar") {
    err_email = "البريد الالكتروني غير موجود";
    err_email2 = "هذا البريد الالكتروني غير صحيح";
    text = ` : رمز التحقق من البريد الالكتروني: `;
  }
  let emailFormat = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;
  if (req.body.email !== "" && req.body.email.match(emailFormat)) {
    let { email } = req.body;
    let userData = await userModel.findOne({ email });
    if (!userData) return res.status(404).json({ message: err_email });
    userData.verificationCode = generateUniqueId({
      length: 4,
      useLetters: false,
    });
    text += `${userData.verificationCode}`;
    sendEmail(userData.email, text);
    await userData.save();
    let verificationCode = userData.verificationCode;
    let id = userData._id;
    let UserEmail = userData.email;
    return res.json({
      message: "Verification Code",
      verificationCode,
      id,
      UserEmail,
    });
  } else {
    return res.status(409).json({ message: err_email2 });
  }
});

// 1- check we have token or not
// 2- verfy token
// 3 if user of this token exist or not
// 4- check if this token is the last one or not (change password )

export const protectRoutes = catchAsync(async (req, res, next) => {
  let err_1 = "please login first";
  let err_2 = "user Invalid";
  let err_3 = "token Invalid";
  if (req.query.lang == "ar") {
    err_1 = "الرجاء تسجيل الدخول اولا";
    err_2 = "المستخدم غير مصرح به";
    err_3 = "التوكن غير صحيح";
  }
  const authorizationHeader = req.headers.authorization;
  if (!authorizationHeader) {
    return next(new AppError(`${err_1}`, 401));
  }
  const token = authorizationHeader.split(" ")[1];
  if (!token) {
    return next(new AppError(`${err_1}`, 401));
  }
  let decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
  let user = await userModel.findById(decoded.userId);
  if (!user) {
    return next(new AppError(`${err_2}`, 401));
  }
  if (user.changePasswordAt) {
    let changePasswordTime = parseInt(user.changePasswordAt.getTime() / 1000);
    if (changePasswordTime > decoded.iat) {
      return next(new AppError(`${err_3}`, 401));
    }
  }
  req.user = user;
  // let lastSignIn = new Date();
  // req.lastSignIn = lastSignIn;
  next();
});

export const allowTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.userType)) {
      return next(
        res.status(403).json({ message: "you don't have permission" })
      );
    }
    next();
  };
};

