import express, { Request, Response, NextFunction } from "express";

import { body, validationResult } from "express-validator"; //for  body validation middleware
import {
  getUserByPhone,
  createOtp,
  getOtpByPhone,
  updateOtp,
  createUser,
  updateUser,
  getUserById,
} from "../services/authService";
import moment, { invalid } from "moment";
import {
  checkUserAccount,
  checkOtpErrorIfSameDate,
  checkOtpRow,
  checkUserIfNotExit,
} from "../utils/auth";
import { generateOtp, generateToken } from "../utils/OTP";
import bcrypt from "bcrypt"; //for hashing in Otp
import jwt from "jsonwebtoken";
import { errorCode } from "../../errorCode";

// register
export const register = [
  body("phone", "Invalid phone Number")
    .trim()
    .notEmpty()
    .matches("^[0-9]+$")
    .isLength({ min: 5, max: 12 }),
  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({ onlyFirstError: true });
    if (errors.length > 0) {
      const error: any = new Error(errors[0].msg);
      error.status = 400;
      error.code = errorCode.invalid;
      return next(error);
    }

    //not for error:reach for this message remove for 09
    let phone = req.body.phone;
    if (phone.slice(0, 2) === "09") {
      phone = phone.substring(2, phone.length);
    }
    const user = await getUserByPhone(phone); //recall for authServices.ts
    checkUserAccount(user);

    //Generate OTP
    //include for sent to user phone number and save OTP to db
    //how to cteate for db
    const otp = 123456; //for testing
    // const otp = generateOtp(); // for production
    const salt = await bcrypt.genSalt(10);
    const hashOtp = await bcrypt.hash(otp.toString(), salt);
    const token = generateToken(); //token

    //OTP for 1day for 5 times
    const otpRow = await getOtpByPhone(phone);
    let result;
    if (!otpRow) {
      const otpData = {
        phone,
        otp: hashOtp, //hash this OTP
        remembertoken: token,
        count: 1,
      };
      result = await createOtp(otpData);
    } else {
      const lastOtpRequest = new Date(otpRow.updatedAT).toLocaleDateString();
      const today = new Date().toLocaleDateString();
      const isSameDate = lastOtpRequest === today;
      checkOtpErrorIfSameDate(isSameDate, otpRow.error);
      if (!isSameDate) {
        const otpData = {
          otp: hashOtp,
          remembertoken: token,
          count: 1,
          error: 1,
        };
        result = await updateOtp(otpRow.id, otpData);
      } else {
        if (otpRow.count === 3) {
          const error: any = new Error(
            "OTP is allowed to request 3 times per day"
          );
          error.status = 405;
          error.code = errorCode.invalid;
          return next(error);
        }
        {
          const otpData = {
            otp: hashOtp,
            remembertoken: token,
            count: otpRow.count + 1,
          };
          result = await updateOtp(otpRow.id, otpData);
        }
      }
    }

    res.status(200).json({
      message: `We are sending OTP  to 09${result.phone}`,
      phone: result.phone,
      token: result.remembertoken,
    }); //for apiအတွက်jsonသုံး
  },
];

