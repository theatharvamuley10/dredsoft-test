const express = require("express");
const votingController = require("../controllers/votingController");
const {
  validateBody,
  validateAddress,
  validateCandidateIndex,
} = require("../middleware/validation");
const { asyncHandler } = require("../middleware/errorHandler");

const router = express.Router();

/**
 * @route   POST /api/candidates
 * @desc    Add a new candidate (owner only)
 * @access  Owner
 */
router.post(
  "/candidates",
  validateBody(["name"]),
  asyncHandler(votingController.addCandidate.bind(votingController))
);

/**
 * @route   GET /api/candidates
 * @desc    Get all candidates with vote counts
 * @access  Public
 */
router.get(
  "/candidates",
  asyncHandler(votingController.getCandidates.bind(votingController))
);

/**
 * @route   POST /api/vote
 * @desc    Cast a vote for a candidate
 * @access  Public
 */
router.post(
  "/vote",
  validateBody(["voterAddress", "candidateIndex"]),
  validateAddress("voterAddress"),
  validateCandidateIndex,
  asyncHandler(votingController.castVote.bind(votingController))
);

/**
 * @route   GET /api/winner
 * @desc    Get the winner (only after voting ends)
 * @access  Public
 */
router.get(
  "/winner",
  asyncHandler(votingController.getWinner.bind(votingController))
);

/**
 * @route   GET /api/status
 * @desc    Get current voting state
 * @access  Public
 */
router.get(
  "/status",
  asyncHandler(votingController.getStatus.bind(votingController))
);

/**
 * @route   POST /api/start
 * @desc    Start voting (owner only)
 * @access  Owner
 */
router.post(
  "/start",
  asyncHandler(votingController.startVoting.bind(votingController))
);

/**
 * @route   POST /api/end
 * @desc    End voting (owner only)
 * @access  Owner
 */
router.post(
  "/end",
  asyncHandler(votingController.endVoting.bind(votingController))
);

/**
 * @route   GET /api/has-voted/:address
 * @desc    Check if an address has voted
 * @access  Public
 */
router.get(
  "/has-voted/:address",
  asyncHandler(votingController.hasVoted.bind(votingController))
);

module.exports = router;
