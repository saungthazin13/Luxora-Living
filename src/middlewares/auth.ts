import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { errorCode } from "../../errorCode";
import { getUserById, updateUser } from "../services/authService";
import { error } from "console";
import { createError } from "../utils/error";

interface CustomRequst extends Request {
  userId?: number;
}

export const auth = (req: CustomRequst, res: Response, next: NextFunction) => {
  const accessToken = req.cookies ? req.cookies.accessToken : null; //if not data for cookies in error
  const refreshToken = req.cookies ? req.cookies.refreshToken : null;

  if (!refreshToken) {
    return next(
      createError(
        "Your are not an authenticated user.",
        401,
        errorCode.unauthenticated
      )
    );
  }
  const generateNewToken = async () => {
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET!) as {
        id: number;
        phone: string;
      };
    } catch (err) {
      return next(
        createError(
          "Your are not an authenticated user.",
          401,
          errorCode.unauthenticated
        )
      );
    }

    if (isNaN(decoded.id)) {
      //for true (not number)

      return next(
        createError(
          "Your are not an authenticated user.",
          401,
          errorCode.unauthenticated
        )
      );
    }
    const user = await getUserById(decoded.id);
    if (!user) {
      return next(
        createError(
          "Your are not an authenticated user.",
          401,
          errorCode.unauthenticated
        )
      );
    }
    //for hacker fake account id and user (verify)
    if (user!.phone !== decoded.phone) {
      return next(
        createError(
          "This account have not register",
          401,
          errorCode.unauthenticated
        )
      );
    }
    //security for db token for convert to hacker
    if (user!.randToken !== refreshToken) {
      const error: any = new Error("This account have not register");
      error.status = 401;
      error.code = errorCode.unauthenticated;
      return next(
        createError(
          "This account have not register",
          401,
          errorCode.unauthenticated
        )
      );
    }

    //successful for Authention for jwt Token
    const accessPayload = {
      id: user.id,
    };
    const refreshPayload = {
      id: user.id,
      phone: user!.phone,
    };
    const newaccessToken = jwt.sign(
      accessPayload,
      process.env.ACCESS_TOKEN_SECRET!,
      {
        expiresIn: 60 * 15, //for expired time
      }
    );
    const newrefreshToken = jwt.sign(
      refreshPayload,
      process.env.ACCESS_TOKEN_SECRET!,
      {
        expiresIn: "30d", //for expired time
      }
    );
    const userData = {
      randToken: newrefreshToken,
    };
    await updateUser(user.id, userData);
    res
      .cookie("newaccessToken", newaccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "Production",
        sameSite: "none", //not for same site
        maxAge: 15 * 60 * 1000, //for 15 min
      }) //for sections cookie in http only
      .cookie("newrefreshToken", newrefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "Production",
        sameSite: "none", //not for same site
        maxAge: 30 * 24 * 60 * 60 * 1000, //for 15 min
      });
    req.userId = user.id;
    return next(error);
  };

  if (!accessToken) {
    generateNewToken(); //await generateNewtoken(); for continue to code
  } else {
    let decoded;
    try {
      decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET!) as {
        id: number;
      };

      if (isNaN(decoded.id)) {
        //for true (not number)
        const error: any = new Error("Your are not an authenticated user.");
        error.status = 401;
        error.code = errorCode.unauthenticated;
        return next(error);
      }

      req.userId = decoded.id;
      next();
    } catch (error: any) {
      if (error.name === "Token Expired Error") {
        generateNewToken();
      } else {
        error.message = "Access Token is Invalid";
        error.status = 400;
        error.code = errorCode.attack;
      }
      return next(error);
    }
  }

  //verify access token
  let decoded;
  try {
    decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET!) as {
      id: number;
    };
    req.userId = decoded.id;
    next();
  } catch (error: any) {
    if (error.name === "Token Expired Error") {
      generateNewToken();
    } else {
      error.message = "Access Token is Invalid";
      error.status = 400;
      error.code = errorCode.attack;
    }
    return next(error);
  }
};
