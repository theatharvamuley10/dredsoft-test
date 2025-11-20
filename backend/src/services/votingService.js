const web3Service = require("./web3Service");
const { formatCandidate, parseVotingState } = require("../utils/formatters");

class VotingService {
  /**
   * Add a new candidate (owner only)
   */
  async addCandidate(name) {
    try {
      const contract = web3Service.getContract();
      const ownerAccount = web3Service.getOwnerAccount();

      // Validate inputs
      if (!name || name.trim().length === 0) {
        throw new Error("Candidate name cannot be empty");
      }

      // Prepare transaction
      const tx = contract.methods.addCandidate(name.trim());

      // Estimate gas
      const gas = await tx.estimateGas({ from: ownerAccount.address });
      const gasPrice = await web3Service.getGasPrice();

      // Send transaction
      const receipt = await tx.send({
        from: ownerAccount.address,
        gas: gas.toString(),
        gasPrice: gasPrice.toString(),
      });

      // Extract event data
      const event = receipt.events.CandidateAdded;
      const candidateIndex = event ? Number(event.returnValues.index) : null;

      return {
        success: true,
        candidateIndex,
        name: name.trim(),
        transactionHash: receipt.transactionHash,
        blockNumber: Number(receipt.blockNumber),
        gasUsed: Number(receipt.gasUsed),
      };
    } catch (error) {
      console.error("Error adding candidate:", error);
      throw this._parseContractError(error);
    }
  }

  /**
   * Get all candidates with vote counts
   */
  async getCandidates() {
    try {
      const contract = web3Service.getContract();
      const candidates = await contract.methods.getCandidates().call();

      return {
        success: true,
        totalCandidates: candidates.length,
        candidates: candidates.map((c, index) => formatCandidate(c, index)),
      };
    } catch (error) {
      console.error("Error getting candidates:", error);
      throw this._parseContractError(error);
    }
  }

  /**
   * Cast a vote for a candidate
   */
  async castVote(voterAddress, candidateIndex) {
    try {
      const contract = web3Service.getContract();
      const web3 = web3Service.getWeb3();

      // Validate inputs
      if (!web3Service.isValidAddress(voterAddress)) {
        throw new Error("Invalid voter address");
      }

      if (candidateIndex < 0) {
        throw new Error("Invalid candidate index");
      }

      // Check if already voted
      const hasVoted = await contract.methods.hasVoted(voterAddress).call();
      if (hasVoted) {
        throw new Error("Address has already voted");
      }

      // Check voting state
      const votingState = await contract.methods.votingState().call();
      if (Number(votingState) !== 1) {
        // InProgress = 1
        throw new Error("Voting is not currently in progress");
      }

      // Prepare transaction
      const tx = contract.methods.vote(candidateIndex);

      // Estimate gas
      const gas = await tx.estimateGas({ from: voterAddress });
      const gasPrice = await web3Service.getGasPrice();

      // For local hardhat, use account from node
      const accounts = await web3.eth.getAccounts();
      const voterAccount = accounts.find(
        (acc) => acc.toLowerCase() === voterAddress.toLowerCase()
      );

      if (!voterAccount) {
        throw new Error("Voter account not found in connected node");
      }

      // Send transaction
      const receipt = await tx.send({
        from: voterAccount,
        gas: gas.toString(),
        gasPrice: gasPrice.toString(),
      });

      return {
        success: true,
        voter: voterAddress,
        candidateIndex,
        transactionHash: receipt.transactionHash,
        blockNumber: Number(receipt.blockNumber),
        gasUsed: Number(receipt.gasUsed),
      };
    } catch (error) {
      console.error("Error casting vote:", error);
      throw this._parseContractError(error);
    }
  }

