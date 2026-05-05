import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LoginPage: React.FC = () => {
  const [isSignIn, setIsSignIn] = useState(true);
  const navigate = useNavigate();

  return (
    <div className="h-screen overflow-y-hidden bg-gradient-to-br from-slate-800 via-blue-950 to-indigo-950 text-white relative bg-[url('/src/assets/Rectangle.png')] bg-cover bg-center">
      <div className="mx-9 py-28">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div className="space-y-10">
            <div className="space-y-6">
              <h1 className="text-5xl lg:text-7xl font-bold leading-tight">
                Minimize Waste,{' '}
                <span className="bg-gradient-to-r from-[#5C90ED] via-[#8869C6] to-[#DC4E4E] bg-clip-text text-transparent">
                  Maximize Value
                </span>
              </h1>

              <div className="space-y-4 text-xl text-gray-300 max-w-lg">
                <p>
                  Harness the power of advanced analytics and real-time intelligence to transform your
                  supply chain operations. Reduce waste, optimize inventory, and maximize
                  profitability with data-driven insights.
                </p>
              </div>
            </div>

            <button className="bg-gradient-to-r from-[#1281E7] to-[#28B7ED] hover:from-blue-600 hover:to-blue-700 text-white text-lg font-semibold py-2 px-8 rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-xl">
              Explore Intelligence Suite
            </button>
          </div>

          <div className="bg-[#142649] backdrop-blur-sm border border-white/10 rounded-xl p-8 space-y-6">
            <div className="flex justify-between mb-4">
              <button
                className={`w-1/2 py-2 font-semibold rounded-l-lg ${
                  isSignIn ? 'bg-blue-600' : 'bg-gray-700'
                }`}
                onClick={() => setIsSignIn(true)}
              >
                Sign In
              </button>
              <button
                className={`w-1/2 py-2 font-semibold rounded-r-lg ${
                  !isSignIn ? 'bg-blue-600' : 'bg-gray-700'
                }`}
                onClick={() => setIsSignIn(false)}
              >
                Sign Up
              </button>
            </div>

            {isSignIn && (
              <div className="space-y-4">
                <input
                  type="email"
                  placeholder="Email"
                  className="w-full p-3 bg-[#0F2A50] border border-gray-600 rounded-lg text-white"
                />
                <input
                  type="password"
                  placeholder="Password"
                  className="w-full p-3 bg-[#0F2A50] border border-gray-600 rounded-lg text-white"
                />
                <button
                  onClick={() => navigate('/Home')}
                  className="w-full bg-blue-600 hover:bg-blue-700 py-2 rounded-lg font-semibold"
                >
                  Sign In
                </button>
              </div>
            )}

            {!isSignIn && (
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Full Name"
                  className="w-full p-3 bg-[#0F2A50] border border-gray-600 rounded-lg text-white"
                />
                <input
                  type="email"
                  placeholder="Email"
                  className="w-full p-3 bg-[#0F2A50] border border-gray-600 rounded-lg text-white"
                />
                <input
                  type="password"
                  placeholder="Password"
                  className="w-full p-3 bg-[#0F2A50] border border-gray-600 rounded-lg text-white"
                />
                <button className="w-full bg-blue-600 hover:bg-blue-700 py-2 rounded-lg font-semibold">
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-800/50 to-transparent"></div>
    </div>
  );
};

export default LoginPage;
