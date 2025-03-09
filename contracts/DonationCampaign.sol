// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract DonationCampaign is Initializable {
    address public owner;
    string public name;
    uint256 public totalDonations;

    struct Transaction {
        address donor;
        uint256 amount;
        uint256 timestamp;
    }

    Transaction[] public transactions;

    event DonationReceived(address donor, uint256 amount);
    event FundsWithdrawn(address owner, uint256 amount);

    constructor() {
        _disableInitializers();
    }

    function initialize(string memory _name, address _owner) external initializer {
        name = _name;
        owner = _owner;
    }

    function donate() external payable {
        require(msg.value > 0, "Donation amount must be greater than 0.");
        totalDonations += msg.value;
        transactions.push(Transaction(msg.sender, msg.value, block.timestamp));
        emit DonationReceived(msg.sender, msg.value);
    }

    function withdraw() external {
        require(msg.sender == owner, "Only the owner can withdraw funds.");
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");

        payable(owner).transfer(balance);
        emit FundsWithdrawn(owner, balance);
    }

    function getTransactions() external view returns (Transaction[] memory) {
        return transactions;
    }
}