// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract Voting {
    // -----------------------------------------------------------------------
    // Events
    // -----------------------------------------------------------------------
    event CandidateAdded(uint256 indexed index, string name);
    event VoteCast(address indexed voter, uint256 indexed candidateIndex);
    event VotingStateChanged(VotingState previousState, VotingState newState);
    event WinnersFinalized(uint256[] winnerIndexes, uint256 votes);

    // -----------------------------------------------------------------------
    // Errors
    // -----------------------------------------------------------------------
    error Unauthorized();
    error EmptyName();
    error DuplicateCandidate();
    error CandidateIndexOutOfBounds();
    error AlreadyVoted();
    error VotingNotStarted();
    error VotingInProgress();
    error VotingHasNotStarted();
    error VotingHasEnded();
    error NoCandidates();
    error NoVotesCast();
    error Reentrant();

    // -----------------------------------------------------------------------
    // Data Structures
    // -----------------------------------------------------------------------
    struct Candidate {
        string name;
        uint256 voteCount;
    }

    enum VotingState {
        NotStarted,
        InProgress,
        Ended
    }

    // -----------------------------------------------------------------------
    // Storage
    // -----------------------------------------------------------------------
    Candidate[] private _candidates;
    mapping(address => bool) private _hasVoted;
    mapping(bytes32 => bool) private _candidateNameExists;

    address public immutable owner;
    VotingState public votingState;

    uint8 private _status;
    uint8 private constant _ENTERED = 2;
    uint8 private constant _NOT_ENTERED = 1;

    // Updated: store only winner indexes
    uint256[] private _winnerIndexes;
    uint256 private _topVotes;

    constructor() {
        owner = msg.sender;
        votingState = VotingState.NotStarted;
        _status = _NOT_ENTERED;
    }

    // -----------------------------------------------------------------------
    // Modifiers
    // -----------------------------------------------------------------------
    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }

    modifier nonReentrant() {
        if (_status == _ENTERED) revert Reentrant();
        _status = _ENTERED;
        _;
        _status = _NOT_ENTERED;
    }

    modifier onlyInState(VotingState expected) {
        if (votingState != expected) {
            if (votingState == VotingState.NotStarted) revert VotingHasNotStarted();
            if (votingState == VotingState.InProgress) revert VotingInProgress();
            if (votingState == VotingState.Ended) revert VotingHasEnded();
        }
        _;
    }

    // -----------------------------------------------------------------------
    // Admin Functions
    // -----------------------------------------------------------------------

    function addCandidate(string calldata name) external onlyOwner onlyInState(VotingState.NotStarted) nonReentrant {
        if (bytes(name).length == 0) revert EmptyName();

        bytes32 hashName = keccak256(bytes(name));
        if (_candidateNameExists[hashName]) revert DuplicateCandidate();

        _candidateNameExists[hashName] = true;

        _candidates.push(Candidate({name: name, voteCount: 0}));

        emit CandidateAdded(_candidates.length - 1, name);
    }

    function startVoting() external onlyOwner onlyInState(VotingState.NotStarted) {
        if (_candidates.length == 0) revert NoCandidates();

        VotingState prev = votingState;
        votingState = VotingState.InProgress;

        emit VotingStateChanged(prev, votingState);
    }

    function endVoting() external onlyOwner onlyInState(VotingState.InProgress) nonReentrant {
        VotingState prev = votingState;
        votingState = VotingState.Ended;

        _finalizeWinner();

        emit VotingStateChanged(prev, votingState);

        // Emit final winner indexes instead of names
        emit WinnersFinalized(_winnerIndexes, _topVotes);
    }

    // -----------------------------------------------------------------------
    // User Functions
    // -----------------------------------------------------------------------
    function vote(uint256 candidateIndex) external onlyInState(VotingState.InProgress) nonReentrant {
        if (candidateIndex >= _candidates.length) revert CandidateIndexOutOfBounds();
        if (_hasVoted[msg.sender]) revert AlreadyVoted();

        _hasVoted[msg.sender] = true;

        unchecked {
            _candidates[candidateIndex].voteCount++;
        }

        emit VoteCast(msg.sender, candidateIndex);
    }

    // -----------------------------------------------------------------------
    // Internal Winner Logic
    // -----------------------------------------------------------------------

    function _finalizeWinner() internal {
        uint256 len = _candidates.length;
        if (len == 0) revert NoCandidates();

        uint256 highest = 0;
        bool anyVotes = false;

        // 1) Determine highest vote count
        for (uint256 i = 0; i < len; i++) {
            uint256 count = _candidates[i].voteCount;
            if (count > highest) highest = count;
            if (count > 0) anyVotes = true;
        }

        if (!anyVotes) revert NoVotesCast();

        _topVotes = highest;

        // clear & rebuild index list
        delete _winnerIndexes;

        // 2) Collect all indexes with highest vote count
        for (uint256 i = 0; i < len; i++) {
            if (_candidates[i].voteCount == highest) {
                _winnerIndexes.push(i);
            }
        }
    }

    // -----------------------------------------------------------------------
    // Read Functions
    // -----------------------------------------------------------------------

    function getCandidates() external view returns (Candidate[] memory) {
        uint256 len = _candidates.length;
        Candidate[] memory out = new Candidate[](len);
        for (uint256 i = 0; i < len; i++) {
            out[i] = _candidates[i];
        }
        return out;
    }

    function getCandidate(uint256 index) external view returns (string memory, uint256) {
        if (index >= _candidates.length) revert CandidateIndexOutOfBounds();
        Candidate storage c = _candidates[index];
        return (c.name, c.voteCount);
    }

    function totalCandidates() external view returns (uint256) {
        return _candidates.length;
    }

    function hasVoted(address user) external view returns (bool) {
        return _hasVoted[user];
    }

    /// @notice Returns all winning candidate indexes + vote count
    function getWinners()
        external
        view
        onlyInState(VotingState.Ended)
        returns (uint256[] memory winnerIndexes, uint256 voteCount)
    {
        return (_winnerIndexes, _topVotes);
    }
}
