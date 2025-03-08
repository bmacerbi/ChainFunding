import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import DonationFactory from './DonationFactory.json';
import DonationCampaign from './DonationCampaign.json';
import './App.css';

const factoryAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3';

function App() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [factory, setFactory] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [newCampaignName, setNewCampaignName] = useState('');
  const [isMetaMaskConnected, setIsMetaMaskConnected] = useState(false);

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

          const campaignAddresses = await factory.getCampaigns();
          const campaigns = await Promise.all(
            campaignAddresses.map(async (address) => {
              const campaign = new ethers.Contract(address, DonationCampaign.abi, signer);
              const name = await campaign.name();
              const totalDonations = await campaign.totalDonations();
              return { address, name, totalDonations };
            })
          );
          setCampaigns(campaigns);

          factory.on("CampaignCreated", async (campaignAddress, name) => {
            const campaign = new ethers.Contract(campaignAddress, DonationCampaign.abi, signer);
            const totalDonations = await campaign.totalDonations();
            setCampaigns((prevCampaigns) => [
              ...prevCampaigns,
              { address: campaignAddress, name, totalDonations },
            ]);
          });

        } catch (error) {
          console.error("Error connecting to MetaMask:", error);
          alert("Failed to connect to MetaMask. Please try again.");
        }
      } else {
        alert('Please install MetaMask!');
      }
    }
    init();

    return () => {
      if (factory) {
        factory.removeAllListeners("CampaignCreated");
      }
    };
  }, []); 

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
          <div className="campaign-list">
            {campaigns.map((campaign, index) => (
              <div key={index} className="campaign-card">
                <h3>{campaign.name}</h3>
                <p>Total Donations: {ethers.formatEther(campaign.totalDonations)} ETH</p>
                <div className="donate-section">
                  <input
                    type="text"
                    placeholder="Amount in ETH"
                    id={`amount-${index}`}
                    className="input-field"
                  />
                  <button
                    onClick={() => donate(campaign.address, document.getElementById(`amount-${index}`).value)}
                    className="btn-secondary"
                  >
                    Donate
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;