  /**
   * Get winner information
   */
  /**
   * Get winner information
   */
  async getWinner() {
    try {
      const contract = web3Service.getContract();

      // Check voting state
      const votingState = await contract.methods.votingState().call();
      if (Number(votingState) !== 2) {
        // Ended = 2
        throw new Error("Voting has not ended yet");
      }

      // Get winners
      const winnersData = await contract.methods.getWinners().call();

      // Extract data - handles multiple Web3.js return formats
      let winnerIndexes, voteCount;

      if (Array.isArray(winnersData)) {
        // Array format: [indexes, voteCount]
        [winnerIndexes, voteCount] = winnersData;
      } else if (winnersData.winnerIndexes !== undefined) {
        // Object format: {winnerIndexes, voteCount}
        winnerIndexes = winnersData.winnerIndexes;
        voteCount = winnersData.voteCount;
      } else {
        // Numbered keys format: {0: indexes, 1: voteCount}
        winnerIndexes = winnersData[0];
        voteCount = winnersData[1];
      }

      // Ensure winnerIndexes is an array and convert BigInt to Number
      const indexes = Array.isArray(winnerIndexes)
        ? winnerIndexes.map((idx) => Number(idx))
        : [Number(winnerIndexes)];

      const votes = Number(voteCount);

      // Get candidate names
      const winnerNames = await Promise.all(
        indexes.map(async (index) => {
          const candidateData = await contract.methods
            .getCandidate(index)
            .call();
          // Handle both array [name, voteCount] and object {0: name, 1: voteCount}
          const name = Array.isArray(candidateData)
            ? candidateData[0]
            : candidateData[0];
          return name;
        })
      );

      const isTie = indexes.length > 1;

      return {
        success: true,
        winner: isTie ? winnerNames : winnerNames[0],
        winnerIndexes: indexes,
        voteCount: votes,
        isTie,
        message: isTie
          ? `Tie between ${winnerNames.length} candidates with ${votes} votes each`
          : `${winnerNames[0]} won with ${votes} votes`,
      };
    } catch (error) {
      console.error("Error getting winner:", error);
      throw this._parseContractError(error);
    }
  }

  /**
   * Get current voting state
   */
  async getVotingState() {
    try {
      const contract = web3Service.getContract();
      const state = await contract.methods.votingState().call();

      return {
        success: true,
        state: Number(state),
        stateName: parseVotingState(Number(state)),
      };
    } catch (error) {
      console.error("Error getting voting state:", error);
      throw this._parseContractError(error);
    }
  }

  /**
   * Start voting (owner only)
   */
  async startVoting() {
    try {
      const contract = web3Service.getContract();
      const ownerAccount = web3Service.getOwnerAccount();

      const tx = contract.methods.startVoting();
      const gas = await tx.estimateGas({ from: ownerAccount.address });
      const gasPrice = await web3Service.getGasPrice();

      const receipt = await tx.send({
        from: ownerAccount.address,
        gas: gas.toString(),
        gasPrice: gasPrice.toString(),
      });

      return {
        success: true,
        message: "Voting started successfully",
        transactionHash: receipt.transactionHash,
        blockNumber: Number(receipt.blockNumber),
      };
    } catch (error) {
      console.error("Error starting voting:", error);
      throw this._parseContractError(error);
    }
  }

  /**
   * End voting (owner only)
   */
  async endVoting() {
    try {
      const contract = web3Service.getContract();
      const ownerAccount = web3Service.getOwnerAccount();

      const tx = contract.methods.endVoting();
      const gas = await tx.estimateGas({ from: ownerAccount.address });
      const gasPrice = await web3Service.getGasPrice();

      const receipt = await tx.send({
        from: ownerAccount.address,
        gas: gas.toString(),
        gasPrice: gasPrice.toString(),
      });

      return {
        success: true,
        message: "Voting ended successfully",
        transactionHash: receipt.transactionHash,
        blockNumber: Number(receipt.blockNumber),
      };
    } catch (error) {
      console.error("Error ending voting:", error);
      throw this._parseContractError(error);
    }
  }

  /**
   * Check if an address has voted
   */
  async hasVoted(address) {
    try {
      const contract = web3Service.getContract();

      if (!web3Service.isValidAddress(address)) {
        throw new Error("Invalid address");
      }

      const voted = await contract.methods.hasVoted(address).call();

      return {
        success: true,
        address,
        hasVoted: voted,
      };
    } catch (error) {
      console.error("Error checking vote status:", error);
      throw this._parseContractError(error);
    }
  }

  /**
   * Parse contract errors into user-friendly messages
   */
  _parseContractError(error) {
    const message = error.message || error.toString();

    // Common Solidity revert reasons
    if (message.includes("Unauthorized")) {
      return new Error("Only contract owner can perform this action");
    }
    if (message.includes("EmptyName")) {
      return new Error("Candidate name cannot be empty");
    }
    if (message.includes("DuplicateCandidate")) {
      return new Error("Candidate with this name already exists");
    }
    if (message.includes("CandidateIndexOutOfBounds")) {
      return new Error("Invalid candidate index");
    }
    if (message.includes("AlreadyVoted")) {
      return new Error("This address has already voted");
    }
    if (
      message.includes("VotingNotStarted") ||
      message.includes("VotingHasNotStarted")
    ) {
      return new Error("Voting has not started yet");
    }
    if (message.includes("VotingInProgress")) {
      return new Error("Voting is currently in progress");
    }
    if (message.includes("VotingHasEnded")) {
      return new Error("Voting has already ended");
    }
    if (message.includes("NoCandidates")) {
      return new Error("No candidates have been added");
    }
    if (message.includes("NoVotesCast")) {
      return new Error("No votes have been cast");
    }

    return error;
  }
}

module.exports = new VotingService();
