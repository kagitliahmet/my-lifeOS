import React, { useState, useEffect } from 'react';
import { View, StudySession, TodoItem } from '../types';
import { StorageService } from '../services/storage';
import { 
  BookOpen, Clapperboard, Timer, Archive, GraduationCap, 
  CheckSquare, Plus, Trash2, BarChart3, ExternalLink
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

interface DashboardProps {
  onChangeView: (view: View, params?: any) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onChangeView }) => {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const [studyData, setStudyData] = useState<StudySession[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Load data asynchronously from IndexedDB
    const loadData = async () => {
      const loadedTodos = await StorageService.getTodos();
      const loadedSessions = await StorageService.getSessions();
      setTodos(loadedTodos);
      setStudyData(loadedSessions);
    };
    loadData();

    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.trim()) return;
    const newItem: TodoItem = {
      id: Date.now().toString(),
      text: newTodo,
      completed: false
    };
    const updated = [...todos, newItem];
    setTodos(updated);
    StorageService.saveTodos(updated);
    setNewTodo('');
  };

  const toggleTodo = (id: string) => {
    const updated = todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    setTodos(updated);
    StorageService.saveTodos(updated);
  };

  const deleteTodo = (id: string) => {
    const updated = todos.filter(t => t.id !== id);
    setTodos(updated);
    StorageService.saveTodos(updated);
  };

  // Prepare chart data (Last 7 days study duration in minutes)
  const chartData = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dayStr = d.toLocaleDateString('tr-TR', { weekday: 'short' });
    
    // Sum duration for this day
    const totalSeconds = studyData
      .filter(s => new Date(s.date).toDateString() === d.toDateString())
      .reduce((acc, curr) => acc + curr.durationSeconds, 0);

    return {
      name: dayStr,
      minutes: Math.round(totalSeconds / 60)
    };
  });

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Header / Date */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Hoşgeldin</h1>
          <p className="text-gray-500">Hayatını yönetmeye başla.</p>
        </div>
        <div className="text-right mt-4 md:mt-0">
          <div className="text-2xl font-mono font-semibold text-gray-700">
            {currentTime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div className="text-sm text-gray-500">
            {currentTime.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Column: Todo & Quick Info */}
        <div className="md:col-span-4 space-y-6">
          
          {/* To-Do List */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-96 flex flex-col">
            <div className="flex items-center gap-2 mb-4 text-gray-700">
              <CheckSquare size={20} />
              <h2 className="font-semibold text-lg">Yapılacaklar</h2>
            </div>
            
            <form onSubmit={handleAddTodo} className="flex gap-2 mb-4">
              <input
                type="text"
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                placeholder="Yeni görev..."
                className="flex-1 border-b-2 border-gray-200 focus:border-indigo-500 outline-none px-2 py-1 text-sm bg-transparent"
              />
              <button type="submit" className="text-indigo-600 hover:text-indigo-800 transition-colors">
                <Plus size={20} />
              </button>
            </form>

            <div className="overflow-y-auto flex-1 space-y-2 pr-2">
              {todos.length === 0 && <p className="text-gray-400 text-sm text-center mt-10">Görev yok. Harika!</p>}
              {todos.map(todo => (
                <div key={todo.id} className="flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => toggleTodo(todo.id)}
                      className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${todo.completed ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 hover:border-gray-400'}`}
                    >
                      {todo.completed && <CheckSquare size={14} />}
                    </button>
                    <span className={`text-sm ${todo.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                      {todo.text}
                    </span>
                  </div>
                  {/* Changed: Always visible (text-gray-300), darker on hover */}
                  <button onClick={() => deleteTodo(todo.id)} className="text-gray-300 hover:text-red-500 transition-colors p-1">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Mini Study Stats */}
          <div 
            onClick={() => onChangeView(View.STUDY, { tab: 'analysis' })}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 cursor-pointer hover:shadow-md transition-shadow group"
          >
             <div className="flex items-center justify-between mb-2 text-gray-700">
               <div className="flex items-center gap-2">
                  <BarChart3 size={20} />
                  <h2 className="font-semibold text-lg">Bu Hafta Çalışma</h2>
               </div>
               <ExternalLink size={16} className="text-gray-400 group-hover:text-blue-500" />
            </div>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{fontSize: 10}} tickLine={false} axisLine={false} />
                  <Tooltip 
                    cursor={{fill: '#f3f4f6'}}
                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                  />
                  <Bar dataKey="minutes" fill="#818cf8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* Right Column: Navigation Grid */}
        <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4 auto-rows-min">
          
          <button 
            onClick={() => onChangeView(View.LIBRARY)}
            className="group bg-blue-50 hover:bg-blue-100 border border-blue-100 p-6 rounded-2xl transition-all duration-300 flex flex-col items-start h-48 justify-between hover:shadow-md"
          >
            <div className="p-3 bg-white rounded-xl shadow-sm text-blue-600 group-hover:scale-110 transition-transform">
              <BookOpen size={32} />
            </div>
            <div className="text-left">
              <h3 className="text-xl font-bold text-gray-800">Kütüphane</h3>
              <p className="text-sm text-gray-600 mt-1">Kitaplarını yönet, okuma listeni takip et.</p>
            </div>
          </button>

          <button 
            onClick={() => onChangeView(View.MOVIES)}
            className="group bg-red-50 hover:bg-red-100 border border-red-100 p-6 rounded-2xl transition-all duration-300 flex flex-col items-start h-48 justify-between hover:shadow-md"
          >
            <div className="p-3 bg-white rounded-xl shadow-sm text-red-600 group-hover:scale-110 transition-transform">
              <Clapperboard size={32} />
            </div>
            <div className="text-left">
              <h3 className="text-xl font-bold text-gray-800">Film Odası</h3>
              <p className="text-sm text-gray-600 mt-1">İzlenecekler listesi ve film arşivi.</p>
            </div>
          </button>

          <button 
            onClick={() => onChangeView(View.STUDY)}
            className="group bg-orange-50 hover:bg-orange-100 border border-orange-100 p-6 rounded-2xl transition-all duration-300 flex flex-col items-start h-48 justify-between hover:shadow-md"
          >
            <div className="p-3 bg-white rounded-xl shadow-sm text-orange-600 group-hover:scale-110 transition-transform">
              <Timer size={32} />
            </div>
            <div className="text-left">
              <h3 className="text-xl font-bold text-gray-800">Çalışma Odası</h3>
              <p className="text-sm text-gray-600 mt-1">Pomodoro, kronometre ve analizler.</p>
            </div>
          </button>

          <button 
            onClick={() => onChangeView(View.ARCHIVE)}
            className="group bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 p-6 rounded-2xl transition-all duration-300 flex flex-col items-start h-48 justify-between hover:shadow-md"
          >
            <div className="p-3 bg-white rounded-xl shadow-sm text-emerald-600 group-hover:scale-110 transition-transform">
              <Archive size={32} />
            </div>
            <div className="text-left">
              <h3 className="text-xl font-bold text-gray-800">Arşiv</h3>
              <p className="text-sm text-gray-600 mt-1">Belgeler, dosyalar ve kaynaklar.</p>
            </div>
          </button>

           <button 
            onClick={() => onChangeView(View.COURSES)}
            className="group bg-violet-50 hover:bg-violet-100 border border-violet-100 p-6 rounded-2xl transition-all duration-300 flex flex-col items-start h-48 justify-between hover:shadow-md sm:col-span-2"
          >
             <div className="flex items-start justify-between w-full">
              <div className="p-3 bg-white rounded-xl shadow-sm text-violet-600 group-hover:scale-110 transition-transform">
                <GraduationCap size={32} />
              </div>
              <span className="bg-white/50 text-violet-800 text-xs px-2 py-1 rounded font-medium">Yeni</span>
            </div>
            <div className="text-left mt-4">
              <h3 className="text-xl font-bold text-gray-800">Kurslarım</h3>
              <p className="text-sm text-gray-600 mt-1">Online ders notları ve dosya yönetimi.</p>
            </div>
          </button>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;