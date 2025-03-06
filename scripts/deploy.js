const hre = require("hardhat");

async function main() {
  const DonationFactory = await hre.ethers.getContractFactory("DonationFactory");

  const donationFactory = await DonationFactory.deploy();

  await donationFactory.waitForDeployment();

  console.log("DonationFactory deployed to:", await donationFactory.getAddress());

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