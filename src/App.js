import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import DonationFactory from './artifacts/contracts/DonationFactory.sol/DonationFactory.json';
import DonationCampaign from './artifacts/contracts/DonationCampaign.sol/DonationCampaign.json';
import CampaignDetails from './CampaignDetails'; 
import './App.css';

const factoryAddress = '0xA416FEF123BC1E03Ae48660bD86dddABA6AD4AB3';

function App() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [factory, setFactory] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [newCampaignName, setNewCampaignName] = useState('');
  const [isMetaMaskConnected, setIsMetaMaskConnected] = useState(false);
  const [userAddress, setUserAddress] = useState('');
  const [selectedCampaign, setSelectedCampaign] = useState(null); 
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name'); // Default sorting by name

  useEffect(() => {
    async function init() {
      if (window.ethereum) {
        try {
          await window.ethereum.request({ method: 'eth_requestAccounts' });
          const provider = new ethers.BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          const factory = new ethers.Contract(factoryAddress, DonationFactory.abi, signer);
          setProvider(provider);
          setSigner(signer);
          setFactory(factory);
          setIsMetaMaskConnected(true);
          const address = await signer.getAddress();
          setUserAddress(address);

          const campaignAddresses = await factory.getCampaigns();
          const campaigns = await Promise.all(
            campaignAddresses.map(async (address) => {
              const campaign = new ethers.Contract(address, DonationCampaign.abi, signer);
              const name = await campaign.name();
              const totalDonations = await campaign.totalDonations();
              const owner = await campaign.owner();
              const balance = await provider.getBalance(address);
              return { address, name, totalDonations, owner, balance };
            })
          );
          setCampaigns(campaigns);
        } catch (error) {
          console.error("Error connecting to MetaMask:", error);
          if (error.code === 4001) {
            alert("Please connect your MetaMask account to use this dApp.");
          } else if (error.code === -32002) {
            alert("MetaMask is already processing a request. Please check your MetaMask extension.");
          } else {
            alert("Failed to connect to MetaMask. Please try again.");
          }
        }
      } else {
        alert('Please install MetaMask!');
      }
    }
    init();
  }, []);

  useEffect(() => {
    if (factory) {
      const handleCampaignCreated = async (campaignAddress, name) => {
        const campaign = new ethers.Contract(campaignAddress, DonationCampaign.abi, signer);
        const totalDonations = await campaign.totalDonations();
        const owner = await campaign.owner();
        const balance = await provider.getBalance(campaignAddress);
        setCampaigns((prevCampaigns) => [
          ...prevCampaigns,
          { address: campaignAddress, name, totalDonations, owner, balance },
        ]);
      };

      factory.on("CampaignCreated", handleCampaignCreated);

      return () => {
        factory.off("CampaignCreated", handleCampaignCreated);
      };
    }
  }, [factory, signer, provider]);

  useEffect(() => {
    if (campaigns.length > 0 && provider) {
      const donationEventListeners = campaigns.map((campaign) => {
        const campaignContract = new ethers.Contract(campaign.address, DonationCampaign.abi, provider);

        const handleDonationReceived = async (donor, amount) => {
          setCampaigns((prevCampaigns) =>
            prevCampaigns.map((c) =>
              c.address === campaign.address
                ? { ...c,
                    // eslint-disable-next-line no-undef
                    totalDonations: BigInt(c.totalDonations) + BigInt(amount),
                    // eslint-disable-next-line no-undef
                    balance: BigInt(c.balance) + BigInt(amount)
                  }
                : c
            )
          );
        };

        const handleFundsWithdrawn = async (owner, amount) => {
          setCampaigns((prevCampaigns) =>
            prevCampaigns.map((c) =>
              c.address === campaign.address
                ? { ...c, balance: 0 }
                : c
            )
          );
        };

        campaignContract.on("DonationReceived", handleDonationReceived);
        campaignContract.on("FundsWithdrawn", handleFundsWithdrawn);

        return { campaignContract, handleDonationReceived, handleFundsWithdrawn };
      });

      return () => {
        donationEventListeners.forEach(({ campaignContract, handleDonationReceived, handleFundsWithdrawn }) => {
          campaignContract.off("DonationReceived", handleDonationReceived);
          campaignContract.off("FundsWithdrawn", handleFundsWithdrawn);
        });
      };
    }
  }, [campaigns, provider]);

  const createCampaign = async () => {
    if (!isMetaMaskConnected) {
      alert('Please connect to MetaMask first.');
      return;
    }

    if (newCampaignName) {
      try {
        const tx = await factory.createCampaign(newCampaignName);
        await tx.wait();
        setNewCampaignName('');
      } catch (error) {
        console.error("Error creating campaign:", error);
        alert("Failed to create campaign. Please try again.");
      }
    }
  };

  const donate = async (campaignAddress, amount) => {
    if (!isMetaMaskConnected) {
      alert('Please connect to MetaMask first.');
      return;
    }

    try {
      const campaign = new ethers.Contract(campaignAddress, DonationCampaign.abi, signer);
      const tx = await campaign.donate({ value: ethers.parseEther(amount) });
      await tx.wait();
      alert('Donation successful!');
    } catch (error) {
      console.error("Error donating:", error);
      alert("Failed to donate. Please try again.");
    }
  };

  const withdrawFunds = async (campaignAddress) => {
    if (!isMetaMaskConnected) {
      alert('Please connect to MetaMask first.');
      return;
    }

    try {
      const campaign = new ethers.Contract(campaignAddress, DonationCampaign.abi, signer);
      const tx = await campaign.withdraw();
      await tx.wait();
      alert('Funds withdrawn successfully!');
    } catch (error) {
      console.error("Error withdrawing funds:", error);
      alert("Failed to withdraw funds. Please try again.");
    }
  };

  const filteredCampaigns = campaigns.filter((campaign) =>
    campaign.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedCampaigns = filteredCampaigns.sort((a, b) => {
    if (sortBy === 'name') {
      return a.name.localeCompare(b.name);
    } else if (sortBy === 'totalDonations') {
      return Number(b.totalDonations) - Number(a.totalDonations);
    }
    return 0;
  });

  return (
    <div className="App">
      <header className="header">
        <h1>Decentralized Donation dApp</h1>
        {!isMetaMaskConnected && <p className="warning">Please connect to MetaMask to use this dApp.</p>}
      </header>

      <main className="main-content">
        <section className="create-campaign">
          <h2>Create a New Campaign</h2>
          <div className="input-group">
            <input
              type="text"
              value={newCampaignName}
              onChange={(e) => setNewCampaignName(e.target.value)}
              placeholder="Enter Campaign Name"
              className="input-field"
            />
            <button onClick={createCampaign} className="btn-primary">
              Create Campaign
            </button>
          </div>
        </section>

        <section className="campaigns">
          <h2>Active Campaigns</h2>
          <div className="search-and-sort">
            <div className="search-bar">
              <i className="fas fa-search search-icon"></i>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search campaigns by name"
                className="search-input"
              />
            </div>
            <div className="sort-options">
              <label>Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="sort-select"
              >
                <option value="name">Name</option>
                <option value="totalDonations">Total Donations</option>
              </select>
            </div>
          </div>
          <div className="campaign-list">
            {sortedCampaigns.map((campaign, index) => (
              <div key={index} className="campaign-card">
                <h3>{campaign.name}</h3>
                <p>Total Donations: {ethers.formatEther(campaign.totalDonations)} ETH</p>
                <p>Current Balance: {ethers.formatEther(campaign.balance)} ETH</p>
                <div className="donate-section">
                  <input
                    type="text"
                    placeholder="Amount in ETH"
                    id={`amount-${index}`}
                    className="input-field"
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      donate(campaign.address, document.getElementById(`amount-${index}`).value);
                    }}
                    className="btn-secondary"
                  >
                    Donate
                  </button>
                  {campaign.owner === userAddress && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        withdrawFunds(campaign.address);
                      }}
                      className="btn-withdraw"
                    >
                      Withdraw Funds
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedCampaign(campaign.address);
                    }}
                    className="btn-history"
                  >
                    Show History
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {selectedCampaign && (
        <div className="modal">
          <div className="modal-content">
            <button onClick={() => setSelectedCampaign(null)} className="close-btn">
              &times;
            </button>
            <CampaignDetails
              campaignAddress={selectedCampaign}
              provider={provider}
              signer={signer}
              onClose={() => setSelectedCampaign(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;