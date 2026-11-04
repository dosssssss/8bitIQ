// An error the API sends back to the page as { success: false, message }.
// "details" adds extra fields, for example { timeRemaining: 42 }.
class ApiError extends Error {
  constructor(status, message, details = {}) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

const badRequest = (message, details) => new ApiError(400, message, details);
const notFound = (message, details) => new ApiError(404, message, details);
const conflict = (message, details) => new ApiError(409, message, details);

module.exports = { ApiError, badRequest, notFound, conflict };
