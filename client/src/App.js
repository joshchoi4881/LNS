import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import LNS from "./utils/LNS.json";
import ethereum from "./assets/ethereum.png";
import polygon from "./assets/polygon.png";
import "./styles/App.css";

const REACT_APP_CONTRACT_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS;
const LAVISH = LNS.abi;
const TLD = ".lavish";

const App = () => {
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState(null);
  const [chain, setChain] = useState(null);
  const [domain, setDomain] = useState("");
  const [record, setRecord] = useState("");
  const [mints, setMints] = useState([]);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    isConnected();
  }, []);

  useEffect(() => {
    if (contract && account && chain === "0x13881") {
      getMints();
    }
  }, [contract, account, chain]);

  const isConnected = async () => {
    function handleAccountsChanged() {
      window.location.reload();
    }
    function handleChainChanged() {
      window.location.reload();
    }
    try {
      if (!window.ethereum) {
        alert("download metamask @ https://metamask.io/download/");
        return;
      }
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(
        REACT_APP_CONTRACT_ADDRESS,
        LAVISH,
        signer
      );
      setContract(contract);
      const accounts = await window.ethereum.request({
        method: "eth_accounts",
      });
      setAccount(accounts[0]);
      const chainId = await window.ethereum.request({ method: "eth_chainId" });
      setChain(chainId);
      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", handleChainChanged);
    } catch (error) {
      console.error(error);
    }
  };

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        alert("download metamask @ https://metamask.io/download/");
        return;
      }
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      setAccount(accounts[0]);
    } catch (error) {
      console.error(error);
    }
  };

  const switchChain = async () => {
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x13881" }],
      });
      const chainId = await window.ethereum.request({ method: "eth_chainId" });
      setChain(chainId);
    } catch (error) {
      if (error.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: "0x13881",
                chainName: "Polygon Mumbai Testnet",
                rpcUrls: ["https://rpc-mumbai.maticvigil.com/"],
                nativeCurrency: {
                  name: "Mumbai Matic",
                  symbol: "MATIC",
                  decimals: 18,
                },
                blockExplorerUrls: ["https://mumbai.polygonscan.com/"],
              },
            ],
          });
        } catch (error) {
          console.error(error);
        }
      }
      console.error(error);
    }
  };

  const getMints = async () => {
    try {
      const names = await contract.getAllNames();
      const mints = await Promise.all(
        names.map(async (name) => {
          const owner = await contract.domains(name);
          const mint = await contract.records(name);
          return {
            id: names.indexOf(name),
            owner: owner,
            name,
            record: mint,
          };
        })
      );
      setMints(mints);
    } catch (error) {
      console.error(error);
    }
  };

  const mint = async () => {
    const domainLength = domain.length;
    if (domain && domainLength >= 3 && domainLength <= 10) {
      const price =
        domainLength === 3 ? "0.05" : domainLength === 4 ? "0.03" : "0.01";
      try {
        if (window.ethereum) {
          let tx = await contract.register(domain, {
            value: ethers.utils.parseEther(price),
          });
          await tx.wait();
          tx = await contract.setRecord(domain, record);
          await tx.wait();
          setDomain("");
          setRecord("");
          setTimeout(() => {
            getMints();
          }, 3000);
        }
      } catch (error) {
        console.error(error);
      }
    } else {
      alert("domain must be between 3 and 10 characters long");
    }
  };

  const updateDomain = async () => {
    const domainLength = domain.length;
    if (domain && domainLength >= 3 && domainLength <= 10 && record) {
      try {
        setLoading(true);
        let tx = await contract.setRecord(domain, record);
        await tx.wait();
        setDomain("");
        setRecord("");
        setTimeout(() => {
          getMints();
        }, 3000);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
  };

  const editRecord = (name) => {
    setEditing(true);
    setDomain(name);
  };

  const renderConnectWallet = () => (
    <>
      <div className="connect-wallet-container">
        <img
          src="https://media.giphy.com/media/rY93u9tQbybks/giphy.gif"
          alt="Gatsby"
        />
        <button
          className="cta-button connect-wallet-button"
          onClick={connectWallet}
        >
          connect metamask
        </button>
      </div>
    </>
  );

  const renderSwitchChain = () => (
    <>
      <div className="connect-wallet-container">
        <img
          src="https://media.giphy.com/media/rY93u9tQbybks/giphy.gif"
          alt="Gatsby"
        />
        <button className="cta-button mint-button" onClick={switchChain}>
          switch to mumbai
        </button>
      </div>
    </>
  );

  const renderForm = () => (
    <>
      <div className="form-container">
        <div className="first-row">
          <input
            type="text"
            placeholder="google"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
          />
          <p className="tld">{TLD}</p>
        </div>
        <input
          type="text"
          placeholder="https://www.google.com/"
          value={record}
          onChange={(e) => setRecord(e.target.value)}
        />
        {editing ? (
          <div className="button-container">
            <button
              disabled={loading}
              className="cta-button mint-button"
              onClick={updateDomain}
            >
              udpate
            </button>
            <button
              className="cta-button mint-button"
              onClick={() => {
                setDomain("");
                setRecord("");
                setEditing(false);
              }}
            >
              cancel
            </button>
          </div>
        ) : (
          <button
            disabled={loading}
            className="cta-button mint-button"
            onClick={mint}
          >
            mint
          </button>
        )}
      </div>
    </>
  );

  const renderMints = () => (
    <>
      <div className="mint-container">
        <p className="subtitle">minted domains</p>
        <div className="mint-list">
          {mints.map((mint, i) => {
            return (
              <div className="mint-item" key={i}>
                <div className="mint-row">
                  <a
                    href={`https://testnets.opensea.io/assets/mumbai/${REACT_APP_CONTRACT_ADDRESS}/${mint.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link"
                  >
                    <p>
                      {" "}
                      {mint.name}
                      {TLD}{" "}
                    </p>
                  </a>
                  {account.toLowerCase() === mint.owner.toLowerCase() ? (
                    <button
                      className="edit-button"
                      onClick={() => editRecord(mint.name)}
                    >
                      <img
                        src="https://img.icons8.com/metro/26/000000/pencil.png"
                        alt="Edit button"
                        className="edit-icon"
                      />
                    </button>
                  ) : null}
                </div>
                <p>{mint.record}</p>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );

  return (
    <div className="App">
      <div className="container">
        <div className="header-container">
          <header>
            <div className="left">
              <p className="title">Lavish Name Service</p>
              <p className="subtitle">lavish domains</p>
            </div>
            <div className="right">
              <img
                className="logo"
                src={chain === "0x13881" ? polygon : ethereum}
                alt="chain"
              />
              {account ? (
                <p>
                  {" "}
                  wallet: {account.slice(0, 8)}...
                  {account.slice(-3)}{" "}
                </p>
              ) : (
                <p>not connected</p>
              )}
            </div>
          </header>
        </div>
        {!account
          ? renderConnectWallet()
          : chain !== "0x13881"
          ? renderSwitchChain()
          : renderForm()}
        {mints && renderMints()}
      </div>
    </div>
  );
};

export default App;
