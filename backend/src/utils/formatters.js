/**
 * Format candidate data from contract
 */
const formatCandidate = (candidate, index) => {
  return {
    index,
    name: candidate.name || candidate[0],
    voteCount: Number(candidate.voteCount || candidate[1]),
  };
};

/**
 * Parse voting state enum to readable string
 */
const parseVotingState = (state) => {
  const states = ["NotStarted", "InProgress", "Ended"];
  return states[state] || "Unknown";
};

/**
 * Format transaction response
 */
const formatTransaction = (receipt) => {
  return {
    transactionHash: receipt.transactionHash,
    blockNumber: Number(receipt.blockNumber),
    gasUsed: Number(receipt.gasUsed),
    status: receipt.status,
  };
};

/**
 * Format error response
 */
const formatError = (error) => {
  return {
    success: false,
    error: error.message || "An unexpected error occurred",
    timestamp: new Date().toISOString(),
  };
};

module.exports = {
  formatCandidate,
  parseVotingState,
  formatTransaction,
  formatError,
};
