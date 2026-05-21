// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || 500;

  if (process.env.NODE_ENV !== 'production') {
    console.error(err);
  }

  const message =
    status < 500
      ? err.message
      : process.env.NODE_ENV === 'production'
      ? 'Internal Server Error'
      : err.message;

  res.status(status).json({ success: false, message });
}

module.exports = errorHandler;
