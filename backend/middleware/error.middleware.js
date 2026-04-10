export const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.originalUrl}`,
  });
};

export const errorHandler = (error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  const statusCode = error.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    message: error.message || "Internal server error",
    ...(error.details ? { details: error.details } : {}),
    ...(process.env.NODE_ENV !== "production" && error.stack
      ? { stack: error.stack }
      : {}),
  });
};
