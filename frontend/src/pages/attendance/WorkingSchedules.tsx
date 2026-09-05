import React, { useState } from 'react';
import {
  Clock,
  Calendar,
  Plus,
  Search,
  CheckCircle2,
  Edit2,
  Info,
  ChevronRight,
  List,
  LayoutGrid,
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';

export interface ScheduleDayPattern {
  day: string;
  start_time: string;
  end_time: string;
  break_duration: number; // in hours
  is_working: boolean;
}

export interface WorkingSchedule {
  id: number;
  name: string;
  calendar_type: string; // e.g., "Standard 40h/week", "Shift Alpha", "Flexible 35h"
  day_count: number;
  work_hours_per_week: number;
  is_active: boolean;
  assigned_count: number;
  days: ScheduleDayPattern[];
}

const SAMPLE_SCHEDULES: WorkingSchedule[] = [
  {
    id: 1,
    name: 'Standard Corporate (40h/week)',
    calendar_type: 'Standard 5-Day Mon-Fri',
    day_count: 5,
    work_hours_per_week: 40,
    is_active: true,
    assigned_count: 6,
    days: [
      { day: 'Monday', start_time: '09:00', end_time: '18:00', break_duration: 1, is_working: true },
      { day: 'Tuesday', start_time: '09:00', end_time: '18:00', break_duration: 1, is_working: true },
      { day: 'Wednesday', start_time: '09:00', end_time: '18:00', break_duration: 1, is_working: true },
      { day: 'Thursday', start_time: '09:00', end_time: '18:00', break_duration: 1, is_working: true },
      { day: 'Friday', start_time: '09:00', end_time: '18:00', break_duration: 1, is_working: true },
      { day: 'Saturday', start_time: '00:00', end_time: '00:00', break_duration: 0, is_working: false },
      { day: 'Sunday', start_time: '00:00', end_time: '00:00', break_duration: 0, is_working: false },
    ],
  },
  {
    id: 2,
    name: 'Executive Leadership (45h/week)',
    calendar_type: 'Extended Leadership Schedule',
    day_count: 5,
    work_hours_per_week: 45,
    is_active: true,
    assigned_count: 2,
    days: [
      { day: 'Monday', start_time: '08:30', end_time: '18:30', break_duration: 1, is_working: true },
      { day: 'Tuesday', start_time: '08:30', end_time: '18:30', break_duration: 1, is_working: true },
      { day: 'Wednesday', start_time: '08:30', end_time: '18:30', break_duration: 1, is_working: true },
      { day: 'Thursday', start_time: '08:30', end_time: '18:30', break_duration: 1, is_working: true },
      { day: 'Friday', start_time: '08:30', end_time: '18:30', break_duration: 1, is_working: true },
      { day: 'Saturday', start_time: '00:00', end_time: '00:00', break_duration: 0, is_working: false },
      { day: 'Sunday', start_time: '00:00', end_time: '00:00', break_duration: 0, is_working: false },
    ],
  },
  {
    id: 3,
    name: 'Part-Time Shift (20h/week)',
    calendar_type: 'Half-Day Flexible',
    day_count: 5,
    work_hours_per_week: 20,
    is_active: true,
    assigned_count: 1,
    days: [
      { day: 'Monday', start_time: '09:00', end_time: '13:00', break_duration: 0, is_working: true },
      { day: 'Tuesday', start_time: '09:00', end_time: '13:00', break_duration: 0, is_working: true },
      { day: 'Wednesday', start_time: '09:00', end_time: '13:00', break_duration: 0, is_working: true },
      { day: 'Thursday', start_time: '09:00', end_time: '13:00', break_duration: 0, is_working: true },
      { day: 'Friday', start_time: '09:00', end_time: '13:00', break_duration: 0, is_working: true },
      { day: 'Saturday', start_time: '00:00', end_time: '00:00', break_duration: 0, is_working: false },
      { day: 'Sunday', start_time: '00:00', end_time: '00:00', break_duration: 0, is_working: false },
    ],
  },
];

export const WorkingSchedules: React.FC = () => {
  const [schedules, setSchedules] = useState<WorkingSchedule[]>(SAMPLE_SCHEDULES);
  const [selectedSchedule, setSelectedSchedule] = useState<WorkingSchedule | null>(SAMPLE_SCHEDULES[0]);
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    calendar_type: 'Standard 5-Day',
    work_hours_per_week: 40,
  });

  const handleSelectSchedule = (s: WorkingSchedule) => {
    setSelectedSchedule(s);
    setViewMode('form');
  };

  const calculateHours = (start: string, end: string, breakHrs: number) => {
    if (!start || !end) return 0;
    const [h1, m1] = start.split(':').map(Number);
    const [h2, m2] = end.split(':').map(Number);
    const totalMins = (h2 * 60 + m2) - (h1 * 60 + m1);
    const netHours = Math.max(0, totalMins / 60 - breakHrs);
    return Math.round(netHours * 100) / 100;
  };

  const handleDayChange = (idx: number, field: keyof ScheduleDayPattern, val: any) => {
    if (!selectedSchedule) return;
    const updatedDays = [...selectedSchedule.days];
    updatedDays[idx] = { ...updatedDays[idx], [field]: val };

    // Derived total weekly hours
    const totalWeekly = updatedDays.reduce((acc, d) => {
      if (!d.is_working) return acc;
      return acc + calculateHours(d.start_time, d.end_time, d.break_duration);
    }, 0);

    const updated = {
      ...selectedSchedule,
      days: updatedDays,
      work_hours_per_week: totalWeekly,
    };
    setSelectedSchedule(updated);

    // Sync in master list
    setSchedules((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  };

  const handleCreateSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    const newS: WorkingSchedule = {
      id: Date.now(),
      name: formData.name,
      calendar_type: formData.calendar_type,
      day_count: 5,
      work_hours_per_week: formData.work_hours_per_week,
      is_active: true,
      assigned_count: 0,
      days: [
        { day: 'Monday', start_time: '09:00', end_time: '18:00', break_duration: 1, is_working: true },
        { day: 'Tuesday', start_time: '09:00', end_time: '18:00', break_duration: 1, is_working: true },
        { day: 'Wednesday', start_time: '09:00', end_time: '18:00', break_duration: 1, is_working: true },
        { day: 'Thursday', start_time: '09:00', end_time: '18:00', break_duration: 1, is_working: true },
        { day: 'Friday', start_time: '09:00', end_time: '18:00', break_duration: 1, is_working: true },
        { day: 'Saturday', start_time: '00:00', end_time: '00:00', break_duration: 0, is_working: false },
        { day: 'Sunday', start_time: '00:00', end_time: '00:00', break_duration: 0, is_working: false },
      ],
    };
    setSchedules((prev) => [newS, ...prev]);
    setSelectedSchedule(newS);
    setViewMode('form');
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-fade-scale">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Working Schedules</h1>
          <p className="text-xs font-medium text-slate-500 mt-0.5">
            Configure weekly work patterns, hours, and shift schedules for employees and contracts
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Mode switch */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'list' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="h-3.5 w-3.5" />
              <span>List View</span>
            </button>
            <button
              onClick={() => {
                if (selectedSchedule) setViewMode('form');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'form' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Form View</span>
            </button>
          </div>

          <Button
            variant="primary"
            size="sm"
            icon={<Plus className="h-4 w-4" />}
            onClick={() => setIsModalOpen(true)}
          >
            New Schedule
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      {viewMode === 'list' ? (
        /* LIST VIEW: Surfacing Name, Calendar Type, Day Count, Work Hours */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-soft overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="relative min-w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search working schedules..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:bg-white focus:border-primary-500 focus:outline-none"
              />
            </div>
            <span className="text-xs font-medium text-slate-500">
              Showing {schedules.length} active schedule definitions
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200/80">
                <tr>
                  <th className="py-3 px-4">Schedule Name</th>
                  <th className="py-3 px-4">Calendar Type</th>
                  <th className="py-3 px-4">Working Days</th>
                  <th className="py-3 px-4">Weekly Work Hours</th>
                  <th className="py-3 px-4">Assigned Employees</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {schedules
                  .filter((s) => s.name.toLowerCase().includes(search.toLowerCase()))
                  .map((s) => (
                    <tr
                      key={s.id}
                      onClick={() => handleSelectSchedule(s)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                    >
                      <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                        <Clock className="h-4 w-4 text-primary-600" />
                        <span>{s.name}</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-medium">{s.calendar_type}</td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-700">
                        {s.day_count} days / week
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-600">
                        {s.work_hours_per_week} hrs / week
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="bg-primary-50 text-primary-700 border border-primary-200 px-2 py-0.5 rounded font-mono font-bold text-[11px]">
                          {s.assigned_count} Assigned
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <ChevronRight className="h-4 w-4 text-slate-400 inline-block" />
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* FORM VIEW: Defines Weekly Pattern (Day, Start Time, End Time, Derived Hours) */
        selectedSchedule && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-soft space-y-6 animate-slide-right">
            {/* Header Banner for Selected Schedule */}
            <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-white tracking-tight">{selectedSchedule.name}</h2>
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold px-2 py-0.5 rounded-full">
                    Active Definition
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Type: <span className="text-slate-200 font-semibold">{selectedSchedule.calendar_type}</span> &bull; Assigned to {selectedSchedule.assigned_count} contracts
                </p>
              </div>

              <div className="bg-slate-800 px-4 py-2 rounded-xl border border-slate-700 text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Derived Weekly Pattern Total
                </span>
                <span className="text-2xl font-black font-mono text-emerald-400">
                  {selectedSchedule.work_hours_per_week} Hours
                </span>
              </div>
            </div>

            {/* Day Pattern Definition Form Table */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2 mb-4">
                Weekly Pattern Definition (Derived Hours Engine)
              </h3>

              <div className="space-y-3">
                {selectedSchedule.days.map((d, idx) => {
                  const derivedHrs = calculateHours(d.start_time, d.end_time, d.break_duration);
                  return (
                    <div
                      key={d.day}
                      className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                        d.is_working
                          ? 'bg-slate-50 border-slate-200'
                          : 'bg-slate-100/60 border-slate-200/60 opacity-60'
                      }`}
                    >
                      {/* Left: Day & Working Checkbox */}
                      <div className="flex items-center gap-3 min-w-[140px]">
                        <input
                          type="checkbox"
                          checked={d.is_working}
                          onChange={(e) => handleDayChange(idx, 'is_working', e.target.checked)}
                          className="h-4 w-4 rounded text-primary-600 focus:ring-primary-500 border-slate-300 cursor-pointer"
                        />
                        <span className="font-bold text-slate-900 text-sm">{d.day}</span>
                      </div>

                      {/* Middle: Start Time & End Time */}
                      {d.is_working ? (
                        <div className="flex items-center gap-4 flex-1 flex-wrap">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400 font-medium">Start:</span>
                            <input
                              type="time"
                              value={d.start_time}
                              onChange={(e) => handleDayChange(idx, 'start_time', e.target.value)}
                              className="bg-white border border-slate-300 rounded px-2 py-1 font-mono text-xs text-slate-900 font-bold"
                            />
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-slate-400 font-medium">End:</span>
                            <input
                              type="time"
                              value={d.end_time}
                              onChange={(e) => handleDayChange(idx, 'end_time', e.target.value)}
                              className="bg-white border border-slate-300 rounded px-2 py-1 font-mono text-xs text-slate-900 font-bold"
                            />
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-slate-400 font-medium">Break (h):</span>
                            <input
                              type="number"
                              step="0.5"
                              value={d.break_duration}
                              onChange={(e) => handleDayChange(idx, 'break_duration', Number(e.target.value))}
                              className="w-16 bg-white border border-slate-300 rounded px-2 py-1 font-mono text-xs text-slate-900 font-bold"
                            />
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs font-semibold text-slate-400 italic">Day Off / Non-working</span>
                      )}

                      {/* Right: Derived Net Hours */}
                      <div className="text-right font-mono min-w-[100px]">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Derived</span>
                        <span className="font-bold text-sm text-slate-900">
                          {d.is_working ? `${derivedHrs} hrs` : '0.0 hrs'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )
      )}

      {/* Footer Note */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/70 flex items-start gap-3 text-xs text-slate-600">
        <Info className="h-4 w-4 text-primary-600 shrink-0 mt-0.5" />
        <p className="italic">
          Useful note: Working Schedules surface weekly pattern rules. A schedule can be assigned to an Employee or Contract. Shift, Flexible-time and other rules are open to extension.
        </p>
      </div>

      {/* Modal to Create New Schedule */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Working Schedule"
        subtitle="Define a new weekly working pattern for employee assignment"
      >
        <form onSubmit={handleCreateSchedule} className="space-y-4">
          <Input
            label="Schedule Name"
            placeholder="e.g. Flexible 38h Shift"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <Select
            label="Calendar Type"
            value={formData.calendar_type}
            onChange={(e) => setFormData({ ...formData, calendar_type: e.target.value })}
            options={[
              { value: 'Standard 5-Day', label: 'Standard 5-Day Mon-Fri' },
              { value: 'Executive Leadership', label: 'Executive Leadership Schedule' },
              { value: 'Part-Time Shift', label: 'Part-Time Shift' },
              { value: 'Flexible Shift', label: 'Flexible-Time Rule' },
            ]}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Working Schedule
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
