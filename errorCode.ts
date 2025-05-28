import { maintenance } from "./src/middlewares/maintenance";

export const errorCode = {
  invalid: "Error_Invalid",
  unauthenticated: " Error_Unauthenticated",
  attack: "Error_Attack",
  accessTokenExpired: "Error_accessTokenExpired",
  userExit: "Error_UserAlreadyExit",
  overLimit: "Error_OverLimited",
  otpExpired: "Error_OtpExpired",
  requestExpired: "Error_RequestExpired",
  accountFreeze: "accountFreeze",
  unauthorise: "Error_Unauthorise",
  maintenance: "Error_Maintenance",
};
