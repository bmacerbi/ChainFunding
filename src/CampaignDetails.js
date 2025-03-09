import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import DonationCampaign from './artifacts/contracts/DonationCampaign.sol/DonationCampaign.json';

const CampaignDetails = ({ campaignAddress, provider, signer, onClose }) => {
  const [transactions, setTransactions] = useState([]);
  const [sortOrder, setSortOrder] = useState('desc'); 

  useEffect(() => {
    async function fetchTransactions() {
      const campaign = new ethers.Contract(campaignAddress, DonationCampaign.abi, provider);
      const txHistory = await campaign.getTransactions();

      const txHistoryCopy = [...txHistory];

      const sortedTransactions = txHistoryCopy.sort((a, b) => {
        if (sortOrder === 'desc') {
          return b.amount > a.amount ? 1 : -1; 
        } else {
          return a.amount > b.amount ? 1 : -1; 
        }
      });

      setTransactions(sortedTransactions);
    }
    fetchTransactions();
  }, [campaignAddress, provider, sortOrder]);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const toggleSortOrder = () => {
    setSortOrder((prevOrder) => (prevOrder === 'desc' ? 'asc' : 'desc'));
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-content">
        <button onClick={onClose} className="close-btn">
          &times;
        </button>
        <h2>Transaction History</h2>
        <button onClick={toggleSortOrder} className="sort-btn">
          Sort by Amount ({sortOrder === 'desc' ? 'Descending' : 'Ascending'})
        </button>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Donor</th>
                <th>Amount (ETH)</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx, index) => (
                <tr key={index}>
                  <td>{tx.donor}</td>
                  <td>{ethers.formatEther(tx.amount)}</td>
                  <td>{new Date(Number(tx.timestamp) * 1000).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CampaignDetails;