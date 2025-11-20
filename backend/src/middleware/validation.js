const web3Service = require("../services/web3Service");

/**
 * Validate request body fields
 */
const validateBody = (requiredFields) => {
  return (req, res, next) => {
    const missing = requiredFields.filter((field) => {
      // Check for undefined or null, but allow 0, false, empty string
      return req.body[field] === undefined || req.body[field] === null;
    });

    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Missing required fields: ${missing.join(", ")}`,
      });
    }

    next();
  };
};

/**
 * Validate Ethereum address
 */
const validateAddress = (field) => {
  return (req, res, next) => {
    const address = req.body[field];

    if (!address) {
      return res.status(400).json({
        success: false,
        error: `${field} is required`,
      });
    }

    if (!web3Service.isValidAddress(address)) {
      return res.status(400).json({
        success: false,
        error: `Invalid Ethereum address: ${field}`,
      });
    }

    next();
  };
};

/**
 * Validate candidate index
 */
const validateCandidateIndex = (req, res, next) => {
  // Check if candidateIndex exists (allow 0)
  if (
    req.body.candidateIndex === undefined ||
    req.body.candidateIndex === null
  ) {
    return res.status(400).json({
      success: false,
      error: "candidateIndex is required",
    });
  }

  const index = parseInt(req.body.candidateIndex, 10);

  if (isNaN(index) || index < 0) {
    return res.status(400).json({
      success: false,
      error: "candidateIndex must be a non-negative integer",
    });
  }

  req.body.candidateIndex = index;
  next();
};

module.exports = {
  validateBody,
  validateAddress,
  validateCandidateIndex,
};
