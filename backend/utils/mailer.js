export const mailer = async ({ to, subject, text, html }) => {
  // Mock mailer since npm is not available in the execution environment
  console.log("=========================================");
  console.log(`[MOCK EMAIL SENT]`);
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Body:`);
  console.log(text || html);
  console.log("=========================================");

  return { success: true, messageId: `mock-${Date.now()}` };
};
