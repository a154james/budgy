"use client";

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { 
  Wallet, TrendingUp, TrendingDown, Trash2, 
  PlusCircle, Activity, LayoutDashboard 
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

type Transaction = {
  id: number;
  date: string;
  type: string;
  amount: number;
  category: string;
  description: string;
  isRecurring: boolean;
};

type Summary = {
  total_income: number;
  total_expense: number;
  balance: number;
};

const COLORS = ['#8b5cf6', '#0ea5e9', '#10b981', '#ef4444', '#f59e0b', '#ec4899'];

export default function Home() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<Summary>({ total_income: 0, total_expense: 0, balance: 0 });
  const [loading, setLoading] = useState(true);

  // Form State
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [txRes, sumRes] = await Promise.all([
        fetch('/api/transactions'),
        fetch('/api/summary')
      ]);
      const txData = await txRes.json();
      const sumData = await sumRes.json();
      setTransactions(txData);
      setSummary(sumData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !category) return;

    try {
      await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, amount, category, description, date }),
      });
      
      // Reset form
      setAmount('');
      setCategory('');
      setDescription('');
      setDate(format(new Date(), 'yyyy-MM-dd'));
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const deleteTx = async (id: number) => {
    if (confirm('Delete this transaction?')) {
      await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
      fetchData();
    }
  };

  // Prepare chart data for expenses
  const expensesByCategory = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc: any, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {});
    
  const chartData = Object.keys(expensesByCategory).map(key => ({
    name: key,
    value: expensesByCategory[key]
  }));

  if (loading) return <div className="container" style={{ textAlign: 'center', marginTop: '5rem' }}>Loading application...</div>;

  return (
    <div className="container">
      <header className="header-section">
        <div className="logo">
          <Activity size={28} />
          <span>Budgy</span>
        </div>
        <button className="btn" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
          <LayoutDashboard size={18} /> Dashboard
        </button>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-3">
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
            <Wallet size={20} />
            <h4>Current Balance</h4>
          </div>
          <div className="stat-value">${summary.balance.toFixed(2)}</div>
        </div>
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
            <TrendingUp size={20} color="var(--success)" />
            <h4>Total Income</h4>
          </div>
          <div className="stat-value success">${summary.total_income.toFixed(2)}</div>
        </div>
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
            <TrendingDown size={20} color="var(--danger)" />
            <h4>Total Expenses</h4>
          </div>
          <div className="stat-value danger">${summary.total_expense.toFixed(2)}</div>
        </div>
      </div>

      <div className="grid grid-cols-2" style={{ marginTop: '2rem' }}>
        {/* Left Column: Form & Chart */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="glass-card">
            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <PlusCircle size={20} /> Add Transaction
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <label>Type</label>
                <select className="input-field" value={type} onChange={e => setType(e.target.value)}>
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </div>
              <div className="input-group">
                <label>Date</label>
                <input type="date" className="input-field" required value={date} onChange={e => setDate(e.target.value)} />
              </div>
              <div className="input-group">
                <label>Amount</label>
                <input type="number" step="0.01" className="input-field" required value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" />
              </div>
              <div className="input-group">
                <label>Category</label>
                <input type="text" className="input-field" required value={category} onChange={e => setCategory(e.target.value)} placeholder="e.g. Groceries" />
              </div>
              <div className="input-group">
                <label>Description</label>
                <input type="text" className="input-field" value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional note" />
              </div>
              <button type="submit" className="btn" style={{ width: '100%', marginTop: '1rem' }}>
                Save Transaction
              </button>
            </form>
          </div>

          {chartData.length > 0 && (
            <div className="glass-card">
              <h3 style={{ marginBottom: '1rem' }}>Expense Breakdown</h3>
              <div style={{ height: '250px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'var(--bg-color)', border: '1px solid var(--card-border)', borderRadius: '8px' }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Transactions */}
        <div className="glass-card">
          <h3 style={{ marginBottom: '1.5rem' }}>Recent Transactions</h3>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Details</th>
                  <th>Amount</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                      No transactions yet.
                    </td>
                  </tr>
                ) : (
                  transactions.map(tx => (
                    <tr key={tx.id}>
                      <td>{format(new Date(tx.date), 'MMM dd, yyyy')}</td>
                      <td>
                        <span className={`badge ${tx.type}`}>
                          {tx.type}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{tx.category}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{tx.description}</div>
                      </td>
                      <td style={{ color: tx.type === 'income' ? 'var(--success)' : 'var(--danger)', fontWeight: 'bold' }}>
                        ${tx.amount.toFixed(2)}
                      </td>
                      <td>
                        <button className="btn btn-danger" onClick={() => deleteTx(tx.id)} title="Delete">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
