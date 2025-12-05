import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ArrowLeft, Play, Pause, Square, RotateCcw, BarChart3, Clock, Calendar, Tag } from 'lucide-react';
import { StudySession } from '../types';
import { StorageService } from '../services/storage';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

interface StudyRoomProps {
  onBack: () => void;
  initialTab?: 'timer' | 'analysis';
}

const StudyRoom: React.FC<StudyRoomProps> = ({ onBack, initialTab = 'timer' }) => {
  const [activeTab, setActiveTab] = useState<'timer' | 'analysis'>(initialTab);
  
  // Timer State
  const [mode, setMode] = useState<'Pomodoro' | 'Stopwatch'>('Pomodoro');
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [elapsed, setElapsed] = useState(0);
  const [pomodoroDuration, setPomodoroDuration] = useState(25);
  const [sessionTag, setSessionTag] = useState('');
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  
  // Analysis State
  const [sessions, setSessions] = useState<StudySession[]>([]);

  // Refs
  const startTimeRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    StorageService.getSessions().then(loadedSessions => {
        setSessions(loadedSessions);
        // Extract unique tags for suggestion
        const tags = new Set<string>();
        loadedSessions.forEach(s => s.tags?.forEach(t => tags.add(t)));
        setAvailableTags(Array.from(tags));
    });
  }, []);

  useEffect(() => {
    handleReset();
    return () => stopTimer();
  }, [mode]);

  const startTimer = () => {
    if (isActive) return;
    
    setIsActive(true);
    startTimeRef.current = Date.now();
    
    if (mode === 'Pomodoro') {
      const targetEndTime = Date.now() + (timeLeft * 1000);
      intervalRef.current = window.setInterval(() => {
        const now = Date.now();
        const diff = Math.ceil((targetEndTime - now) / 1000);
        if (diff <= 0) {
          stopTimer();
          setTimeLeft(0);
          saveSession(pomodoroDuration * 60);
          alert("Süre doldu!");
          setIsActive(false);
        } else {
          setTimeLeft(diff);
        }
      }, 1000);
    } else {
      const startBase = elapsed; 
      intervalRef.current = window.setInterval(() => {
        const now = Date.now();
        const sessionSeconds = Math.floor((now - (startTimeRef.current as number)) / 1000);
        setElapsed(startBase + sessionSeconds);
      }, 1000);
    }
  };

  const stopTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const handlePause = () => {
    stopTimer();
    setIsActive(false);
  };

  const handleFinish = () => {
    stopTimer();
    setIsActive(false);
    
    let durationToSave = 0;
    if (mode === 'Pomodoro') {
      durationToSave = (pomodoroDuration * 60) - timeLeft;
    } else {
      durationToSave = elapsed;
    }
    
    if (durationToSave > 60) {
      saveSession(durationToSave);
    }
    handleReset();
  };

  const handleReset = () => {
    stopTimer();
    setIsActive(false);
    if (mode === 'Pomodoro') {
      setTimeLeft(pomodoroDuration * 60);
    } else {
      setElapsed(0);
    }
  };

  const saveSession = (seconds: number) => {
    const session: StudySession = {
      id: Date.now().toString(),
      date: Date.now(),
      durationSeconds: seconds,
      mode: mode,
      tags: sessionTag ? [sessionTag] : []
    };
    const updated = [session, ...sessions];
    setSessions(updated);
    StorageService.saveSessions(updated);
    
    // Update available tags if new
    if(sessionTag && !availableTags.includes(sessionTag)) {
        setAvailableTags([...availableTags, sessionTag]);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Analysis Data Prep
  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dayStr = d.toLocaleDateString('tr-TR', { weekday: 'short' });
    const fullDate = d.toDateString();
    
    const totalMin = sessions
      .filter(s => new Date(s.date).toDateString() === fullDate)
      .reduce((acc, curr) => acc + curr.durationSeconds, 0) / 60;
    
    return { name: dayStr, minutes: Math.round(totalMin) };
  });

  const pieData = [
    { name: 'Pomodoro', value: sessions.filter(s => s.mode === 'Pomodoro').length },
    { name: 'Kronometre', value: sessions.filter(s => s.mode === 'Stopwatch').length }
  ];
  const COLORS = ['#F97316', '#8B5CF6'];

  // Tag Distribution Data
  const tagData = useMemo(() => {
      const counts: Record<string, number> = {};
      sessions.forEach(s => {
          const tag = (s.tags && s.tags.length > 0) ? s.tags[0] : 'Etiketsiz';
          counts[tag] = (counts[tag] || 0) + s.durationSeconds;
      });
      return Object.entries(counts).map(([name, value], index) => ({
          name, 
          value: Math.round(value / 60), // minutes
          color: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#6366F1'][index % 6]
      })).filter(d => d.value > 0);
  }, [sessions]);

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto min-h-screen flex flex-col bg-gray-50/50">
      <div className="flex items-center justify-between mb-8">
        <button onClick={onBack} className="flex items-center text-gray-600 hover:text-gray-900 transition-colors">
          <ArrowLeft className="mr-2" size={20} /> Geri Dön
        </button>
        <div className="flex bg-gray-200/50 p-1 rounded-lg">
             <button 
                onClick={() => setActiveTab('timer')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'timer' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
             >
                 Sayaç
             </button>
             <button 
                onClick={() => setActiveTab('analysis')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'analysis' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
             >
                 Değerlendirme
             </button>
        </div>
        <div className="w-24"></div>
      </div>

      {activeTab === 'timer' ? (
        <div className="flex-1 flex flex-col items-center justify-center animate-fade-in">
            {/* Mode Switcher */}
            <div className="bg-gray-100 p-1 rounded-xl flex mb-8">
            <button 
                onClick={() => !isActive && setMode('Pomodoro')}
                className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'Pomodoro' ? 'bg-white shadow-sm text-orange-600' : 'text-gray-500 hover:text-gray-700'}`}
                disabled={isActive}
            >
                Pomodoro
            </button>
            <button 
                onClick={() => !isActive && setMode('Stopwatch')}
                className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'Stopwatch' ? 'bg-white shadow-sm text-orange-600' : 'text-gray-500 hover:text-gray-700'}`}
                disabled={isActive}
            >
                Kronometre
            </button>
            </div>

            {/* Tag Input Section */}
            {!isActive && (
                <div className="mb-8 w-full max-w-xs">
                    <label className="block text-xs font-bold text-gray-400 mb-2 text-center uppercase tracking-wide">Çalışma Etiketi</label>
                    <div className="relative">
                        <Tag className="absolute left-3 top-2.5 text-gray-400" size={16} />
                        <input 
                            className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all text-sm"
                            placeholder="Örn: Matematik, Okuma..."
                            value={sessionTag}
                            onChange={(e) => setSessionTag(e.target.value)}
                        />
                    </div>
                    {availableTags.length > 0 && (
                        <div className="flex flex-wrap justify-center gap-2 mt-3">
                            {availableTags.slice(0, 4).map(tag => (
                                <button 
                                    key={tag}
                                    onClick={() => setSessionTag(tag)}
                                    className={`px-2 py-1 text-xs rounded-full border transition-colors ${sessionTag === tag ? 'bg-orange-100 border-orange-200 text-orange-700' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Timer Display */}
            <div className="text-9xl font-mono font-bold text-gray-800 mb-12 tabular-nums tracking-tighter">
            {mode === 'Pomodoro' ? formatTime(timeLeft) : formatTime(elapsed)}
            </div>

            {/* Settings for Pomodoro */}
            {mode === 'Pomodoro' && !isActive && (
            <div className="flex items-center gap-4 mb-8">
                <label className="text-gray-500 font-medium">Hedef Süre (dk):</label>
                <input 
                type="number" 
                value={pomodoroDuration} 
                onChange={(e) => {
                    const val = parseInt(e.target.value) || 25;
                    setPomodoroDuration(val);
                    setTimeLeft(val * 60);
                }}
                className="w-20 p-2 text-center border rounded-lg outline-none focus:border-orange-500 font-mono text-lg"
                />
            </div>
            )}

            {/* Controls */}
            <div className="flex items-center gap-6">
            {!isActive ? (
                <button 
                onClick={startTimer}
                className="w-24 h-24 bg-orange-500 hover:bg-orange-600 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-all"
                >
                <Play size={40} className="ml-1" />
                </button>
            ) : (
                <button 
                onClick={handlePause}
                className="w-24 h-24 bg-amber-500 hover:bg-amber-600 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-all"
                >
                <Pause size={40} />
                </button>
            )}

            <button 
                onClick={handleReset}
                disabled={isActive}
                className={`w-16 h-16 rounded-full flex items-center justify-center transition-all border
                ${isActive ? 'opacity-50 cursor-not-allowed border-gray-200 text-gray-300' : 'border-gray-300 text-gray-500 hover:border-gray-400 hover:bg-gray-50'}
                `}
            >
                <RotateCcw size={24} />
            </button>
            
            <button 
                onClick={handleFinish}
                disabled={!isActive && (mode === 'Pomodoro' ? timeLeft === pomodoroDuration*60 : elapsed === 0)}
                className="w-16 h-16 rounded-full flex items-center justify-center transition-all border border-red-200 text-red-500 hover:bg-red-50 hover:border-red-300"
                title="Bitir ve Kaydet"
            >
                <Square size={24} fill="currentColor" />
            </button>
            </div>
            
            <p className="mt-8 text-gray-400 text-sm flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                {isActive ? `Çalışılıyor: ${sessionTag || 'Etiketsiz'}` : 'Başlamaya hazır.'}
            </p>
        </div>
      ) : (
          <div className="flex-1 overflow-y-auto animate-fade-in space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Summary Card */}
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center items-center">
                      <h3 className="text-gray-500 mb-2">Toplam Çalışma</h3>
                      <div className="text-4xl font-bold text-gray-800">
                          {Math.round(sessions.reduce((a, b) => a + b.durationSeconds, 0) / 60)}
                          <span className="text-lg font-normal text-gray-400 ml-1">dk</span>
                      </div>
                  </div>
                   <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center items-center">
                      <h3 className="text-gray-500 mb-2">Toplam Oturum</h3>
                      <div className="text-4xl font-bold text-gray-800">
                          {sessions.length}
                      </div>
                  </div>
                   <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center items-center">
                      <h3 className="text-gray-500 mb-2">Ortalama Süre</h3>
                      <div className="text-4xl font-bold text-gray-800">
                          {sessions.length > 0 ? Math.round((sessions.reduce((a, b) => a + b.durationSeconds, 0) / 60) / sessions.length) : 0}
                          <span className="text-lg font-normal text-gray-400 ml-1">dk</span>
                      </div>
                  </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-96">
                   {/* Main Bar Chart */}
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
                       <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                           <BarChart3 size={20} className="text-orange-500"/> Son 7 Günlük Performans
                       </h3>
                       <div className="flex-1">
                           <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={last7Days}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={{borderRadius: '8px', border:'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                                <Bar dataKey="minutes" fill="#F97316" radius={[4, 4, 0, 0]} />
                                </BarChart>
                           </ResponsiveContainer>
                       </div>
                  </div>

                  {/* Tag Pie Chart */}
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
                      <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                           <Tag size={20} className="text-blue-500"/> Konu Dağılımı (dk)
                       </h3>
                       {tagData.length > 0 ? (
                            <div className="flex-1">
                                <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                        <Pie
                                            data={tagData}
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {tagData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        </PieChart>
                                </ResponsiveContainer>
                                <div className="flex flex-wrap justify-center gap-2 text-xs mt-2">
                                    {tagData.map((t) => (
                                        <div key={t.name} className="flex items-center gap-1">
                                            <div className="w-2 h-2 rounded-full" style={{backgroundColor: t.color}}></div>
                                            {t.name}
                                        </div>
                                    ))}
                                </div>
                            </div>
                       ) : (
                           <div className="flex-1 flex items-center justify-center text-gray-400">
                               Veri yok.
                           </div>
                       )}
                  </div>
              </div>

              {/* Recent Sessions List */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <h3 className="font-bold text-gray-800 mb-4">Son Oturumlar</h3>
                  <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                          <thead className="text-gray-400 border-b">
                              <tr>
                                  <th className="pb-3 font-medium">Tarih</th>
                                  <th className="pb-3 font-medium">Mod</th>
                                  <th className="pb-3 font-medium">Etiket</th>
                                  <th className="pb-3 font-medium">Süre</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y">
                              {sessions.slice(0, 10).map(s => (
                                  <tr key={s.id}>
                                      <td className="py-3 text-gray-700">{new Date(s.date).toLocaleDateString()} {new Date(s.date).toLocaleTimeString()}</td>
                                      <td className="py-3">
                                          <span className={`px-2 py-1 rounded text-xs ${s.mode === 'Pomodoro' ? 'bg-orange-100 text-orange-700' : 'bg-violet-100 text-violet-700'}`}>
                                              {s.mode}
                                          </span>
                                      </td>
                                       <td className="py-3">
                                          {s.tags?.map(t => (
                                              <span key={t} className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-600 mr-1">
                                                  {t}
                                              </span>
                                          ))}
                                          {!s.tags?.length && <span className="text-gray-300 italic">-</span>}
                                      </td>
                                      <td className="py-3 text-gray-800 font-medium">{Math.floor(s.durationSeconds / 60)} dk {s.durationSeconds % 60} sn</td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default StudyRoom;