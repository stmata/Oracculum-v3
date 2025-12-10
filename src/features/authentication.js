import { sendVerificationEmail } from "../services/api";

export const requestLoginCode = async (email) => {
  try {
    const response = await sendVerificationEmail(email);
    
    const { user } = response;

    return { success: true, user };

  } catch (err) {
    const message = err.message || "Unexpected error.";
    const status = err?.status || 500;
    throw { status, message };
  }
};
