export const sendOtpSms = async ({ phoneNumber, otpCode }) => {
  const provider = process.env.SMS_PROVIDER || "console";

  if (provider === "console") {
    console.log(`OTP for ${phoneNumber}: ${otpCode}`);
    return {
      provider,
      delivered: true,
    };
  }

  console.warn(
    `SMS provider "${provider}" is not implemented yet. Falling back to console output.`
  );
  console.log(`OTP for ${phoneNumber}: ${otpCode}`);

  return {
    provider: "console-fallback",
    delivered: true,
  };
};
