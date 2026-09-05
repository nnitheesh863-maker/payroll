import React, { useState, useEffect } from 'react';
import {
  Bell,
  Search,
  Clock,
  UserCheck,
  X,
  Play,
  Square,
  Shield,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export const Header: React.FC = () => {
  const { user } = useAuth();
  const [isCheckedIn, setIsCheckedIn] = useState<boolean>(true);
  const [checkInTime, setCheckInTime] = useState<string>('09:15 AM');
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(19720); // ~5h 28m
  const [showWidgetModal, setShowWidgetModal] = useState(false);

  useEffect(() => {
    const updateClock = () => {
      if (isCheckedIn) {
        setElapsedSeconds((prev) => prev + 1);
      }
    };
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, [isCheckedIn]);

  const formatElapsed = (sec: number) => {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const secs = sec % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleToggleAttendance = () => {
    if (isCheckedIn) {
      setIsCheckedIn(false);
    } else {
      setIsCheckedIn(true);
      const now = new Date();
      setCheckInTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setElapsedSeconds(0);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      
      {/* Search Bar */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search employees, contracts, payruns..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#8C532B] focus:ring-2 focus:ring-[#8C532B]/10 transition-all font-medium"
          />
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        
        {/* Attendance Quick Action Widget Trigger Button */}
        <button
          onClick={() => setShowWidgetModal(true)}
          className="flex items-center gap-2.5 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200/80 transition-all cursor-pointer shadow-xs group"
        >
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              isCheckedIn ? 'bg-emerald-500 ring-4 ring-emerald-100 animate-pulse' : 'bg-rose-500'
            }`}
          />

          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-700">
            <Clock className="h-3.5 w-3.5 text-[#8C532B]" />
            <span>{isCheckedIn ? formatElapsed(elapsedSeconds) : 'Clocked Out'}</span>
          </div>

          <span className="text-[10px] font-bold text-slate-400 group-hover:text-slate-600">
            {isCheckedIn ? 'Checked In' : 'Click to Punch'}
          </span>
        </button>

        {/* User Role Badge */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#FAF7F2] border border-[#EADBCE] text-xs">
          <div className="h-5 w-5 rounded-md bg-[#8C532B] text-white flex items-center justify-center font-bold text-[10px]">
            {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-[#381E0D] text-[11px] leading-tight">
              {user?.full_name || 'User'}
            </span>
            <span className="text-[9px] font-bold text-[#8C532B] tracking-wider uppercase leading-none">
              {user?.role?.replace(/_/g, ' ') || 'EMPLOYEE'}
            </span>
          </div>
        </div>

        {/* Notification Bell */}
        <button className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors relative cursor-pointer">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[#8C532B] ring-2 ring-white" />
        </button>
      </div>

      {/* Attendance Modal */}
      {showWidgetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-[#121520] text-white rounded-3xl border border-slate-800 max-w-sm w-full p-6 shadow-2xl relative animate-in zoom-in-95 duration-150">
            
            {/* Top Bar with Indicator Dot & Close Button */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Attendance Punch
              </span>
              <div className="flex items-center gap-3">
                <span
                  className={`h-3 w-3 rounded-full ${
                    isCheckedIn ? 'bg-emerald-400 ring-4 ring-emerald-950 animate-pulse' : 'bg-rose-500'
                  }`}
                />
                <button
                  onClick={() => setShowWidgetModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Welcome User Header */}
            <div className="mt-4 text-center">
              <p className="text-xs text-slate-400 font-medium">Logged in as,</p>
              <h2 className="text-xl font-extrabold text-white tracking-tight mt-0.5">
                {user?.full_name || 'Administrator'}
              </h2>
            </div>

            {/* Time Tracking Counter Box */}
            <div className="mt-6 bg-[#181B26] p-5 rounded-2xl border border-slate-800 text-center space-y-2">
              <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
                <span>{checkInTime}</span>
                <span>&rarr;</span>
                <span className="text-[#EADBCE] font-bold">Now</span>
              </div>
              <p className="text-3xl font-black font-mono tracking-tight text-white">
                {isCheckedIn ? formatElapsed(elapsedSeconds) : '00:00:00'}
              </p>
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span>Today's Total:</span>
                <span className="font-mono font-bold text-emerald-400">
                  {isCheckedIn ? formatElapsed(elapsedSeconds).slice(0, 5) : '00:00'}
                </span>
              </div>
            </div>

            {/* Big Check In / Check Out Action Button */}
            <div className="mt-6">
              <button
                onClick={handleToggleAttendance}
                className={`w-full py-3.5 px-4 rounded-2xl font-black text-sm transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-xl active:scale-95 ${
                  isCheckedIn
                    ? 'bg-gradient-to-r from-[#8C532B] to-[#7B3F1B] hover:from-[#7B3F1B] hover:to-[#683416] text-white shadow-[#8C532B]/30'
                    : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/30'
                }`}
              >
                {isCheckedIn ? (
                  <>
                    <Square className="h-4 w-4 fill-white" />
                    <span>Check Out</span>
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 fill-white" />
                    <span>Check In</span>
                  </>
                )}
              </button>
            </div>

            {/* Widget Guidance Note */}
            <div className="mt-5 p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
              <strong className="text-slate-300">Quick Action Note:</strong> Punching in logs your attendance and syncs with automated payroll calculations.
            </div>

          </div>
        </div>
      )}

    </header>
  );
};
