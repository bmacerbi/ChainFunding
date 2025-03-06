// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "./DonationCampaign.sol";

contract DonationFactory {
    address[] public campaigns;
    address public immutable campaignImplementation;

    event CampaignCreated(address indexed clone, string name, address owner);

    constructor() {
        campaignImplementation = address(new DonationCampaign());
    }

    function createCampaign(string memory name) external {
        address clone = Clones.clone(campaignImplementation);
        DonationCampaign(clone).initialize(name, msg.sender);
        campaigns.push(clone);

        emit CampaignCreated(clone, name, msg.sender);
    }

    function getCampaigns() external view returns (address[] memory) {
        return campaigns;
    }
}