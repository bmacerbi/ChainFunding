// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract DonationCampaign is Initializable {
    address public owner;
    string public name;
    uint256 public totalDonations;

    event DonationReceived(address donor, uint256 amount);

    constructor() {
        _disableInitializers();
    }

    function initialize(string memory _name, address _owner) external initializer {
        name = _name;
        owner = _owner;
    }

    function donate() public payable {
        require(msg.value > 0, "Donation amount must be greater than 0.");
        totalDonations += msg.value;
        emit DonationReceived(msg.sender, msg.value);
    }

    function withdraw() public {
        require(msg.sender == owner, "Only the owner can withdraw funds.");
        payable(owner).transfer(address(this).balance);
    }
}