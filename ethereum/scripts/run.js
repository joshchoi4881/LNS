const main = async () => {
  const contractFactory = await hre.ethers.getContractFactory("LNS");
  const contract = await contractFactory.deploy("lavish");
  await contract.deployed();
  console.log("Contract Address:", contract.address);
  let txn = await contract.register("josh", {
    value: hre.ethers.utils.parseEther("0.1"),
  });
  await txn.wait();
  const contractBalance = await hre.ethers.provider.getBalance(
    contract.address
  );
  console.log(
    "Contract Balance:",
    hre.ethers.utils.formatEther(contractBalance)
  );
  txn = await contract.setRecord("josh", "https://jclavish.art/");
  await txn.wait();
  const address = await contract.getAddress("josh");
  console.log("Domain Owner Address:", address);
  const allNames = await contract.getAllNames();
  console.log("All Names:", allNames);
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
