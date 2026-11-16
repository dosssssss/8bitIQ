// Express 4 doesn't catch errors thrown inside async handlers. This wrapper
// passes them to the error handler, so they come back as { success: false }.
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve()
      .then(() => fn(req, res, next))
      .catch(next);
  };
}

module.exports = asyncHandler;
