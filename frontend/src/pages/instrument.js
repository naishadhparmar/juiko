import React, { useState, useEffect } from 'react';

function Instrument({ instrument }) {
    return (
        <tr key={instrument.id}>
            <td>{instrument.id}</td>
            <td>{instrument.financial_institution}</td>
            <td>{instrument.account_name}</td>
            <td>{instrument.instrument_type}</td>
        </tr>
    );
}

function NewInstrumentRow({ onCancel, onSubmit, instrumentTypes }) {
  const [formData, setFormData] = useState({
    financial_institution: '',
    account_name: '',
    instrument_type: ''
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
    if (formData.financial_institution && formData.account_name && formData.instrument_type) {
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
      <tr className="new-instrument-row">
        <td colSpan="5" className="confirmation-row">
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
    <tr className="new-instrument-row">
      <td></td>
      <td>
        <input
          type="text"
          name="financial_institution"
          placeholder="Financial Institution"
          value={formData.financial_institution}
          onChange={handleChange}
          className="new-input"
        />
      </td>
      <td>
        <input
          type="text"
          name="account_name"
          placeholder="Account Name"
          value={formData.account_name}
          onChange={handleChange}
          className="new-input"
        />
      </td>
      <td>
        <select
          name="instrument_type"
          value={formData.instrument_type}
          onChange={handleChange}
          className="new-input"
          style={{ cursor: 'pointer' }}
        >
          <option value="">Select Instrument Type</option>
          {instrumentTypes.map((it) => (
            <option key={it.id} value={it.id}>
              {it.type_name}
            </option>
          ))}
        </select>
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

export default function FilterableInstrumentTable({ instruments }) {
  const [isAddingInstrument, setIsAddingInstrument] = useState(false);
  const [instrumentTypes, setInstrumentTypes] = useState([]);
  const [loadingTypes, setLoadingTypes] = useState(true);

  useEffect(() => {
    const fetchInstrumentTypes = async () => {
      try {
        const response = await fetch('http://127.0.0.1:5000/instrument_type/');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setInstrumentTypes(data);
        setLoadingTypes(false);
      } catch (error) {
        console.error('Error fetching instrument types:', error);
        setLoadingTypes(false);
      }
    };

    fetchInstrumentTypes();
  }, []);

  const handleAddInstrument = async (formData) => {
    try {
      const response = await fetch('http://127.0.0.1:5000/instrument/', {
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
      console.log('Instrument added:', data);
      setIsAddingInstrument(false);
      // Optionally refresh the instruments list or add to the current list
      window.location.reload();
    } catch (error) {
      console.error('Error adding instrument:', error);
      alert('Error adding instrument: ' + error.message);
    }
  };

  return (
    <div>
      <div>
        <button
          onClick={() => setIsAddingInstrument(true)}
          disabled={isAddingInstrument || loadingTypes}
          className="add-transaction-button"
        >
          + Add Instrument
        </button>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Financial Institution</th>
              <th>Account Name</th>
              <th>Instrument Type</th>
              {isAddingInstrument && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {isAddingInstrument && (
              <NewInstrumentRow 
                onCancel={() => setIsAddingInstrument(false)}
                onSubmit={handleAddInstrument}
                instrumentTypes={instrumentTypes}
              />
            )}
            {instruments.map((instrument) => (
              <Instrument instrument={instrument} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}