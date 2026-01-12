import React, {useState, useEffect} from 'react';
import logo from './logo.svg';
import './App.css';
import FilterableTransactionTable from './pages/transaction';


const PRODUCTS = [
  {transaction_date: "2023-01-01", posted_date: "2023-01-02", description: "Uber", amount: "$100.00", instrument_id: "12345"},
  {transaction_date: "2023-01-03", posted_date: "2023-01-04", description: "Doordash", amount: "$50.00", instrument_id: "67890"},
  {transaction_date: "2023-01-05", posted_date: "2023-01-06", description: "Clipper", amount: "$75.50", instrument_id: "54321"},
  {transaction_date: "2023-01-07", posted_date: "2023-01-08", description: "Deposit", amount: "$25.75", instrument_id: "98765"},
  {transaction_date: "2023-01-14", posted_date: "2023-01-15", description: "Withdrawal", amount: "$89.99", instrument_id: "43219"},
  {transaction_date: "2023-01-16", posted_date: "2023-01-17", description: "Transfer In", amount: "$45.67", instrument_id:"87654"}
];

function App() {
  return <FilterableTransactionTable transactions={PRODUCTS} />;
}

export default App;
