import { errorCode } from "../../errorCode";

export const checkUserAccount = (user: any) => {
  if (user) {
    const error: any = new Error(
      "This phone number has already been register!"
    );
    error.status = 409;
    error.code = errorCode.userExit;
    throw error;
  }
}; //for existing Account

export const checkOtpErrorIfSameDate = (
  isSameDate: boolean,
  errorCount: number
) => {
  if (isSameDate && errorCount === 5) {
    const error: any = new Error(" Otp is wrong.Please Try again tomorrow");
    //give for fontend developer
    error.status = 401;
    error.code = errorCode.overLimit;
    throw error;
  }
};
export const checkOtpRow = (otpRow: any) => {
  if (!otpRow) {
    const error: any = new Error(" Otp is wrong.Please Try again tomorrow");
    //give for fontend developer
    error.status = 401;
    error.code = errorCode.invalid;
    throw error;
  }
};
export const checkUserIfNotExit = (user: any) => {
  if (!user) {
    const error: any = new Error(" This phone has not registered.");
    //give for fontend developer
    error.status = 401;
    error.code = errorCode.unauthenticated;
    throw error;
  }
};
