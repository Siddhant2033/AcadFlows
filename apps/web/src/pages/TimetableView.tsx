import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import api from '../lib/api';

interface TimetableEntry {
  _id: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  subjectId: {
    _id: string;
    name: string;
    code: string;
  };
  teacherId: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  sectionId: {
    _id: string;
    name: string;
  };
  gradeId: {
    _id: string;
    name: string;
  };
  roomNumber?: string;
  isBreak: boolean;
  breakType?: string;
  notes?: string;
}

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function TimetableViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [timetable, setTimetable] = useState<any>(null);
  const [entries, setEntries] = useState<Record<string, TimetableEntry[]>>({});
  const [loading, setLoading] = useState(true);
  const [viewType, setViewType] = useState<'week' | 'day'>('week');
  const [selectedDay, setSelectedDay] = useState<string>('monday');
  const [timeSlots, setTimeSlots] = useState<any[]>([]);

  useEffect(() => {
    fetchTimetable();
    fetchTimeSlots();
  }, [id]);

  const fetchTimetable = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/timetable/${id}`);
      setTimetable(response.data.data);
      
      // Group entries by day
      const grouped: Record<string, TimetableEntry[]> = {};
      DAYS.forEach(day => {
        grouped[day] = response.data.data.entries?.filter(
          (e: TimetableEntry) => e.dayOfWeek === day
        ) || [];
      });
      setEntries(grouped);
    } catch (error) {
      console.error('Failed to fetch timetable:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTimeSlots = async () => {
    try {
      const response = await api.get('/timetable/time-slots');
      setTimeSlots(response.data.data);
    } catch (error) {
      console.error('Failed to fetch time slots:', error);
    }
  };

  const getDayEntries = (day: string) => {
    return entries[day] || [];
  };

  const getBreakLabel = (type?: string) => {
    const labels: Record<string, string> = {
      short: '☕ Short Break',
      lunch: '🍱 Lunch',
      recess: '🎮 Recess',
    };
    return labels[type || ''] || 'Break';
  };

  const getDayLabel = (day: string) => {
    const labels: Record<string, string> = {
      monday: 'Monday',
      tuesday: 'Tuesday',
      wednesday: 'Wednesday',
      thursday: 'Thursday',
      friday: 'Friday',
      saturday: 'Saturday',
      sunday: 'Sunday',
    };
    return labels[day] || day;
  };

  const renderWeekView = () => {
    return (
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          <div className="grid grid-cols-8 gap-1">
            {/* Header */}
            <div className={`p-3 font-semibold text-center transition-colors duration-200 ${
              theme ? 'bg-gray-50 text-gray-700' : 'dark:bg-[#0F172A] dark:text-[#94A3B8]'
            }`}>
              Time
            </div>
            {DAYS.map((day) => (
              <div key={day} className={`p-3 font-semibold text-center transition-colors duration-200 ${
                theme ? 'bg-gray-50 text-gray-700' : 'dark:bg-[#0F172A] dark:text-[#94A3B8]'
              }`}>
                {getDayLabel(day)}
              </div>
            ))}

            {/* Time slots */}
            {timeSlots.map((slot, index) => (
              <React.Fragment key={index}>
                <div className={`p-2 text-sm text-center border-r transition-colors duration-200 ${
                  theme ? 'border-gray-200 text-gray-500' : 'dark:border-[#334155] dark:text-[#94A3B8]'
                }`}>
                  {slot.startTime} - {slot.endTime}
                </div>
                {DAYS.map((day) => {
                  const dayEntries = getDayEntries(day);
                  const entry = dayEntries.find(e => 
                    e.startTime === slot.startTime || 
                    (e.startTime <= slot.startTime && e.endTime > slot.startTime)
                  );

                  return (
                    <div key={`${day}-${index}`} className={`p-2 min-h-[60px] border-r border-b transition-colors duration-200 ${
                      theme ? 'border-gray-200' : 'dark:border-[#334155]'
                    }`}>
                      {entry ? (
                        <div className={`p-2 rounded-lg text-xs ${
                          entry.isBreak
                            ? theme ? 'bg-gray-100 text-gray-600' : 'dark:bg-[#0F172A] dark:text-[#94A3B8]'
                            : 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300'
                        }`}>
                          {entry.isBreak ? (
                            <div className="text-center font-medium">
                              {getBreakLabel(entry.breakType)}
                            </div>
                          ) : (
                            <div>
                              <div className="font-medium">{entry.subjectId?.name}</div>
                              <div className="text-xs opacity-75">
                                {entry.teacherId?.firstName} {entry.teacherId?.lastName}
                              </div>
                              {entry.roomNumber && (
                                <div className="text-xs opacity-75">Room: {entry.roomNumber}</div>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="h-full min-h-[40px]" />
                      )}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const dayEntries = getDayEntries(selectedDay);

    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg font-semibold transition-colors duration-200 ${
            theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
          }`}>
            {getDayLabel(selectedDay)}
          </h3>
          <div className="flex gap-2">
            {DAYS.map((day) => (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                  selectedDay === day
                    ? 'bg-primary-600 text-white'
                    : theme
                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    : 'dark:bg-[#334155] dark:text-[#94A3B8] dark:hover:bg-[#475569]'
                }`}
              >
                {getDayLabel(day).slice(0, 3)}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          {dayEntries.length === 0 ? (
            <div className={`p-8 text-center rounded-lg transition-colors duration-200 ${
              theme ? 'bg-gray-50' : 'dark:bg-[#0F172A]'
            }`}>
              <p className={`text-sm transition-colors duration-200 ${
                theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
              }`}>
                No classes scheduled for this day
              </p>
            </div>
          ) : (
            dayEntries.sort((a, b) => a.startTime.localeCompare(b.startTime)).map((entry) => (
              <div
                key={entry._id}
                className={`p-4 rounded-lg flex items-center justify-between transition-colors duration-200 ${
                  entry.isBreak
                    ? theme ? 'bg-gray-50' : 'dark:bg-[#0F172A]'
                    : theme ? 'bg-primary-50' : 'dark:bg-primary-900/10'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`text-sm font-medium min-w-[80px] transition-colors duration-200 ${
                    theme ? 'text-gray-700' : 'dark:text-[#94A3B8]'
                  }`}>
                    {entry.startTime} - {entry.endTime}
                  </div>
                  {entry.isBreak ? (
                    <div className={`font-medium transition-colors duration-200 ${
                      theme ? 'text-gray-600' : 'dark:text-[#94A3B8]'
                    }`}>
                      {getBreakLabel(entry.breakType)}
                    </div>
                  ) : (
                    <div>
                      <div className={`font-medium transition-colors duration-200 ${
                        theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
                      }`}>
                        {entry.subjectId?.name}
                      </div>
                      <div className={`text-sm transition-colors duration-200 ${
                        theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                      }`}>
                        {entry.teacherId?.firstName} {entry.teacherId?.lastName}
                      </div>
                    </div>
                  )}
                </div>
                <div className="text-sm">
                  {entry.roomNumber && (
                    <span className={`transition-colors duration-200 ${
                      theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                    }`}>
                      Room {entry.roomNumber}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!timetable) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-[#94A3B8]">Timetable not found</p>
        <button
          onClick={() => navigate('/timetable')}
          className="mt-4 text-primary-600 hover:text-primary-700"
        >
          Back to Timetables
        </button>
      </div>
    );
  }

  return (
    <div className={`rounded-lg shadow p-6 transition-colors duration-200 ${
      theme ? 'bg-white' : 'dark:bg-[#1E293B]'
    }`}>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 className={`text-2xl font-bold transition-colors duration-200 ${
            theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
          }`}>
            {timetable.name}
          </h2>
          {timetable.description && (
            <p className={`text-sm transition-colors duration-200 ${
              theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
            }`}>
              {timetable.description}
            </p>
          )}
          <div className="flex gap-4 mt-2 text-sm">
            <span className={`transition-colors duration-200 ${
              theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
            }`}>
              Type: {timetable.type.toUpperCase()}
            </span>
            <span className={`transition-colors duration-200 ${
              theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
            }`}>
              {new Date(timetable.startDate).toLocaleDateString()} - {new Date(timetable.endDate).toLocaleDateString()}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setViewType('week')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              viewType === 'week'
                ? 'bg-primary-600 text-white'
                : theme
                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                : 'dark:bg-[#334155] dark:text-[#94A3B8] dark:hover:bg-[#475569]'
            }`}
          >
            Week View
          </button>
          <button
            onClick={() => setViewType('day')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              viewType === 'day'
                ? 'bg-primary-600 text-white'
                : theme
                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                : 'dark:bg-[#334155] dark:text-[#94A3B8] dark:hover:bg-[#475569]'
            }`}
          >
            Day View
          </button>
          <button
            onClick={() => navigate('/timetable')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              theme ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'dark:bg-[#334155] dark:text-[#F1F5F9] dark:hover:bg-[#475569]'
            }`}
          >
            Back
          </button>
        </div>
      </div>

      {/* Timetable Content */}
      {viewType === 'week' ? renderWeekView() : renderDayView()}
    </div>
  );
}