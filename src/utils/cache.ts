import { errorCode } from "../../errorCode";

export const getOrSetCache = async (key: any, cb: any) => {
  try {
    const freshData = await cb();
    return freshData;
  } catch {
    console.error("Redis error", errorCode);
    throw errorCode;
  }
};
