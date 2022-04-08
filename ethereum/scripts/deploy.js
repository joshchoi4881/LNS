const main = async () => {
  const contractFactory = await hre.ethers.getContractFactory("LNS");
  const contract = await contractFactory.deploy("lavish");
  await contract.deployed();
  console.log("Contract Address:", contract.address);
};

const run = async () => {
  try {
    await main();
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

run();
