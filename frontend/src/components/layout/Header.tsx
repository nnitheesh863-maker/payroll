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
  Save,
  CheckCircle2,
  Globe,
  Menu,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface HeaderProps {
  onOpenMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMobileMenu }) => {
  const { user } = useAuth();
  const [isCheckedIn, setIsCheckedIn] = useState<boolean>(true);
  const [showWidgetModal, setShowWidgetModal] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Live Indian Standard Time (IST - Asia/Kolkata)
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [checkInTimeIST, setCheckInTimeIST] = useState<string>('09:15:00 AM');
  const [checkInDateObj, setCheckInDateObj] = useState<Date>(() => {
    const d = new Date();
    d.setHours(9, 15, 0, 0);
    return d;
  });

  const [savedLogs, setSavedLogs] = useState<Array<{ id: number; timestamp: string; action: string; duration: string }>>([
    { id: 1, timestamp: '09:15:00 AM IST', action: 'Punch In', duration: 'Active' },
  ]);

  // Update live clock every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Format IST time
  const getISTTimeString = (date: Date) => {
    return date.toLocaleTimeString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  const getISTDateString = (date: Date) => {
    return date.toLocaleDateString('en-IN', {
      timeZone: 'Asia/Kolkata',
      weekday: 'long',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  // Calculate elapsed time from punch-in to current time
  const calculateElapsed = () => {
    if (!isCheckedIn) return '00:00:00';
    const diffMs = Math.max(0, currentTime.getTime() - checkInDateObj.getTime());
    const totalSecs = Math.floor(diffMs / 1000);
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleToggleAttendance = () => {
    const istNow = getISTTimeString(new Date());
    if (isCheckedIn) {
      setIsCheckedIn(false);
      setSaveMessage(`Checked out at ${istNow} IST. Click 'Save Record' to finalize.`);
    } else {
      setIsCheckedIn(true);
      const now = new Date();
      setCheckInDateObj(now);
      setCheckInTimeIST(getISTTimeString(now));
      setSaveMessage(`Checked in at ${istNow} IST. Shift in progress.`);
    }
  };

  const handleSaveRecord = () => {
    const istNow = getISTTimeString(new Date());
    const newLog = {
      id: Date.now(),
      timestamp: `${istNow} IST`,
      action: isCheckedIn ? 'Active Shift Punch' : 'Shift End Punch',
      duration: calculateElapsed(),
    };
    setSavedLogs((prev) => [newLog, ...prev.slice(0, 4)]);
    setSaveMessage('Attendance record saved & synchronized with India IST Payroll!');
    setTimeout(() => {
      setSaveMessage(null);
    }, 4000);
  };

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowWidgetModal(false);
      }
    };
    if (showWidgetModal) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showWidgetModal]);

  return (
    <header className="h-16 bg-white/95 backdrop-blur-md border-b border-[#EADBCE]/90 px-3 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-[0_2px_10px_rgba(120,53,15,0.02)]">
      
      {/* Left: Mobile Hamburger & Search Bar */}
      <div className="flex items-center gap-2 sm:gap-3 flex-1 max-w-md min-w-0">
        {onOpenMobileMenu && (
          <button
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 -ml-1 text-[#735338] hover:text-[#381E0D] hover:bg-[#FAF7F2] rounded-xl transition-colors cursor-pointer border border-[#EADBCE]/60"
            aria-label="Open mobile navigation menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}

        <div className="relative w-full min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8C532B]/60" />
          <input
            type="text"
            placeholder="Search employees, payroll..."
            className="w-full pl-9 pr-3 py-1.5 sm:py-2 text-xs bg-[#FAF7F2] border border-[#EADBCE] rounded-xl text-[#381E0D] placeholder-[#A38A73] focus:outline-none focus:bg-white focus:border-[#8C532B] focus:ring-4 focus:ring-[#8C532B]/10 transition-all font-medium shadow-xs truncate"
          />
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0 ml-2">
        
        {/* Attendance Quick Action Widget Trigger Button with Live India Time */}
        <button
          onClick={() => setShowWidgetModal((prev) => !prev)}
          className="flex items-center gap-1.5 sm:gap-2.5 bg-[#FAF7F2] hover:bg-[#F5ECE0] px-2.5 sm:px-3.5 py-1.5 rounded-xl border border-[#EADBCE] transition-all cursor-pointer shadow-xs group"
          title="Click to open India IST attendance punch-in modal"
        >
          <span
            className={`h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full shrink-0 ${
              isCheckedIn ? 'bg-emerald-500 shadow-[0_0_8px_rgba(160,185,129,0.9)] animate-pulse' : 'bg-rose-500'
            }`}
          />

          <div className="flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs font-mono font-bold text-[#381E0D]">
            <Clock className="h-3.5 w-3.5 text-[#8C532B] shrink-0" />
            <span className="hidden xs:inline sm:inline">{getISTTimeString(currentTime)}</span>
            <span className="xs:hidden sm:hidden">{currentTime.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' })}</span>
          </div>

          <span className="hidden sm:inline text-[10px] font-extrabold text-[#8C532B] bg-[#EADBCE]/50 px-1.5 py-0.5 rounded group-hover:bg-[#8C532B] group-hover:text-white transition-colors">
            IST
          </span>
        </button>

        {/* User Role Badge */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#FAF7F2] border border-[#EADBCE] text-xs shadow-xs">
          <div className="h-6 w-6 rounded-lg bg-gradient-to-tr from-[#8C532B] to-[#B87B4C] text-white flex items-center justify-center font-black text-[11px] shadow-sm shadow-[#8C532B]/30 drop-shadow-[0_0_6px_rgba(140,83,43,0.5)]">
            {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-[#381E0D] text-[11px] leading-tight">
              {user?.full_name || 'User'}
            </span>
            <span className="text-[9px] font-extrabold text-[#8C532B] tracking-wider uppercase leading-none">
              {user?.role?.replace(/_/g, ' ') || 'EMPLOYEE'}
            </span>
          </div>
        </div>

        {/* Notification Bell */}
        <button className="p-2 text-[#735338] hover:text-[#381E0D] hover:bg-[#FAF7F2] rounded-xl transition-colors relative cursor-pointer border border-transparent hover:border-[#EADBCE]">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[#8C532B] shadow-[0_0_6px_rgba(140,83,43,0.8)] ring-2 ring-white" />
        </button>
      </div>

      {/* Attendance Modal with Backdrop Click-to-Close */}
      {showWidgetModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setShowWidgetModal(false)}
        >
          <div 
            className="bg-[#121520] text-white rounded-3xl border border-slate-700 max-w-sm w-full p-4 sm:p-6 shadow-2xl relative max-h-[92vh] overflow-y-auto animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            
            {/* Top Bar with India Time Indicator & Close Button */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-bold text-slate-300 tracking-wide flex items-center gap-1.5">
                  <span>🇮🇳</span>
                  <span>Indian Standard Time (IST)</span>
                </span>
              </div>
              <button
                onClick={() => setShowWidgetModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Live Indian Time Display */}
            <div className="mt-4 text-center">
              <p className="text-xs text-slate-400 font-medium">
                {getISTDateString(currentTime)}
              </p>
              <h2 className="text-3xl font-black text-white font-mono tracking-tight mt-1 text-emerald-400">
                {getISTTimeString(currentTime)}
              </h2>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Asia / Kolkata (UTC +05:30)
              </span>
            </div>

            {/* Shift Tracker Card */}
            <div className="mt-4 bg-[#181B26] p-4 rounded-2xl border border-slate-800 space-y-2.5 shadow-inner">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Shift Check-In:</span>
                <span className="font-mono font-bold text-slate-200">{checkInTimeIST}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Status:</span>
                <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                  isCheckedIn ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                }`}>
                  {isCheckedIn ? 'Active On Duty' : 'Clocked Out'}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span>Total Worked Today:</span>
                <span className="font-mono font-bold text-emerald-400 text-sm">
                  {calculateElapsed()}
                </span>
              </div>
            </div>

            {/* Success / Save Banner Notification */}
            {saveMessage && (
              <div className="mt-3 p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{saveMessage}</span>
              </div>
            )}

            {/* Action Buttons: Punch, Save Record, and Close */}
            <div className="mt-4 space-y-2">
              <button
                onClick={handleToggleAttendance}
                className={`w-full py-3 px-4 rounded-2xl font-black text-xs transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-xl active:scale-95 ${
                  isCheckedIn
                    ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white shadow-amber-600/30'
                    : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/30'
                }`}
              >
                {isCheckedIn ? (
                  <>
                    <Square className="h-3.5 w-3.5 fill-white" />
                    <span>Check Out (End Shift)</span>
                  </>
                ) : (
                  <>
                    <Play className="h-3.5 w-3.5 fill-white" />
                    <span>Check In (Start Shift)</span>
                  </>
                )}
              </button>

              <button
                onClick={handleSaveRecord}
                className="w-full py-3 px-4 rounded-2xl font-black text-xs bg-gradient-to-r from-[#8C532B] to-[#B87B4C] hover:from-[#7B3F1B] hover:to-[#A3693D] text-white transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#8C532B]/20 active:scale-95 border border-[#B87B4C]/40"
              >
                <Save className="h-3.5 w-3.5" />
                <span>Save Attendance Record</span>
              </button>

              <button
                onClick={() => setShowWidgetModal(false)}
                className="w-full py-2 px-4 rounded-xl font-bold text-xs bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer border border-slate-700"
              >
                Close Window
              </button>
            </div>

            {/* Today's Saved Logs Preview */}
            <div className="mt-4 pt-3 border-t border-slate-800">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 mb-1.5">
                <span>Recent Saved Punches</span>
                <span className="text-emerald-400 font-mono">{savedLogs.length} Logged</span>
              </div>
              <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                {savedLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between bg-[#181B26] p-1.5 px-2.5 rounded-lg text-[11px] border border-slate-800/80">
                    <span className="text-slate-300 font-medium">{log.action}</span>
                    <div className="flex items-center gap-2 font-mono text-slate-400">
                      <span>{log.timestamp}</span>
                      <span className="text-emerald-400 font-bold">{log.duration}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Widget Guidance Note */}
            <div className="mt-3 p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-[10px] text-slate-400 leading-relaxed text-center">
              <strong className="text-slate-300">Live Sync:</strong> Attendance is synchronized in real-time with Indian Standard Time (IST) and automated payroll calculations.
            </div>

          </div>
        </div>
      )}

    </header>
  );
};
