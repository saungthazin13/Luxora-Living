import { errorCode } from "../../errorCode";

export const checkUploadFile = (file: any) => {
  if (!file) {
    const error: any = new Error(" This phone has not registered.");
    //give for fontend developer
    error.status = 400;
    error.code = errorCode.invalid;
    throw error;
  }
};
