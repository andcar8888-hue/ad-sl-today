// Backend error shape: { message } or { message: "Validation failed", errors: [{ field, message }] }.
export function getErrorMessage(error) {
  return (
    error?.response?.data?.message || error?.message || 'Something went wrong. Please try again.'
  );
}

export function getFieldErrors(error) {
  return error?.response?.data?.errors || [];
}
