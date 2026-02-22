import React, {useState, useEffect} from 'react';
import logo from './logo.svg';
import './App.css';
import FilterableTransactionTable from './pages/transaction';
import FilterableInstrumentTable from './pages/instrument';

function App() {
  const [currentPage, setCurrentPage] = useState('transactions');
  const [transactions, setTransactions] = useState([]);
  const [transactionLookup, setTransactionLookup] = useState({});
  const [instruments, setInstruments] = useState([]);
  const [instrumentLookup, setInstrumentLookup] = useState({});
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
          setTransactions(data.transactions);
          setTransactionLookup(data.lookup || {});
        } else if (currentPage === 'instruments') {
          const response = await fetch('http://127.0.0.1:5000/instrument/');
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data = await response.json();
          setInstruments(data.instruments);
          setInstrumentLookup(data.lookup || {});
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

  const getPageTitle = () => {
    switch(currentPage) {
      case 'home':
        return 'Financial Overview';
      case 'transactions':
        return 'Transactions';
      case 'instruments':
        return 'Instruments';
      default:
        return 'Juiko';
    }
  };

  return (
    <div className="App">
      <div className="sidebar">
        <div className="sidebar-header">
          <h1 className="sidebar-title">Juiko</h1>
        </div>
        <nav className="sidebar-nav">
          <button 
            className={`sidebar-button ${currentPage === 'home' ? 'active' : ''}`}
            onClick={() => setCurrentPage('home')}
          >
            📊 Home
          </button>
          <button 
            className={`sidebar-button ${currentPage === 'transactions' ? 'active' : ''}`}
            onClick={() => setCurrentPage('transactions')}
          >
            💳 Transactions
          </button>
          <button 
            className={`sidebar-button ${currentPage === 'instruments' ? 'active' : ''}`}
            onClick={() => setCurrentPage('instruments')}
          >
            🏦 Instruments
          </button>
        </nav>
      </div>

      <div className="main-content">
        <div className="content-header">
          <h2 className="content-title">{getPageTitle()}</h2>
        </div>

        {loading && (
          <div className="loading-container">
            <div className="loading-spinner"></div>
          </div>
        )}
        {error && (
          <div className="error-container">
            <div className="error-text">Error Loading Data</div>
            <div className="error-details">{error}</div>
          </div>
        )}
        {!loading && !error && currentPage === 'home' && (
          <div className="table-container" style={{ padding: '32px', textAlign: 'center' }}>
            <p style={{ color: '#64748b', fontSize: '16px' }}>Home page coming soon. Track your financial situation at a glance.</p>
          </div>
        )}
        {!loading && !error && currentPage === 'transactions' && <FilterableTransactionTable transactions={transactions} lookup={transactionLookup} />}
        {!loading && !error && currentPage === 'instruments' && <FilterableInstrumentTable instruments={instruments} lookup={instrumentLookup} />}
      </div>
    </div>
  );
}

export default App;