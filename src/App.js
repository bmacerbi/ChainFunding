import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import DonationFactory from './DonationFactory.json';
import DonationCampaign from './DonationCampaign.json';

const factoryAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3';

function App() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [factory, setFactory] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [newCampaignName, setNewCampaignName] = useState('');

  useEffect(() => {
    async function init() {
      if (window.ethereum) {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const factory = new ethers.Contract(factoryAddress, DonationFactory.abi, signer);

        setProvider(provider);
        setSigner(signer);
        setFactory(factory);

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
      } else {
        alert('Please install MetaMask!');
      }
    }
    init();
  }, []);

  const createCampaign = async () => {
    if (newCampaignName) {
      const tx = await factory.createCampaign(newCampaignName);
      await tx.wait();
      setNewCampaignName('');

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
    }
  };

  const donate = async (campaignAddress, amount) => {
    const campaign = new ethers.Contract(campaignAddress, DonationCampaign.abi, signer);
    const tx = await campaign.donate({ value: ethers.parseEther(amount) });
    await tx.wait();
    alert('Donation successful!');
  };

  return (
    <div className="App">
      <h1>Decentralized Donation dApp</h1>
      <div>
        <h2>Create a New Campaign</h2>
        <input
          type="text"
          value={newCampaignName}
          onChange={(e) => setNewCampaignName(e.target.value)}
          placeholder="Campaign Name"
        />
        <button onClick={createCampaign}>Create Campaign</button>
      </div>
      <div>
        <h2>Campaigns</h2>
        <ul>
          {campaigns.map((campaign, index) => (
            <li key={index}>
              <h3>{campaign.name}</h3>
              <p>Total Donations: {ethers.formatEther(campaign.totalDonations)} ETH</p>
              <input
                type="text"
                placeholder="Amount in ETH"
                id={`amount-${index}`}
              />
              <button onClick={() => donate(campaign.address, document.getElementById(`amount-${index}`).value)}>
                Donate
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default App;