import { uploadFile } from './integrations/storage';
import { sendEmail } from './integrations/email';

// Mock Image Gen
const generateImage = async (prompt) => {
  console.log('MOCK IMAGE GEN:', prompt);
  return { url: 'https://via.placeholder.com/150' };
};

export const Core = {
  SendEmail: sendEmail,
  UploadFile: uploadFile,
  GenerateImage: generateImage,
};

// Re-export for compatibility if needed, or consumers should import Core
export const InvokeLLM = undefined; // Not implemented in original
export const SendEmail = sendEmail;
export const UploadFile = uploadFile;
export const GenerateImage = generateImage;

// Direct camelCase exports for new refactored code
export { sendEmail, uploadFile, generateImage };
export const ExtractDataFromUploadedFile = undefined; // Not implemented in original
export const CreateFileSignedUrl = undefined; // Not implemented in original
export const UploadPrivateFile = undefined; // Not implemented in original
