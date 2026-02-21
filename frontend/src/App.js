import React, {useState, useEffect} from 'react';
import logo from './logo.svg';
import './App.css';
import FilterableTransactionTable from './pages/transaction';
import FilterableInstrumentTable from './pages/instrument';

function App() {
  const [currentPage, setCurrentPage] = useState('transactions');
  const [transactions, setTransactions] = useState([]);
  const [instruments, setInstruments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (currentPage === 'transactions') {
          const response = await fetch('http://127.0.0.1:5000/transaction/');
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data = await response.json();
          setTransactions(data);
        } else if (currentPage === 'instruments') {
          const response = await fetch('http://127.0.0.1:5000/instrument/');
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data = await response.json();
          setInstruments(data);
        }
        setError(null);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error.message);
        setLoading(false);
      }
    };

    fetchData();
  }, [currentPage]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <nav style={{ marginBottom: '20px' }}>
        <button 
          onClick={() => setCurrentPage('transactions')}
          style={{ marginRight: '10px', fontWeight: currentPage === 'transactions' ? 'bold' : 'normal' }}
        >
          Transactions
        </button>
        <button 
          onClick={() => setCurrentPage('instruments')}
          style={{ fontWeight: currentPage === 'instruments' ? 'bold' : 'normal' }}
        >
          Instruments
        </button>
      </nav>
      {currentPage === 'transactions' && <FilterableTransactionTable transactions={transactions} />}
      {currentPage === 'instruments' && <FilterableInstrumentTable instruments={instruments} />}
    </div>
  );
}

export default App;