//verify for otp
export const verifyOtp = [
  body("phone", "Invalid phone Number")
    .trim()
    .notEmpty()
    .matches("^[0-9]+$")
    .isLength({ min: 5, max: 12 }),
  body("otp", "Invalid OTP")
    .trim()
    .notEmpty()
    .matches("^[0-9]+$")
    .isLength({ min: 6, max: 6 }),
  body("token", "Invalid token").trim().notEmpty().escape(),

  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({ onlyFirstError: true });
    if (errors.length > 0) {
      const error: any = new Error(errors[0].msg);
      error.status = 400;
      error.code = errorCode.invalid;
      return next(error);
    }

    const { phone, otp, token } = req.body;
    const user = await getUserByPhone(phone);
    checkUserAccount(user);

    const otpRow = await getOtpByPhone(phone);
    checkOtpRow(otpRow);

    //if otp verify is the same date and over 5 time limit
    const lastOtpRequest = new Date(otpRow!.updatedAT).toLocaleDateString();
    const today = new Date().toLocaleDateString();
    const isSameDate = lastOtpRequest === today;
    checkOtpErrorIfSameDate(isSameDate, otpRow!.error);

    // Token is wrong
    if (otpRow?.remembertoken !== token) {
      const otpData = {
        error: 5,
      };

      await updateOtp(otpRow!.id, otpData);
      const error: any = new Error("Invalid token");
      error.status = 400;
      error.code = errorCode.accessTokenExpired;
      return next(error);
    }

    // OTP  is expired   for 2 minutes
    const isExpired = moment().diff(otpRow?.updatedAT, "minutes") > 2;
    if (isExpired) {
      const error: any = new Error("  Invalid,OTP  is expired   for 2 minutes");
      error.status = 403; //for expired in 403
      error.code = errorCode.otpExpired;
      return next(error);
    }

    // condition for otp?
    const isMatchOtp = await bcrypt.compare(otp, otpRow!.otp); //save for  hash code

    //OTp is wrong
    if (!isMatchOtp) {
      //if otp error first time today
      if (!isSameDate) {
        const otpData = {
          error: 1,
        };
        await updateOtp(otpRow!.id, otpData);
      } else {
        //If OTP error is not first time today
        const otpData = {
          error: { increment: 1 },
        };
        await updateOtp(otpRow!.id, otpData);
      }
      const error: any = new Error("  OTP is incorrect!");
      error.status = 401; //for authorized
      error.code = errorCode.otpExpired;
      return next(error);
    }
    //All are Ok
    const verifytoken = generateToken();
    const otpData = {
      verifytoken,
      error: 0,
      count: 1,
    };
    const result = await updateOtp(otpRow!.id, otpData);

    res.status(200).json({
      message: "Otp  is successfully required!",
      phone: result.phone,
      token: result.verifytoken,
    });
  },
];
//confirm Password
export const confirmPassword = [
  body("phone", "Invalid phone Number")
    .trim()
    .notEmpty()
    .matches("^[0-9]+$")
    .isLength({ min: 5, max: 12 }),
  body("password", "Password must be 8 digit")
    .trim() //remove space
    .notEmpty()
    .matches("^[0-9]+$")
    .isLength({ min: 8, max: 8 }),
  body("token", "Invalid token").trim().notEmpty().escape(),
  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({ onlyFirstError: true });
    if (errors.length > 0) {
      const error: any = new Error(errors[0].msg);
      error.status = 400;
      error.code = errorCode.invalid;
      return next(error);
    } //for error validation

    const { phone, password, token } = req.body;

    const user = await getUserByPhone(phone);
    checkUserAccount(user);

    const otpRow = await getOtpByPhone(phone);
    checkOtpRow(otpRow);

    //error for otp
    if (otpRow?.error === 5) {
      const error: any = new Error("This request may be an attack.");
      error.status = 400;
      error.code = errorCode.attack;
      return next(error);
    }

    //OTP Error Count
    if (otpRow?.verifytoken !== token) {
      const otpData = {
        error: 5,
      };
      await updateOtp(otpRow!.id, otpData);
      const error: any = new Error("Invalid token");
      error.status = 400;
      error.code = errorCode.attack;
      return next(error);
    }

    //request is expired
    const isExpired = moment().diff(otpRow?.updatedAT, "minutes") > 10;
    if (isExpired) {
      const error: any = new Error(" Your request is expired!");
      error.status = 403;
      error.code = errorCode.otpExpired;
      return next(error);
    }
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);
    const randToken = "I will recive refresh token";
    //create new account
    const userData = {
      phone,
      password: hashPassword,
      randToken: randToken,
    };
    const newUser = await createUser(userData);
    //pay for token in user
    const accessPayload = {
      id: newUser.id,
    };
    const refreshPayload = {
      id: newUser.id,
      phone: newUser.phone,
    };
    const accessToken = jwt.sign(
      accessPayload,
      process.env.ACCESS_TOKEN_SECRET!,
      {
        expiresIn: 60 * 15, //for expired time
      }
    );
    const refreshToken = jwt.sign(
      refreshPayload,
      process.env.REFRESH_TOKEN_SECRET!,
      {
        expiresIn: "30d", //for expired time
      }
    );
    //Updating randomtoken
    const userUpdateData = {
      randToken: refreshToken,
    };
    await updateUser(newUser.id, userUpdateData);

    res
      .cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "Production",
        sameSite: "none", //not for same site
        maxAge: 15 * 60 * 1000, //for 15 min
      }) //for sections cookie in http only
      .cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "Production",
        sameSite: "none", //not for same site
        maxAge: 30 * 24 * 60 * 60 * 1000, //for 15 min
      })
      .status(201)
      .json({
        message: "ConfirmPassword   successfully  created in account.",
        userId: newUser.id,
      });
    //end for confirm password
  },
];

