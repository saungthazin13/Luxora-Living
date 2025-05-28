import { randomBytes } from "crypto"; //for OTP
export const generateOtp = () => {
  return (parseInt(randomBytes(3).toString("hex"), 16) % 900000) + 100000; //base term for integer
};

export const generateToken = () => {
  return randomBytes(32).toString("hex");
};
