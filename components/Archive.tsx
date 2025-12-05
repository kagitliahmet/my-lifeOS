import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Plus, Search, Archive as ArchiveIcon, ExternalLink, Hash, FileText, Trash2, Filter, Calendar, Upload, Download, Paperclip } from 'lucide-react';
import { ArchiveItem } from '../types';
import { StorageService } from '../services/storage';

interface ArchiveProps {
  onBack: () => void;
}

const Archive: React.FC<ArchiveProps> = ({ onBack }) => {
  const [items, setItems] = useState<ArchiveItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  
  const [newItem, setNewItem] = useState<Partial<ArchiveItem>>({
    title: '', category: '', tags: []
  });
  const [tagInput, setTagInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    StorageService.getArchive().then(setItems);
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.title) return;

    let fileData = '';
    
    // Process file if selected
    if (selectedFile) {
        try {
            fileData = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(selectedFile);
            });
        } catch (error) {
            alert("Dosya okunamadı.");
            return;
        }
    }

    const item: ArchiveItem = {
      id: Date.now().toString(),
      title: newItem.title,
      category: newItem.category || 'Genel',
      content: newItem.content,
      tags: newItem.tags || [],
      createdAt: Date.now(),
      year: newItem.year || new Date().getFullYear(),
      url: newItem.url,
      fileData: fileData || undefined,
      fileName: selectedFile?.name,
      fileSize: selectedFile?.size
    };

    const updated = [item, ...items];
    setItems(updated);
    StorageService.saveArchive(updated);
    
    // Reset
    setIsModalOpen(false);
    setNewItem({ title: '', category: '', tags: [] });
    setTagInput('');
    setSelectedFile(null);
  };

  const addTag = () => {
    if (tagInput.trim() && !newItem.tags?.includes(tagInput.trim())) {
      setNewItem({ ...newItem, tags: [...(newItem.tags || []), tagInput.trim()] });
      setTagInput('');
    }
  };
  
  const deleteItem = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if(confirm('Arşivden silinsin mi?')) {
          const updated = items.filter(i => i.id !== id);
          setItems(updated);
          StorageService.saveArchive(updated);
      }
  }
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if(e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          // Size check (Increased to 50MB for IndexedDB)
          if(file.size > 50 * 1024 * 1024) {
              alert("Dosya boyutu çok yüksek! Lütfen 50MB'dan küçük dosyalar yükleyin.");
              e.target.value = '';
              setSelectedFile(null);
              return;
          }
          setSelectedFile(file);
      }
  };

  // Calculate Year Distribution
  const yearCounts = useMemo(() => {
      const counts: Record<string, number> = {};
      items.forEach(item => {
          const y = item.year || new Date(item.createdAt).getFullYear();
          counts[y] = (counts[y] || 0) + 1;
      });
      return Object.entries(counts).sort((a,b) => parseInt(b[0]) - parseInt(a[0]));
  }, [items]);

  const filteredItems = items.filter(i => {
    const matchesSearch = i.title.toLowerCase().includes(search.toLowerCase()) || 
                          i.tags.some(t => t.toLowerCase().includes(search.toLowerCase())) ||
                          i.category.toLowerCase().includes(search.toLowerCase());
    
    if(!matchesSearch) return false;

    if(selectedYear) {
        const itemYear = i.year || new Date(i.createdAt).getFullYear();
        if(itemYear.toString() !== selectedYear) return false;
    }

    return true;
  });

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen flex flex-col bg-[#F7F6F5]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center gap-4">
             <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full text-gray-600">
                <ArrowLeft size={20} />
            </button>
            <div className="flex items-center gap-2">
                <ArchiveIcon size={24} className="text-gray-800" />
                <h1 className="text-xl font-bold text-gray-900 font-mono tracking-tight">INTERNET ARCHIVE: My LifeOS</h1>
            </div>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-black hover:bg-gray-800 text-white px-4 py-2 rounded text-sm font-bold tracking-wide flex items-center gap-2"
        >
          <Plus size={16} /> ADD ITEM
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar / Facets */}
          <div className="w-full md:w-64 space-y-6 flex-shrink-0">
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                  <h3 className="font-bold text-gray-700 text-sm mb-3 flex items-center gap-2"><Filter size={14}/> MEDIA TYPE</h3>
                  <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex justify-between hover:bg-gray-50 p-1 rounded cursor-pointer">
                          <span>All Items</span> <span className="bg-gray-100 px-1.5 rounded text-xs font-mono">{items.length}</span>
                      </div>
                      <div className="flex justify-between hover:bg-gray-50 p-1 rounded cursor-pointer">
                          <span>With Files</span> <span className="bg-gray-100 px-1.5 rounded text-xs font-mono">{items.filter(i => i.fileData).length}</span>
                      </div>
                  </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                  <h3 className="font-bold text-gray-700 text-sm mb-3 flex items-center gap-2"><Calendar size={14} /> YEAR</h3>
                   
                   {/* Year List */}
                   <div className="space-y-1 text-sm text-gray-600 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                       <div 
                           onClick={() => setSelectedYear(null)}
                           className={`flex justify-between hover:bg-gray-50 p-1 rounded cursor-pointer ${selectedYear === null ? 'bg-gray-100 font-bold' : ''}`}
                       >
                           <span>All Years</span>
                       </div>
                       {yearCounts.map(([year, count]) => (
                           <div 
                               key={year}
                               onClick={() => setSelectedYear(year === selectedYear ? null : year)}
                               className={`flex justify-between hover:bg-gray-50 p-1 rounded cursor-pointer ${selectedYear === year ? 'bg-black text-white' : ''}`}
                           >
                               <span>{year}</span>
                               <span className={`px-1.5 rounded text-xs font-mono ${selectedYear === year ? 'bg-gray-700 text-white' : 'bg-gray-100'}`}>{count}</span>
                           </div>
                       ))}
                   </div>
              </div>
          </div>

          {/* Main List */}
          <div className="flex-1">
                {/* Search Bar */}
                <div className="mb-4 relative">
                    <input 
                        className="w-full border border-gray-300 rounded p-2 pl-10 bg-white focus:ring-2 focus:ring-black focus:border-transparent outline-none shadow-inner"
                        placeholder="Search the archive..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                </div>

                <div className="bg-white rounded border border-gray-300 shadow-sm divide-y divide-gray-100">
                    <div className="bg-gray-100 p-2 text-xs font-bold text-gray-600 flex justify-between px-4">
                        <span>SEARCH RESULTS</span>
                        <span>{filteredItems.length} HITS</span>
                    </div>
                    {filteredItems.map(item => (
                        <div key={item.id} className="p-4 hover:bg-yellow-50/50 transition-colors flex gap-4 group cursor-pointer" onClick={() => {}}>
                             {/* Icon Thumbnail */}
                             <div className="w-16 h-20 bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0">
                                 {item.fileData ? <Paperclip className="text-blue-500" /> : <FileText className="text-gray-400" />}
                             </div>
                             
                             <div className="flex-1">
                                 <div className="flex justify-between items-start">
                                    <h3 className="font-bold text-lg text-blue-800 hover:underline">{item.title}</h3>
                                    <div className="flex items-center gap-2">
                                        {item.fileData && (
                                            <a 
                                                href={item.fileData} 
                                                download={item.fileName || 'archive-file'}
                                                className="flex items-center gap-1 text-xs font-bold bg-gray-200 hover:bg-gray-300 text-gray-800 px-2 py-1 rounded transition-colors"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <Download size={14} /> DOWNLOAD
                                            </a>
                                        )}
                                        {/* Changed: Always visible (text-gray-300), darker on hover */}
                                        <button onClick={(e) => deleteItem(item.id, e)} className="text-gray-300 hover:text-red-500 transition-colors">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                 </div>
                                 <div className="text-xs text-gray-500 mb-2">
                                     Published by <span className="text-gray-800 font-semibold">User</span> • <span className="font-mono">{item.year || new Date(item.createdAt).getFullYear()}</span>
                                     {item.fileSize && <span> • {(item.fileSize / 1024).toFixed(1)} KB</span>}
                                 </div>
                                 <div className="text-sm text-gray-700 line-clamp-2 mb-2 italic">
                                     {item.content || "No description provided."}
                                 </div>
                                 <div className="flex gap-2 text-xs">
                                     <span className="font-bold text-gray-500 uppercase tracking-wider">Topics:</span>
                                     {item.category && <span className="bg-gray-100 px-1 rounded">{item.category}</span>}
                                     {item.tags.map(t => <span key={t} className="bg-gray-100 px-1 rounded">{t}</span>)}
                                 </div>
                             </div>
                        </div>
                    ))}
                    {filteredItems.length === 0 && (
                        <div className="p-10 text-center text-gray-500 italic">No items found in the archives.</div>
                    )}
                </div>
          </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded w-full max-w-md p-6 shadow-xl border-4 border-double border-gray-300">
            <h2 className="text-xl font-bold mb-4 font-mono">UPLOAD TO ARCHIVE</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Title</label>
                <input 
                  required
                  className="w-full border p-2 outline-none focus:border-black"
                  value={newItem.title}
                  onChange={e => setNewItem({...newItem, title: e.target.value})}
                />
              </div>
               <div className="flex gap-4">
                    <div className="flex-1">
                        <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Category</label>
                        <input 
                        className="w-full border p-2 outline-none focus:border-black"
                        value={newItem.category}
                        onChange={e => setNewItem({...newItem, category: e.target.value})}
                        />
                    </div>
                    <div className="w-24">
                        <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Year</label>
                        <input 
                        type="number"
                        className="w-full border p-2 outline-none focus:border-black"
                        value={newItem.year || ''}
                        onChange={e => setNewItem({...newItem, year: parseInt(e.target.value)})}
                        placeholder="YYYY"
                        />
                    </div>
               </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Description / Content</label>
                <textarea 
                  className="w-full border p-2 outline-none focus:border-black h-24 resize-none"
                  value={newItem.content}
                  onChange={e => setNewItem({...newItem, content: e.target.value})}
                />
              </div>

               {/* File Upload Section */}
               <div className="border-2 border-dashed border-gray-300 p-4 rounded bg-gray-50 text-center hover:bg-gray-100 transition-colors relative">
                    <input 
                        type="file"
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="flex flex-col items-center gap-2 text-gray-500">
                        <Upload size={24} />
                        {selectedFile ? (
                            <span className="text-sm font-bold text-black break-all">{selectedFile.name}</span>
                        ) : (
                            <span className="text-sm font-bold">UPLOAD FILE (RAR, ZIP, PDF...)</span>
                        )}
                        <span className="text-xs text-gray-400">Max 50MB</span>
                    </div>
               </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Keywords</label>
                <div className="flex gap-2 mb-2">
                    <input 
                      className="flex-1 border p-2 outline-none focus:border-black"
                      value={tagInput}
                      onChange={e => setTagInput(e.target.value)}
                      placeholder="Type and press enter"
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    />
                    <button type="button" onClick={addTag} className="bg-gray-200 px-3 hover:bg-gray-300 font-bold">+</button>
                </div>
                <div className="flex flex-wrap gap-2">
                    {newItem.tags?.map(t => (
                        <span key={t} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 border border-gray-300">{t}</span>
                    ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:underline text-sm font-bold">CANCEL</button>
                <button type="submit" className="px-6 py-2 bg-black text-white hover:bg-gray-800 text-sm font-bold">UPLOAD ITEM</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Archive;