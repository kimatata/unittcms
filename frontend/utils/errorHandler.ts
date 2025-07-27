/**
 * Error handler utility for logging errors
 */
export const logError = (context: string, error: unknown) => {
  if (error instanceof Error) {
    console.error(`${context}:`, error.message);
  } else {
    console.error(`${context}:`, error);
  }
};
