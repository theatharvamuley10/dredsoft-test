const { Web3 } = require("web3");
const config = require("../config");
const votingABI = require("../../abi/Voting.json");

class Web3Service {
  constructor() {
    this.web3 = null;
    this.contract = null;
    this.ownerAccount = null;
    this.initialized = false;
  }

  /**
   * Initialize Web3 connection and contract instance
   */
  async initialize() {
    try {
      // Initialize Web3 provider
      this.web3 = new Web3(new Web3.providers.HttpProvider(config.rpcUrl));

      // Verify connection
      const isListening = await this.web3.eth.net.isListening();
      if (!isListening) {
        throw new Error("Unable to connect to Ethereum node");
      }

      // Get network info
      const networkId = await this.web3.eth.net.getId();
      console.log(`✓ Connected to network: ${networkId}`);

      // Initialize contract
      if (!config.contractAddress) {
        throw new Error("CONTRACT_ADDRESS not configured");
      }

      this.contract = new this.web3.eth.Contract(
        votingABI.abi,
        config.contractAddress
      );

      // Setup owner account
      if (config.ownerPrivateKey) {
        this.ownerAccount = this.web3.eth.accounts.privateKeyToAccount(
          config.ownerPrivateKey.startsWith("0x")
            ? config.ownerPrivateKey
            : `0x${config.ownerPrivateKey}`
        );
        this.web3.eth.accounts.wallet.add(this.ownerAccount);
        console.log(`✓ Owner account loaded: ${this.ownerAccount.address}`);
      }

      // Verify contract deployment
      const code = await this.web3.eth.getCode(config.contractAddress);
      if (code === "0x" || code === "0x0") {
        throw new Error("No contract found at specified address");
      }

      this.initialized = true;
      console.log(`✓ Contract initialized at: ${config.contractAddress}`);

      return true;
    } catch (error) {
      console.error("Web3 initialization failed:", error.message);
      throw error;
    }
  }

  /**
   * Ensure Web3 is initialized before operations
   */
  ensureInitialized() {
    if (!this.initialized) {
      throw new Error("Web3Service not initialized. Call initialize() first.");
    }
  }

  /**
   * Get contract instance
   */
  getContract() {
    this.ensureInitialized();
    return this.contract;
  }

  /**
   * Get Web3 instance
   */
  getWeb3() {
    this.ensureInitialized();
    return this.web3;
  }

  /**
   * Get owner account
   */
  getOwnerAccount() {
    this.ensureInitialized();
    if (!this.ownerAccount) {
      throw new Error("Owner account not configured");
    }
    return this.ownerAccount;
  }

  /**
   * Validate Ethereum address
   */
  isValidAddress(address) {
    return this.web3.utils.isAddress(address);
  }

  /**
   * Get current gas price
   */
  async getGasPrice() {
    this.ensureInitialized();
    return await this.web3.eth.getGasPrice();
  }

  /**
   * Estimate gas for a transaction
   */
  async estimateGas(transaction) {
    this.ensureInitialized();
    return await this.web3.eth.estimateGas(transaction);
  }

  /**
   * Get account balance
   */
  async getBalance(address) {
    this.ensureInitialized();
    const balance = await this.web3.eth.getBalance(address);
    return this.web3.utils.fromWei(balance, "ether");
  }
}

// Singleton instance
const web3Service = new Web3Service();

module.exports = web3Service;
