import React, { useState, useEffect } from 'react';

function Transaction({ transaction }) {
    return (
        <tr key={transaction.key}>
            <td>{transaction.transaction_date}</td>
            <td>{transaction.posted_date}</td>
            <td>{transaction.description}</td>
            <td>{transaction.amount}</td>
            <td>{transaction.instrument_id}</td>
        </tr>
    );
}

function NewTransactionRow({ onCancel, onSubmit }) {
  const [formData, setFormData] = useState({
    transaction_date: '',
    posted_date: '',
    description: '',
    amount: '',
    instrument_id: ''
  });

  const [showConfirmCancel, setShowConfirmCancel] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        const hasData = Object.values(formData).some(value => value !== '');
        if (hasData) {
          setShowConfirmCancel(true);
        } else {
          onCancel();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [formData, onCancel]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.transaction_date && formData.posted_date && formData.description && formData.amount && formData.instrument_id) {
      onSubmit(formData);
    } else {
      alert('Please fill in all fields');
    }
  };

  const handleCancelClick = () => {
    const hasData = Object.values(formData).some(value => value !== '');
    if (hasData) {
      setShowConfirmCancel(true);
    } else {
      onCancel();
    }
  };

  const handleCancelConfirm = () => {
    setShowConfirmCancel(false);
    onCancel();
  };

  if (showConfirmCancel) {
    return (
      <tr className="new-transaction-row">
        <td colSpan="6" className="confirmation-row">
          <div className="confirmation-content">
            <span className="confirmation-text">Are you sure you want to cancel?</span>
            <div className="confirmation-buttons">
              <button 
                onClick={() => setShowConfirmCancel(false)}
                className="btn-primary"
              >
                Keep Editing
              </button>
              <button 
                onClick={handleCancelConfirm}
                className="btn-danger"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="new-transaction-row">
      <td>
        <input
          type="date"
          name="transaction_date"
          value={formData.transaction_date}
          onChange={handleChange}
          className="new-input"
        />
      </td>
      <td>
        <input
          type="date"
          name="posted_date"
          value={formData.posted_date}
          onChange={handleChange}
          className="new-input"
        />
      </td>
      <td>
        <input
          type="text"
          name="description"
          placeholder="Description"
          value={formData.description}
          onChange={handleChange}
          className="new-input"
        />
      </td>
      <td>
        <input
          type="number"
          name="amount"
          placeholder="Amount"
          step="0.01"
          value={formData.amount}
          onChange={handleChange}
          className="new-input"
        />
      </td>
      <td>
        <input
          type="number"
          name="instrument_id"
          placeholder="Instrument ID"
          value={formData.instrument_id}
          onChange={handleChange}
          className="new-input"
        />
      </td>
      <td className="transaction-actions">
        <button
          onClick={handleSubmit}
          className="btn-primary"
        >
          Save
        </button>
        <button
          onClick={handleCancelClick}
          className="btn-danger"
        >
          Cancel
        </button>
      </td>
    </tr>
  );
}

export default function FilterableTransactionTable({ transactions }) {
  const [isAddingTransaction, setIsAddingTransaction] = useState(false);

  const handleAddTransaction = async (formData) => {
    try {
      const response = await fetch('http://127.0.0.1:5000/transaction/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(formData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Transaction added:', data);
      setIsAddingTransaction(false);
      // Optionally refresh the transactions list or add to the current list
      window.location.reload();
    } catch (error) {
      console.error('Error adding transaction:', error);
      alert('Error adding transaction: ' + error.message);
    }
  };

  return (
    <div>
      <div>
        <button
          onClick={() => setIsAddingTransaction(true)}
          disabled={isAddingTransaction}
          className="add-transaction-button"
        >
          + Add Transaction
        </button>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Transaction Date</th>
              <th>Posted Date</th>
              <th>Description</th>
              <th>Amount</th>
              <th>Instrument ID</th>
              {isAddingTransaction && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {isAddingTransaction && (
              <NewTransactionRow 
                onCancel={() => setIsAddingTransaction(false)}
                onSubmit={handleAddTransaction}
              />
            )}
            {transactions.map((transaction) => (
              <Transaction transaction={transaction} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}