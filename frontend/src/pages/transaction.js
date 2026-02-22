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

export default function FilterableTransactionTable({ transactions }) {
  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            <th>Transaction Date</th>
            <th>Posted Date</th>
            <th>Description</th>
            <th>Amount</th>
            <th>Instrument ID</th>
          </tr>
        </thead>
        <tbody> 
            {transactions.map((transaction) => ( 
                <Transaction transaction={transaction} />
            ))}
        </tbody>
      </table>
    </div>
  );
}