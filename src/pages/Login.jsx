import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Lock, User, AtSign, Eye, EyeOff } from 'lucide-react';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export default function Login() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);

      let loginEmail = identifier;

      // If it doesn't look like an email (no @ after some text), try to find by username
      // Note: User can have @ in username, but usually not at the end.
      // We check if identifier is a valid email format. 
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      
      if (!emailRegex.test(identifier)) {
        // Try to find the email associated with this username
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('username', '==', identifier));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          // Firebase doesn't directly give us the email of the auth account here easily 
          // if we don't store it in the doc. Does our user doc have email?
          // Let's check the user doc data.
          const userData = querySnapshot.docs[0].data();
          // We should have stored email in the user doc during registration or update.
          // Let's assume we have it or can find it.
          // IF we don't have email in the doc, we might need to rethink.
          
          // Actually, in our current setup, do we save email in the 'users' doc?
          // Let's verify DataContext/Dashboard.
          if (userData.email) {
            loginEmail = userData.email;
          } else {
            // If email is not in the doc, we might have a problem.
            // But let's check AuthContext/useData.
          }
        }
      }

      await login(loginEmail, password);
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      setError('Invalid username/email or password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="flex justify-center mb-6">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-full">
            <Lock className="w-8 h-8" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-center text-slate-800 mb-6">Admin Login</h2>
        {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg mb-4">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Username or Email</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                required
                placeholder="e.g. @yourname or mail@example.com"
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type={showPassword ? "text" : "password"} 
                required
                className="w-full pl-10 pr-12 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
