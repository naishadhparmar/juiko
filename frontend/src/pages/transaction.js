import React, { useState, useEffect, useRef } from 'react';

function Transaction({ transaction, lookup, instruments, onDelete, isSelected, onToggle }) {
    const [tags, setTags] = useState(transaction.tags || []);
    const [newTag, setNewTag] = useState('');
    const [isAddingTag, setIsAddingTag] = useState(false);

    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({
        transaction_date: transaction.transaction_date,
        posted_date: transaction.posted_date,
        description: transaction.description,
        amount: transaction.amount,
        instrument_id: transaction.instrument_id
    });
    const [displayData, setDisplayData] = useState({
        transaction_date: transaction.transaction_date,
        posted_date: transaction.posted_date,
        description: transaction.description,
        amount: transaction.amount,
        instrument_id: transaction.instrument_id
    });

    const [showConfirmDelete, setShowConfirmDelete] = useState(false);

    const getInstrumentName = (instrument_id) => {
        if (lookup && lookup.instrument && lookup.instrument[instrument_id]) {
            return lookup.instrument[instrument_id].account_name;
        }
        return instrument_id;
    };

    // --- Tag handlers ---

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
            setTags(prev => [...prev, { tag, source: 'manual' }]);
            setNewTag('');
            setIsAddingTag(false);
        } catch (error) {
            alert('Error adding tag: ' + error.message);
        }
    };

    const handleRemoveTag = async (tagObj) => {
        try {
            const response = await fetch(
                `http://127.0.0.1:5000/transaction/tag/?transaction_id=${transaction.id}&tag=${encodeURIComponent(tagObj.tag)}`,
                { method: 'DELETE' }
            );
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            setTags(prev => prev.filter(t => t.tag !== tagObj.tag));
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

    const tagsCell = (
        <div className="tags-cell">
            {tags.map(t => (
                <span key={t.tag} className={`tag-pill${t.source === 'ai' ? ' ai' : ''}`}>
                    {t.tag}
                    <button className="tag-remove" onClick={() => handleRemoveTag(t)}>×</button>
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
    );

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
            const response = await fetch(`http://127.0.0.1:5000/transaction/${transaction.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams(editData)
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const updated = await response.json();
            const next = {
                transaction_date: updated.transaction_date,
                posted_date: updated.posted_date,
                description: updated.description,
                amount: updated.amount,
                instrument_id: updated.instrument_id
            };
            setDisplayData(next);
            setEditData(next);
            setIsEditing(false);
        } catch (error) {
            alert('Error updating transaction: ' + error.message);
        }
    };

    const handleCancelEdit = () => {
        setEditData({ ...displayData });
        setIsEditing(false);
    };

    // --- Delete handlers ---

    const handleDelete = async () => {
        try {
            const response = await fetch(`http://127.0.0.1:5000/transaction/${transaction.id}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            onDelete(transaction.id);
        } catch (error) {
            alert('Error deleting transaction: ' + error.message);
        }
    };

    // --- Render ---

    if (showConfirmDelete) {
        return (
            <tr>
                <td colSpan="8" className="confirmation-row">
                    <div className="confirmation-content">
                        <span className="confirmation-text">Delete this transaction?</span>
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
                <td></td>
                <td>
                    <input
                        type="date"
                        name="transaction_date"
                        value={editData.transaction_date}
                        onChange={handleEditChange}
                        onKeyDown={handleEditKeyDown}
                        className="new-input"
                    />
                </td>
                <td>
                    <input
                        type="date"
                        name="posted_date"
                        value={editData.posted_date}
                        onChange={handleEditChange}
                        onKeyDown={handleEditKeyDown}
                        className="new-input"
                    />
                </td>
                <td>
                    <input
                        type="text"
                        name="description"
                        value={editData.description}
                        onChange={handleEditChange}
                        onKeyDown={handleEditKeyDown}
                        className="new-input"
                    />
                </td>
                <td>
                    <input
                        type="number"
                        name="amount"
                        step="0.01"
                        value={editData.amount}
                        onChange={handleEditChange}
                        onKeyDown={handleEditKeyDown}
                        className="new-input"
                    />
                </td>
                <td>
                    <select
                        name="instrument_id"
                        value={editData.instrument_id}
                        onChange={handleEditChange}
                        className="new-input"
                        style={{ cursor: 'pointer' }}
                    >
                        {instruments && instruments.map((instrument) => (
                            <option key={instrument.id} value={instrument.id}>
                                {instrument.account_name}
                            </option>
                        ))}
                    </select>
                </td>
                <td>{tagsCell}</td>
                <td className="transaction-actions">
                    <button onClick={handleSave} className="btn-primary">Save</button>
                    <button onClick={handleCancelEdit} className="btn-danger">Cancel</button>
                </td>
            </tr>
        );
    }

    return (
        <tr>
            <td className="checkbox-cell">
                <input type="checkbox" checked={isSelected} onChange={() => onToggle(transaction.id)} />
            </td>
            <td>{displayData.transaction_date}</td>
            <td>{displayData.posted_date}</td>
            <td>{displayData.description}</td>
            <td>{displayData.amount}</td>
            <td>{getInstrumentName(String(displayData.instrument_id))}</td>
            <td>{tagsCell}</td>
            <td className="transaction-actions">
                <button onClick={() => setIsEditing(true)} className="btn-secondary">Edit</button>
                <button onClick={() => setShowConfirmDelete(true)} className="btn-danger">Delete</button>
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
                <td colSpan="8" className="confirmation-row">
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
            <td></td>
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

function UploadStatementModal({ onClose, instruments }) {
    const [instrumentId, setInstrumentId] = useState('');
    const [file, setFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [result, setResult] = useState(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    const handleSubmit = async () => {
        if (!file) return setResult({ type: 'error', message: 'Please select a CSV file.' });
        if (!instrumentId) return setResult({ type: 'error', message: 'Please select an instrument.' });

        const formData = new FormData();
        formData.append('file', file);
        formData.append('instrument_id', instrumentId);

        setIsUploading(true);
        setResult(null);
        try {
            const response = await fetch('http://127.0.0.1:5000/statement/', {
                method: 'POST',
                body: formData
            });
            const data = await response.json();
            if (!response.ok) {
                setResult({ type: 'error', message: data.error || 'Upload failed.' });
            } else {
                setResult({
                    type: 'success',
                    message: 'Statement uploaded. Processing in background — check the Statements page for status.'
                });
            }
        } catch (error) {
            setResult({ type: 'error', message: 'Upload failed: ' + error.message });
        } finally {
            setIsUploading(false);
        }
    };

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) onClose();
    };

    return (
        <div className="modal-overlay" onClick={handleOverlayClick}>
            <div className="modal">
                <h2 className="modal-title">Upload Statement</h2>

                <div className="modal-field">
                    <label className="modal-label">Instrument</label>
                    <select
                        value={instrumentId}
                        onChange={e => setInstrumentId(e.target.value)}
                        className="new-input"
                        style={{ cursor: 'pointer' }}
                    >
                        <option value="">Select Instrument</option>
                        {instruments.map(i => (
                            <option key={i.id} value={i.id}>{i.account_name}</option>
                        ))}
                    </select>
                </div>

                <div className="modal-field">
                    <label className="modal-label">CSV File</label>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv"
                        onChange={e => { setFile(e.target.files[0]); setResult(null); }}
                        className="new-input"
                        style={{ padding: '6px 8px' }}
                    />
                </div>

                {result && (
                    <div className={`upload-result ${result.type}`}>
                        {result.message}
                    </div>
                )}

                <div className="modal-footer">
                    <button
                        onClick={result?.type === 'success' ? () => window.location.reload() : onClose}
                        className="btn-secondary"
                    >
                        {result?.type === 'success' ? 'Done' : 'Cancel'}
                    </button>
                    {result?.type !== 'success' && (
                        <button
                            onClick={handleSubmit}
                            className="btn-primary"
                            disabled={isUploading}
                        >
                            {isUploading ? 'Uploading...' : 'Upload'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function FilterableTransactionTable({ transactions, lookup }) {
    const [isAddingTransaction, setIsAddingTransaction] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [txList, setTxList] = useState(transactions);
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
    const selectAllRef = useRef(null);

    const instruments = lookup && lookup.instrument ? Object.values(lookup.instrument) : [];

    useEffect(() => {
        if (selectAllRef.current) {
            selectAllRef.current.indeterminate = selectedIds.size > 0 && selectedIds.size < txList.length;
        }
    }, [selectedIds, txList]);

    const handleToggle = (id) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleToggleAll = () => {
        if (selectedIds.size === txList.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(txList.map(t => t.id)));
        }
    };

    const handleBulkDelete = async () => {
        const ids = [...selectedIds];
        let failed = 0;
        for (const id of ids) {
            try {
                const response = await fetch(`http://127.0.0.1:5000/transaction/${id}`, { method: 'DELETE' });
                if (response.ok) {
                    setTxList(prev => prev.filter(t => t.id !== id));
                    setSelectedIds(prev => { const next = new Set(prev); next.delete(id); return next; });
                } else {
                    failed++;
                }
            } catch {
                failed++;
            }
        }
        setShowBulkDeleteConfirm(false);
        if (failed > 0) alert(`${failed} transaction(s) could not be deleted.`);
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

    const handleDelete = (id) => {
        setTxList(prev => prev.filter(t => t.id !== id));
        setSelectedIds(prev => { const next = new Set(prev); next.delete(id); return next; });
    };

    return (
        <div>
            {showUploadModal && (
                <UploadStatementModal
                    onClose={() => setShowUploadModal(false)}
                    instruments={instruments}
                />
            )}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '0' }}>
                <button
                    onClick={() => setIsAddingTransaction(true)}
                    disabled={isAddingTransaction}
                    className="add-transaction-button"
                >
                    + Add Transaction
                </button>
                <button
                    onClick={() => setShowUploadModal(true)}
                    className="add-transaction-button"
                    style={{ backgroundColor: 'white', color: 'var(--primary-color)', border: '1px solid var(--primary-color)' }}
                >
                    Upload Statement
                </button>
                {selectedIds.size > 0 && (
                    <button
                        onClick={() => setShowBulkDeleteConfirm(true)}
                        className="add-transaction-button"
                        style={{ backgroundColor: 'white', color: 'var(--danger-color)', border: '1px solid var(--danger-color)' }}
                    >
                        Delete Selected ({selectedIds.size})
                    </button>
                )}
            </div>

            {showBulkDeleteConfirm && (
                <div className="bulk-delete-bar">
                    <span>Delete {selectedIds.size} transaction{selectedIds.size === 1 ? '' : 's'}?</span>
                    <div className="confirmation-buttons">
                        <button onClick={() => setShowBulkDeleteConfirm(false)} className="btn-primary">Cancel</button>
                        <button onClick={handleBulkDelete} className="btn-danger">Yes, Delete</button>
                    </div>
                </div>
            )}

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th className="checkbox-cell">
                                <input
                                    type="checkbox"
                                    ref={selectAllRef}
                                    checked={txList.length > 0 && selectedIds.size === txList.length}
                                    onChange={handleToggleAll}
                                />
                            </th>
                            <th>Transaction Date</th>
                            <th>Posted Date</th>
                            <th>Description</th>
                            <th>Amount</th>
                            <th>Instrument</th>
                            <th>Tags</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isAddingTransaction && (
                            <NewTransactionRow
                                onCancel={() => setIsAddingTransaction(false)}
                                onSubmit={handleAddTransaction}
                                instruments={instruments}
                            />
                        )}
                        {txList.map((transaction) => (
                            <Transaction
                                key={transaction.id}
                                transaction={transaction}
                                lookup={lookup}
                                instruments={instruments}
                                onDelete={handleDelete}
                                isSelected={selectedIds.has(transaction.id)}
                                onToggle={handleToggle}
                            />
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
