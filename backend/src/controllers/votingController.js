const votingService = require("../services/votingService");

class VotingController {
  /**
   * POST /candidates - Add a new candidate
   */
  async addCandidate(req, res, next) {
    try {
      const { name } = req.body;
      const result = await votingService.addCandidate(name);

      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /candidates - Get all candidates
   */
  async getCandidates(req, res, next) {
    try {
      const result = await votingService.getCandidates();
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /vote - Cast a vote
   */
  async castVote(req, res, next) {
    try {
      const { voterAddress, candidateIndex } = req.body;
      const result = await votingService.castVote(voterAddress, candidateIndex);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /winner - Get the winner
   */
  async getWinner(req, res, next) {
    try {
      const result = await votingService.getWinner();
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /status - Get voting status
   */
  async getStatus(req, res, next) {
    try {
      const result = await votingService.getVotingState();
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /start - Start voting (owner only)
   */
  async startVoting(req, res, next) {
    try {
      const result = await votingService.startVoting();
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /end - End voting (owner only)
   */
  async endVoting(req, res, next) {
    try {
      const result = await votingService.endVoting();
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /has-voted/:address - Check if address has voted
   */
  async hasVoted(req, res, next) {
    try {
      const { address } = req.params;
      const result = await votingService.hasVoted(address);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new VotingController();
