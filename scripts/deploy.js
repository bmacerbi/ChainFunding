const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  const DonationFactory = await hre.ethers.getContractFactory("DonationFactory");
  const donationFactory = await DonationFactory.deploy();
  await donationFactory.waitForDeployment();
  
  const donationFactoryAddress = await donationFactory.getAddress();
  console.log("DonationFactory deployed to:", donationFactoryAddress);

  const tx = await donationFactory.createCampaign("Sample Campaign");
  await tx.wait();

  const campaigns = await donationFactory.getCampaigns();
  console.log("Sample Campaign deployed to:", campaigns[0]);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });