import React from 'react';

function StatusBadge({ status }) {
    return (
        <span className={`status-badge ${status}`}>
            {status}
        </span>
    );
}

function StatementRow({ statement, lookup }) {
    const instrument = lookup?.instrument?.[String(statement.instrument_id)];

    return (
        <tr>
            <td>{instrument ? instrument.account_name : statement.instrument_id}</td>
            <td>{instrument ? instrument.financial_institution : '—'}</td>
            <td>{statement.original_filename}</td>
            <td>{statement.upload_date}</td>
            <td style={{ textAlign: 'center' }}>{statement.row_count}</td>
            <td><StatusBadge status={statement.status} /></td>
        </tr>
    );
}

export default function StatementsTable({ statements, lookup, onRefresh }) {
    const hasProcessing = statements.some(
        s => s.status === 'pending' || s.status === 'processing'
    );

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                {hasProcessing && (
                    <span style={{ fontSize: '13px', color: '#854d0e' }}>
                        Some statements are still processing.
                    </span>
                )}
                <button onClick={onRefresh} className="btn-secondary">
                    Refresh
                </button>
            </div>

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Account</th>
                            <th>Institution</th>
                            <th>File</th>
                            <th>Uploaded</th>
                            <th>Rows</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {statements.length === 0 ? (
                            <tr>
                                <td colSpan="6" style={{ textAlign: 'center', color: '#94a3b8', padding: '32px' }}>
                                    No statements uploaded yet.
                                </td>
                            </tr>
                        ) : (
                            statements.map(s => (
                                <StatementRow key={s.id} statement={s} lookup={lookup} />
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
