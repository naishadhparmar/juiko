import React, { useState, useEffect } from 'react';

function Instrument({ instrument, lookup, instrumentTypes, onDelete }) {
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({
        financial_institution: instrument.financial_institution,
        account_name: instrument.account_name,
        instrument_type: instrument.type
    });
    const [displayData, setDisplayData] = useState({
        financial_institution: instrument.financial_institution,
        account_name: instrument.account_name,
        instrument_type: instrument.type
    });
    const [transactionCount] = useState(instrument.transaction_count ?? 0);

    const [showConfirmDelete, setShowConfirmDelete] = useState(false);

    const getInstrumentTypeName = (type_id) => {
        if (lookup && lookup.instrument_type && lookup.instrument_type[`${type_id}`]) {
            return lookup.instrument_type[`${type_id}`].type_name;
        }
        return type_id;
    };

    // --- Edit handlers ---

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditData(prev => ({ ...prev, [name]: value }));
    };

    const handleEditKeyDown = (e) => {
        if (e.key === 'Escape') handleCancelEdit();
    };

    const handleSave = async () => {
        try {
            const response = await fetch(`http://127.0.0.1:5000/instrument/${instrument.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams(editData)
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const updated = await response.json();
            const next = {
                financial_institution: updated.financial_institution,
                account_name: updated.account_name,
                instrument_type: updated.type
            };
            setDisplayData(next);
            setEditData(next);
            setIsEditing(false);
        } catch (error) {
            alert('Error updating instrument: ' + error.message);
        }
    };

    const handleCancelEdit = () => {
        setEditData({ ...displayData });
        setIsEditing(false);
    };

    // --- Delete handlers ---

    const handleDelete = async () => {
        try {
            const response = await fetch(`http://127.0.0.1:5000/instrument/${instrument.id}`, {
                method: 'DELETE'
            });
            const data = await response.json();
            if (!response.ok) {
                alert(data.error || `HTTP error! status: ${response.status}`);
                setShowConfirmDelete(false);
                return;
            }
            onDelete(instrument.id);
        } catch (error) {
            alert('Error deleting instrument: ' + error.message);
        }
    };

    // --- Render ---

    if (showConfirmDelete) {
        return (
            <tr>
                <td colSpan="4" className="confirmation-row">
                    <div className="confirmation-content">
                        <span className="confirmation-text">Delete this instrument?</span>
                        <div className="confirmation-buttons">
                            <button onClick={() => setShowConfirmDelete(false)} className="btn-primary">
                                Keep
                            </button>
                            <button onClick={handleDelete} className="btn-danger">
                                Yes, Delete
                            </button>
                        </div>
                    </div>
                </td>
            </tr>
        );
    }

    if (isEditing) {
        return (
            <tr className="new-transaction-row">
                <td>
                    <input
                        type="text"
                        name="account_name"
                        value={editData.account_name}
                        onChange={handleEditChange}
                        onKeyDown={handleEditKeyDown}
                        className="new-input"
                    />
                </td>
                <td>
                    <input
                        type="text"
                        name="financial_institution"
                        value={editData.financial_institution}
                        onChange={handleEditChange}
                        onKeyDown={handleEditKeyDown}
                        className="new-input"
                    />
                </td>
                <td>
                    <select
                        name="instrument_type"
                        value={editData.instrument_type}
                        onChange={handleEditChange}
                        className="new-input"
                        style={{ cursor: 'pointer' }}
                    >
                        {instrumentTypes && instrumentTypes.map((it) => (
                            <option key={it.id} value={it.id}>
                                {it.type_name}
                            </option>
                        ))}
                    </select>
                </td>
                <td className="transaction-actions">
                    <button onClick={handleSave} className="btn-primary">Save</button>
                    <button onClick={handleCancelEdit} className="btn-danger">Cancel</button>
                </td>
            </tr>
        );
    }

    return (
        <tr>
            <td>{displayData.account_name}</td>
            <td>{displayData.financial_institution}</td>
            <td>{getInstrumentTypeName(displayData.instrument_type)}</td>
            <td className="transaction-actions">
                <button onClick={() => setIsEditing(true)} className="btn-secondary">Edit</button>
                <button
                    onClick={() => setShowConfirmDelete(true)}
                    className="btn-danger"
                    disabled={transactionCount > 0}
                    title={transactionCount > 0 ? `Cannot delete: ${transactionCount} transaction${transactionCount === 1 ? '' : 's'} linked` : ''}
                >
                    Delete
                </button>
            </td>
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
                <td colSpan="4" className="confirmation-row">
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

export default function FilterableInstrumentTable({ instruments, lookup }) {
    const [isAddingInstrument, setIsAddingInstrument] = useState(false);
    const [instrumentList, setInstrumentList] = useState(instruments);

    const instrumentTypes = lookup && lookup.instrument_type ? Object.values(lookup.instrument_type) : [];

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
            window.location.reload();
        } catch (error) {
            console.error('Error adding instrument:', error);
            alert('Error adding instrument: ' + error.message);
        }
    };

    const handleDelete = (id) => {
        setInstrumentList(prev => prev.filter(i => i.id !== id));
    };

    return (
        <div>
            <div>
                <button
                    onClick={() => setIsAddingInstrument(true)}
                    disabled={isAddingInstrument}
                    className="add-transaction-button"
                >
                    + Add Instrument
                </button>
            </div>

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Account Name</th>
                            <th>Financial Institution</th>
                            <th>Instrument Type</th>
                            <th>Actions</th>
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
                        {instrumentList.map((instrument) => (
                            <Instrument
                                key={instrument.id}
                                instrument={instrument}
                                lookup={lookup}
                                instrumentTypes={instrumentTypes}
                                onDelete={handleDelete}
                            />
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
