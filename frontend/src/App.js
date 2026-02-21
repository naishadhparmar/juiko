import React, {useState, useEffect} from 'react';
import logo from './logo.svg';
import './App.css';
import FilterableTransactionTable from './pages/transaction';

function App() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await fetch('http://127.0.0.1:5000/transaction/');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setTransactions(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching transactions:', error);
        setError(error.message);
        setLoading(false);
        // Fallback to mock data on error
        setTransactions(PRODUCTS);
      }
    };

    fetchTransactions();
  }, []);

  if (loading) {
    return <div>Loading transactions...</div>;
  }

  if (error) {
    return <div>Error loading transactions: {error}. Showing mock data.</div>;
  }

  return <FilterableTransactionTable transactions={transactions} />;
}

export default App;