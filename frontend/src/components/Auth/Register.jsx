import React, { useState } from 'react';
import { useAuth } from '../../store/AuthContext';
import { Button } from '../UI/Button';
import { motion } from 'motion/react';
import { Eye, EyeOff } from 'lucide-react';

export const Register = ({ onToggle }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(email, password, name);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md mx-auto bg-[#141414] border border-white/10 rounded-3xl p-8"
    >
      <h2 className="text-2xl font-bold mb-6 text-center">Create Account</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-white/60 mb-1">Name</label>
          <input 
            type="text" 
            className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-white/60 mb-1">Email</label>
          <input 
            type="email" 
            className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="relative">
          <label className="block text-sm font-medium text-white/60 mb-1">Password</label>
          <input 
            type={showPassword ? 'text' : 'password'} 
            className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-2 flex items-center px-2 text-sm font-medium text-white/80 hover:text-orange-500"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <Button type="submit" className="w-full" isLoading={loading}>Register</Button>
      </form>
      <p className="mt-6 text-center text-sm text-white/40">
        Already have an account? <button onClick={onToggle} className="text-orange-500 hover:underline">Login</button>
      </p>
    </motion.div>
  );
};
