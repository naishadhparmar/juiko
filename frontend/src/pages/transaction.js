import React, { useState, useEffect } from 'react';

function Transaction({ transaction, lookup }) {
    const [tags, setTags] = useState(transaction.tags || []);
    const [newTag, setNewTag] = useState('');
    const [isAddingTag, setIsAddingTag] = useState(false);

    const getInstrumentName = () => {
        if (lookup && lookup.instrument && lookup.instrument[transaction.instrument_id]) {
            const instrument = lookup.instrument[transaction.instrument_id];
            return `${instrument.account_name}`;
        }
        return transaction.instrument_id;
    };

    const handleAddTag = async () => {
        const tag = newTag.trim();
        if (!tag) return;
        try {
            const response = await fetch('http://127.0.0.1:5000/transaction/tag/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({ transaction_id: transaction.id, tag })
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            setTags(prev => [...prev, tag]);
            setNewTag('');
            setIsAddingTag(false);
        } catch (error) {
            alert('Error adding tag: ' + error.message);
        }
    };

    const handleRemoveTag = async (tag) => {
        try {
            const response = await fetch(
                `http://127.0.0.1:5000/transaction/tag/?transaction_id=${transaction.id}&tag=${encodeURIComponent(tag)}`,
                { method: 'DELETE' }
            );
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            setTags(prev => prev.filter(t => t !== tag));
        } catch (error) {
            alert('Error removing tag: ' + error.message);
        }
    };

    const handleTagKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddTag();
        } else if (e.key === 'Escape') {
            e.stopPropagation();
            setIsAddingTag(false);
            setNewTag('');
        }
    };

    return (
        <tr key={transaction.key}>
            <td>{transaction.transaction_date}</td>
            <td>{transaction.posted_date}</td>
            <td>{transaction.description}</td>
            <td>{transaction.amount}</td>
            <td>{getInstrumentName()}</td>
            <td>
                <div className="tags-cell">
                    {tags.map(tag => (
                        <span key={tag} className="tag-pill">
                            {tag}
                            <button className="tag-remove" onClick={() => handleRemoveTag(tag)}>×</button>
                        </span>
                    ))}
                    {isAddingTag ? (
                        <input
                            type="text"
                            value={newTag}
                            onChange={e => setNewTag(e.target.value)}
                            onKeyDown={handleTagKeyDown}
                            onBlur={() => { if (!newTag.trim()) setIsAddingTag(false); }}
                            placeholder="tag name"
                            className="tag-input"
                            autoFocus
                        />
                    ) : (
                        <button className="tag-add-btn" onClick={() => setIsAddingTag(true)}>+</button>
                    )}
                </div>
            </td>
        </tr>
    );
}

function NewTransactionRow({ onCancel, onSubmit, instruments }) {
    const [formData, setFormData] = useState({
        transaction_date: '',
        posted_date: '',
        description: '',
        amount: '',
        instrument_id: ''
    });

    const [tagList, setTagList] = useState([]);
    const [tagInput, setTagInput] = useState('');
    const [isAddingTag, setIsAddingTag] = useState(false);
    const [showConfirmCancel, setShowConfirmCancel] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                if (isAddingTag) {
                    setIsAddingTag(false);
                    setTagInput('');
                    return;
                }
                const hasData = Object.values(formData).some(value => value !== '') || tagList.length > 0;
                if (hasData) {
                    setShowConfirmCancel(true);
                } else {
                    onCancel();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [formData, onCancel, isAddingTag, tagList]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleAddTag = () => {
        const tag = tagInput.trim();
        if (tag && !tagList.includes(tag)) {
            setTagList(prev => [...prev, tag]);
        }
        setTagInput('');
        setIsAddingTag(false);
    };

    const handleRemoveTag = (tag) => {
        setTagList(prev => prev.filter(t => t !== tag));
    };

    const handleTagKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddTag();
        } else if (e.key === 'Escape') {
            e.stopPropagation();
            setIsAddingTag(false);
            setTagInput('');
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (formData.transaction_date && formData.posted_date && formData.description && formData.amount && formData.instrument_id) {
            onSubmit({ ...formData, tags: tagList.join(',') });
        } else {
            alert('Please fill in all required fields');
        }
    };

    const handleCancelClick = () => {
        const hasData = Object.values(formData).some(value => value !== '') || tagList.length > 0;
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
                <td colSpan="7" className="confirmation-row">
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
                <select
                    name="instrument_id"
                    value={formData.instrument_id}
                    onChange={handleChange}
                    className="new-input"
                    style={{ cursor: 'pointer' }}
                >
                    <option value="">Select Instrument</option>
                    {instruments && instruments.map((instrument) => (
                        <option key={instrument.id} value={instrument.id}>
                            {instrument.account_name}
                        </option>
                    ))}
                </select>
            </td>
            <td>
                <div className="tags-cell">
                    {tagList.map(tag => (
                        <span key={tag} className="tag-pill">
                            {tag}
                            <button className="tag-remove" onClick={() => handleRemoveTag(tag)}>×</button>
                        </span>
                    ))}
                    {isAddingTag ? (
                        <input
                            type="text"
                            value={tagInput}
                            onChange={e => setTagInput(e.target.value)}
                            onKeyDown={handleTagKeyDown}
                            onBlur={() => { if (!tagInput.trim()) setIsAddingTag(false); }}
                            placeholder="tag name"
                            className="tag-input"
                            autoFocus
                        />
                    ) : (
                        <button className="tag-add-btn" onClick={() => setIsAddingTag(true)}>+</button>
                    )}
                </div>
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

export default function FilterableTransactionTable({ transactions, lookup }) {
    const [isAddingTransaction, setIsAddingTransaction] = useState(false);

    const getInstruments = () => {
        if (lookup && lookup.instrument) {
            return Object.values(lookup.instrument);
        }
        return [];
    };

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
                            <th>Instrument</th>
                            <th>Tags</th>
                            {isAddingTransaction && <th>Actions</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {isAddingTransaction && (
                            <NewTransactionRow
                                onCancel={() => setIsAddingTransaction(false)}
                                onSubmit={handleAddTransaction}
                                instruments={getInstruments()}
                            />
                        )}
                        {transactions.map((transaction) => (
                            <Transaction key={transaction.id} transaction={transaction} lookup={lookup} />
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