//Login
export const login = [
  body("phone", "Invalid phone Number")
    .trim()
    .notEmpty()
    .matches("^[0-9]+$")
    .isLength({ min: 5, max: 12 }),
  body("password", "Password must be 8 digit")
    .trim() //remove space
    .notEmpty()
    .matches("^[0-9]+$")
    .isLength({ min: 8, max: 8 }),

  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({ onlyFirstError: true });
    if (errors.length > 0) {
      const error: any = new Error(req.t("wrong"));
      error.status = 400;
      error.code = errorCode.invalid;
      return next(error);
    } //for error validation

    const password = req.body.password;
    let phone = req.body.phone;
    if (phone.slice(0, 2) === "09") {
      phone = phone.substring(2, phone.length);
    }
    const user = await getUserByPhone(phone);
    checkUserIfNotExit(user);

    // If wrong password is over limit
    if (user!.status === "FREEZE") {
      const error: any = new Error(
        "Your account is temporarily account.Pleace contact account."
      );
      error.status = 400;
      error.code = errorCode.invalid;
      return next(error);
    }
    const isMatchPassword = await bcrypt.compare(password, user!.password);
    if (!isMatchPassword) {
      // ===============Start to record rounding
      const lastRequest = new Date(user!.updatedAT).toLocaleDateString();
      const isSameDate = lastRequest == new Date().toLocaleDateString();

      if (!isSameDate) {
        const userData = {
          errorLoginCount: 1,
        };
        await updateUser(user!.id, userData);
      } else {
        if (user!.errorLoginCount >= 2) {
          const userData = {
            status: "FREEZE ",
          };
          await updateUser(user!.id, userData);
        } else {
          const userData = {
            errorLoginCount: {
              increment: 1,
            },
          };
          await updateUser(user!.id, userData);
        }
      }
      //end
      const error: any = new Error("Password is wrong");
      error.status = 401;
      error.code = errorCode.invalid;
      return next(error);
    }

    //successful for Authention for jwt Token
    const accessPayload = {
      id: user!.id,
    };
    const refreshPayload = {
      id: user!.id,
      phone: user!.phone,
    };
    const accessToken = jwt.sign(
      accessPayload,
      process.env.ACCESS_TOKEN_SECRET!,
      {
        expiresIn: 60 * 15, //for expired time in 10 min
      }
    );
    const refreshToken = jwt.sign(
      refreshPayload,
      process.env.ACCESS_TOKEN_SECRET!,
      {
        expiresIn: "30d", //for expired time
      }
    );
    const userData = {
      errorLoginCount: 0,
      randToken: refreshToken,
    };
    await updateUser(user!.id, userData);

    res
      .cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "Production",
        sameSite: "none", //not for same site
        maxAge: 10 * 60 * 1000, //for 10 min
      }) //for sections cookie in http only
      .cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "Production",
        sameSite: "none", //not for same site
        maxAge: 30 * 24 * 60 * 60 * 1000, //for 15 min
      })
      .status(201)
      .json({
        message: "Successfully Login account",
        userId: user!.id,
        // accessToken, //for mobile browser
        // refreshToken, //for mobile browser
      });
  },
];

//logout
export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const refreshtToken = req.cookies ? req.cookies.refreshToken : null;
  if (!refreshtToken) {
    const error: any = new Error("You are not an authenticated user!");
    error.status = 400;
    error.code = errorCode.unauthenticated;
    return next(error);
  }

  let decoded;
  try {
    decoded = jwt.verify(refreshtToken, process.env.ACCESS_TOKEN_SECRET!) as {
      id: number;
      phone: string;
    };
  } catch (err) {
    const error: any = new Error("Invalid or expired refresh token!");
    error.status = 400;
    error.code = errorCode.unauthenticated;
    return next(error);
  }

  if (isNaN(decoded.id)) {
    const error: any = new Error("Invalid or expired refresh token!");
    error.status = 400;
    error.code = errorCode.unauthenticated;
    return next(error);
  }

  const user = await getUserById(decoded.id);
  checkUserIfNotExit(user);

  if (user!.phone !== decoded.phone) {
    const error: any = new Error("You are not an authenticated user!");
    error.status = 400;
    error.code = errorCode.unauthenticated;
    return next(error);
  }

  const userData = {
    randToken: generateToken(),
  };
  await updateUser(user!.id, userData);

  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "Production",
    sameSite: process.env.NODE_ENV === "Production" ? "none" : "strict",
  }); //for sections cookie in http only

  res
    .clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "Production",
      sameSite: process.env.NODE_ENV === "Production" ? "none" : "strict",
    })
    .status(200)
    .json({ message: "Successfully Logged out.See you soon" });
};

