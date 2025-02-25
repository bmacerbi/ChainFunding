const hre = require("hardhat");

async function main() {
  const TuringVoting = await hre.ethers.getContractFactory("TuringVoting");
  const turingVoting = await TuringVoting.deploy();

  await turingVoting.waitForDeployment();

  console.log("TuringVoting deployed to:", await turingVoting.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});