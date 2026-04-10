import crypto from "crypto";

export const generateOtp = (digits = 6) => {
  const min = 10 ** (digits - 1);
  const max = 10 ** digits - 1;
  return `${crypto.randomInt(min, max + 1)}`;
};

export const hashOtp = (phoneNumber, otpCode) =>
  crypto.createHash("sha256").update(`${phoneNumber}:${otpCode}`).digest("hex");