//forgetpassword
export const forgetPassword = [
  body("phone", "Invalid phone Number")
    .trim()
    .notEmpty()
    .matches("^[0-9]+$")
    .isLength({ min: 5, max: 12 }),
  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({ onlyFirstError: true });
    if (errors.length > 0) {
      const error: any = new Error(errors[0].msg);
      error.status = 400;
      error.code = errorCode.invalid;
      return next(error);
    } //for error validation
    //not for error:reach for this message remove for 09
    let phone = req.body.phone;
    if (phone.slice(0, 2) === "09") {
      phone = phone.substring(2, phone.length);
    }
    const user = await getUserByPhone(phone); //recall for authServices.ts
    checkUserIfNotExit(user); //have no db for

    //Generate OTP
    //include for sent to user phone number and save OTP to db
    //how to cteate for db
    const otp = 123456; //for testing
    // const otp = generateOtp(); // for production
    const salt = await bcrypt.genSalt(10);
    const hashOtp = await bcrypt.hash(otp.toString(), salt);
    const token = generateToken(); //token
    //OTP for 1day for 5 times
    const otpRow = await getOtpByPhone(phone);
    let result;
    const lastOtpRequest = new Date(otpRow!.updatedAT).toLocaleDateString();
    const today = new Date().toLocaleDateString();
    const isSameDate = lastOtpRequest === today;
    checkOtpErrorIfSameDate(isSameDate, otpRow!.error);
    if (!isSameDate) {
      const otpData = {
        otp: hashOtp,
        remembertoken: token,
        count: 1,
        error: 0,
      };
      result = await updateOtp(otpRow!.id, otpData);
    } else {
      if (otpRow!.count === 3) {
        const error: any = new Error(
          "OTP is allowed to request 3 times per day"
        );
        error.status = 405;
        error.code = errorCode.invalid;
        return next(error);
      }
      {
        const otpData = {
          otp: hashOtp,
          remembertoken: token,
          count: otpRow!.count + 1,
        };
        result = await updateOtp(otpRow!.id, otpData);
      }
    }
    res.status(200).json({
      message: `We are sending OTP  to 09${result.phone}`,
      phone: result.phone,
      token: result.remembertoken,
    }); //for apiအတွက်jsonသုံး
  },
];

