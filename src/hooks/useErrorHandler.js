import { toast } from 'sonner';

export const useErrorHandler = () => {
  const handleError = (error, customMessage = 'An unexpected error occurred') => {
    console.error(error);

    // Extract message from error object if available
    const message = error?.message || customMessage;

    toast.error(message);
  };

  return { handleError };
};
