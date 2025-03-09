import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import DonationCampaign from './artifacts/contracts/DonationCampaign.sol/DonationCampaign.json';

const CampaignDetails = ({ campaignAddress, provider, signer, onClose }) => {
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    async function fetchTransactions() {
      const campaign = new ethers.Contract(campaignAddress, DonationCampaign.abi, provider);
      const txHistory = await campaign.getTransactions();
  
      const txHistoryCopy = txHistory.map((tx) => ({
        user: tx.user,
        amount: tx.amount,
        timestamp: tx.timestamp,
        transactionType: Number(tx.transactionType),
      }));
  
      const sortedTransactions = txHistoryCopy.sort((a, b) => {
        return Number(b.timestamp) - Number(a.timestamp);
      });
  
      setTransactions(sortedTransactions);
    }
    fetchTransactions();
  }, [campaignAddress, provider]);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const formatTransactionType = (type) => {
    switch (type) {
      case 0:
        return "Donation";
      case 1:
        return "Withdrawal";
      case 2:
        return "Campaign Creation";
      default:
        return "Unknown";
    }
  };

  const formatAmount = (amount, transactionType) => {
    if (transactionType === 2) {
      return "N/A";
    }

    const formattedAmount = ethers.formatEther(amount);
    switch (transactionType) {
      case 0:
        return <span className="donation-amount">+{formattedAmount} ETH</span>;
      case 1:
        return <span className="withdrawal-amount">-{formattedAmount} ETH</span>;
      default:
        return formattedAmount;
    }
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-content">
        <button onClick={onClose} className="close-btn">
          &times;
        </button>
        <h2>Transaction History</h2>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Type</th>
                <th>Amount (ETH)</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx, index) => (
                <tr key={index}>
                  <td>{tx.user}</td>
                  <td>{formatTransactionType(tx.transactionType)}</td>
                  <td>{formatAmount(tx.amount, tx.transactionType)}</td>
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