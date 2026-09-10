import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { Card, Button, Badge } from '../components/ui';
import { DashboardLayout, PageHeader } from '../components/layout';
import { formatDate } from '../lib/format';
import { cn } from '../lib/cn';

interface TimetableEntry {
  _id: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  subjectId?: { _id: string; name: string; code: string };
  teacherId?: { _id: string; firstName: string; lastName: string };
  sectionId?: { _id: string; name: string };
  gradeId?: { _id: string; name: string };
  roomNumber?: string;
  isBreak: boolean;
  breakType?: string;
}

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS: Record<string, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
};

export default function TimetableViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [timetable, setTimetable] = useState<any>(null);
  const [entries, setEntries] = useState<Record<string, TimetableEntry[]>>({});
  const [loading, setLoading] = useState(true);
  const [viewType, setViewType] = useState<'week' | 'day'>('week');
  const [selectedDay, setSelectedDay] = useState('monday');

  useEffect(() => {
    fetchTimetable();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchTimetable = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/timetable/${id}`);
      const data = response.data.data;
      setTimetable(data);

      const grouped: Record<string, TimetableEntry[]> = {};
      DAYS.forEach(day => {
        grouped[day] = (data.entries || []).filter(
          (e: TimetableEntry) => e.dayOfWeek === day,
        );
      });
      setEntries(grouped);
    } catch (error) {
      console.error('Failed to fetch timetable:', error);
    } finally {
      setLoading(false);
    }
  };

  const getBreakLabel = (type?: string) => {
    const labels: Record<string, string> = {
      short: '☕ Short Break',
      lunch: '🍱 Lunch',
      recess: '🎮 Recess',
    };
    return labels[type || ''] || 'Break';
  };

  const renderWeekView = () => (
    <div className="overflow-x-auto">
      <div className="min-w-[900px]">
        <div className="grid grid-cols-8 gap-2">
          <div className="bg-elevated rounded-lg p-3 font-semibold text-xs uppercase tracking-wider text-muted text-center">
            Day
          </div>
          {DAYS.slice(0, 6).map(day => (
            <div
              key={day}
              className="bg-elevated rounded-lg p-3 font-semibold text-xs uppercase tracking-wider text-foreground text-center"
            >
              {DAY_LABELS[day]}
            </div>
          ))}
        </div>

        {/* Entries organized by time slot */}
        <div className="mt-2 space-y-2">
          {(() => {
            // Collect all unique time slots from all days
            const allSlots = new Set<string>();
            DAYS.forEach(day => {
              (entries[day] || []).forEach(e => {
                allSlots.add(`${e.startTime}–${e.endTime}`);
              });
            });
            const sortedSlots = Array.from(allSlots).sort();

            if (sortedSlots.length === 0) {
              return (
                <div className="text-center py-12 text-muted text-sm">
                  No entries in this timetable yet
                </div>
              );
            }

            return sortedSlots.map(slot => {
              const [start, end] = slot.split('–');
              return (
                <div key={slot} className="grid grid-cols-8 gap-2">
                  <div className="bg-surface border border-border rounded-lg p-3 text-center">
                    <p className="text-xs font-mono text-foreground">
                      {start}
                    </p>
                    <p className="text-[10px] text-muted">{end}</p>
                  </div>
                  {DAYS.slice(0, 6).map(day => {
                    const entry = (entries[day] || []).find(
                      e => e.startTime === start && e.endTime === end,
                    );
                    return (
                      <div
                        key={`${day}-${slot}`}
                        className="min-h-[70px] bg-surface border border-border rounded-lg p-2"
                      >
                        {entry ? (
                          entry.isBreak ? (
                            <div className="flex flex-col items-center justify-center h-full text-muted">
                              <span className="text-lg">☕</span>
                              <span className="text-[10px] mt-1">
                                {getBreakLabel(entry.breakType)}
                              </span>
                            </div>
                          ) : (
                            <div className="flex flex-col h-full">
                              <p className="text-xs font-semibold text-foreground truncate">
                                {entry.subjectId?.name || 'Subject'}
                              </p>
                              <p className="text-[10px] text-muted truncate mt-0.5">
                                {entry.teacherId
                                  ? `${entry.teacherId.firstName} ${entry.teacherId.lastName}`
                                  : ''}
                              </p>
                              {entry.roomNumber && (
                                <p className="text-[10px] text-muted mt-auto">
                                  Room {entry.roomNumber}
                                </p>
                              )}
                            </div>
                          )
                        ) : (
                          <div className="h-full" />
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            });
          })()}
        </div>
      </div>
    </div>
  );

  const renderDayView = () => {
    const dayEntries = (entries[selectedDay] || []).sort((a, b) =>
      a.startTime.localeCompare(b.startTime),
    );

    return (
      <div>
        <div className="flex flex-wrap gap-2 mb-6">
          {DAYS.slice(0, 6).map(day => (
            <button
              key={day}
              type="button"
              onClick={() => setSelectedDay(day)}
              className={cn(
                'px-4 py-2 text-sm rounded-lg font-medium transition-all duration-200',
                selectedDay === day
                  ? 'bg-primary-500 text-white shadow-sm'
                  : 'bg-elevated text-muted hover:bg-surface-tint hover:text-foreground',
              )}
            >
              {DAY_LABELS[day]}
            </button>
          ))}
        </div>

        {dayEntries.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-5xl mb-3">📅</p>
            <p className="text-sm text-muted">No classes scheduled for this day</p>
          </div>
        ) : (
          <div className="space-y-3">
            {dayEntries.map(entry => (
              <Card
                key={entry._id}
                className={cn(
                  entry.isBreak ? 'bg-surface-tint' : 'bg-surface',
                  'flex items-center gap-4',
                )}
              >
                <div className="text-center flex-shrink-0 w-20">
                  <p className="text-sm font-mono font-medium text-foreground">
                    {entry.startTime}
                  </p>
                  <p className="text-xs text-muted">{entry.endTime}</p>
                </div>

                {entry.isBreak ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xl">☕</span>
                    <span className="font-medium text-foreground">
                      {getBreakLabel(entry.breakType)}
                    </span>
                  </div>
                ) : (
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground">
                      {entry.subjectId?.name}
                    </p>
                    <p className="text-sm text-muted">
                      {entry.teacherId
                        ? `${entry.teacherId.firstName} ${entry.teacherId.lastName}`
                        : ''}
                    </p>
                  </div>
                )}

                {entry.roomNumber && (
                  <Badge variant="default">Room {entry.roomNumber}</Badge>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-[3px] border-border border-t-primary-500" />
        </div>
      </DashboardLayout>
    );
  }

  if (!timetable) {
    return (
      <DashboardLayout>
        <Card className="max-w-2xl mx-auto text-center py-12">
          <p className="text-5xl mb-3">🔍</p>
          <p className="text-muted">Timetable not found</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => navigate('/timetable')}
          >
            Back to Timetables
          </Button>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageHeader
        title={timetable.name}
        description={`${timetable.type.toUpperCase()} · ${formatDate(timetable.startDate)} — ${formatDate(timetable.endDate)}`}
        breadcrumb={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Timetables', path: '/timetable' },
          { label: timetable.name },
        ]}
        actions={
          <>
            <Button
              variant={viewType === 'week' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setViewType('week')}
            >
              Week View
            </Button>
            <Button
              variant={viewType === 'day' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setViewType('day')}
            >
              Day View
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate('/timetable')}>
              Back
            </Button>
          </>
        }
      />

      <Card>{viewType === 'week' ? renderWeekView() : renderDayView()}</Card>
    </DashboardLayout>
  );
}