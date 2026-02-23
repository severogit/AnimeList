interface ApiErrorShape {
  response?: {
    data?: {
      msg?: string;
    };
  };
  message?: string;
}

export const getApiErrorMessage = (
  error: unknown,
  fallback: string
): string => {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error
  ) {
    const apiError = error as ApiErrorShape;
    if (typeof apiError.response?.data?.msg === "string") {
      return apiError.response.data.msg;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
};