//verifyOtpForPassword
export const verifyOtpForPassword = [
  body("phone", "Invalid phone Number")
    .trim()
    .notEmpty()
    .matches("^[0-9]+$")
    .isLength({ min: 5, max: 12 }),
  body("otp", "Invalid OTP")
    .trim()
    .notEmpty()
    .matches("^[0-9]+$")
    .isLength({ min: 6, max: 6 }),
  body("token", "Invalid token").trim().notEmpty().escape(),
  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({ onlyFirstError: true });
    if (errors.length > 0) {
      const error: any = new Error(errors[0].msg);
      error.status = 400;
      error.code = errorCode.invalid;
      return next(error);
    }

    const { phone, otp, token } = req.body;
    const user = await getUserByPhone(phone);
    checkUserIfNotExit(user);

    const otpRow = await getOtpByPhone(phone);

    //if otp verify is the same date and over 5 time limit
    const lastOtpRequest = new Date(otpRow!.updatedAT).toLocaleDateString();
    const today = new Date().toLocaleDateString();
    const isSameDate = lastOtpRequest === today;
    checkOtpErrorIfSameDate(isSameDate, otpRow!.error);

    // Token is wrong
    if (otpRow?.remembertoken !== token) {
      const otpData = {
        error: 5,
      };

      await updateOtp(otpRow!.id, otpData);
      const error: any = new Error("Invalid token");
      error.status = 400;
      error.code = errorCode.accessTokenExpired;
      return next(error);
    }

    // OTP  is expired   for 2 minutes
    const isExpired = moment().diff(otpRow!.updatedAT, "minutes") > 2;
    if (isExpired) {
      const error: any = new Error("  Invalid,OTP  is expired   for 2 minutes");
      error.status = 403; //for expired in 403
      error.code = errorCode.otpExpired;
      return next(error);
    }

    // condition for otp?
    const isMatchOtp = await bcrypt.compare(otp, otpRow!.otp); //save for  hash code

    //OTp is wrong
    if (!isMatchOtp) {
      //if otp error first time today
      if (!isSameDate) {
        const otpData = {
          error: 1,
        };
        await updateOtp(otpRow!.id, otpData);
      } else {
        //If OTP error is not first time today
        const otpData = {
          error: { increment: 1 },
        };
        await updateOtp(otpRow!.id, otpData);
      }
      const error: any = new Error("  OTP is incorrect!");
      error.status = 401; //for authorized
      error.code = errorCode.otpExpired;
      return next(error);
    }
    //All are Ok
    const verifytoken = generateToken();
    const otpData = {
      verifytoken,
      error: 0,
      count: 1,
    };
    const result = await updateOtp(otpRow!.id, otpData);

    res.status(200).json({
      message: "Otp  is successfully required!",
      phone: result.phone,
      token: result.verifytoken,
    });
  },
];

//restPassword
export const restPassword = [
  body("token", "Token must be empty").trim().notEmpty().escape(),
  body("phone", "Invalid phone Number")
    .trim()
    .notEmpty()
    .matches("^[0-9]+$")
    .isLength({ min: 5, max: 12 }),
  body("password", "Password must be 8 digit")
    .trim() //remove space
    .notEmpty()
    .matches("^[0-9]+$")
    .isLength({ min: 8, max: 8 }),

  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({ onlyFirstError: true });
    if (errors.length > 0) {
      const error: any = new Error(errors[0].msg);
      error.status = 400;
      error.code = errorCode.invalid;
      return next(error);
    } //for error validation

    const { phone, password, token } = req.body;

    const user = await getUserByPhone(phone);
    checkUserIfNotExit(user);

    const otpRow = await getOtpByPhone(phone);

    //error for otp
    if (otpRow!.error === 5) {
      const error: any = new Error("This request may be an attack.");
      error.status = 401;
      error.code = errorCode.attack;
      return next(error);
    }

    //OTP Error Count
    if (otpRow?.verifytoken !== token) {
      const otpData = {
        error: 5,
      };
      await updateOtp(otpRow!.id, otpData);
      const error: any = new Error("Invalid token");
      error.status = 400;
      error.code = errorCode.attack;
      return next(error);
    }

    //request is expired
    const isExpired = moment().diff(otpRow?.updatedAT, "minutes") > 10;
    if (isExpired) {
      const error: any = new Error(" Your request is expired!");
      error.status = 403;
      error.code = errorCode.otpExpired;
      return next(error);
    }
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);

    //pay for token in user
    const accessPayload = {
      id: user!.id,
    };
    const refreshPayload = {
      id: user!.id,
      phone: user!.phone,
    };
    const accessToken = jwt.sign(
      accessPayload,
      process.env.ACCESS_TOKEN_SECRET!,
      {
        expiresIn: 60 * 15, //for expired time
      }
    );
    const refreshToken = jwt.sign(
      refreshPayload,
      process.env.REFRESH_TOKEN_SECRET!,
      {
        expiresIn: "30d", //for expired time
      }
    );
    //Updating randomtoken
    const userUpdateData = {
      password: hashPassword, //update for database
      randToken: refreshToken,
    };
    await updateUser(user!.id, userUpdateData);

    res
      .cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "Production",
        sameSite: "none", //not for same site
        maxAge: 15 * 60 * 1000, //for 15 min
      }) //for sections cookie in http only
      .cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "Production",
        sameSite: "none", //not for same site
        maxAge: 30 * 24 * 60 * 60 * 1000, //for 15 min
      })
      .status(201)
      .json({
        message: "ConfirmPassword   successfully  created in account.",
        userId: user!.id,
      });
    //end for confirm password
  },
];
