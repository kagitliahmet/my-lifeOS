import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, GraduationCap, Folder, FileText, ChevronRight, Home, MoreVertical, FolderPlus, FilePlus, UploadCloud, X, Image as ImageIcon, Trash2, AlertTriangle } from 'lucide-react';
import { Course, FileSystemNode } from '../types';
import { StorageService } from '../services/storage';

interface CoursesProps {
  onBack: () => void;
}

const Courses: React.FC<CoursesProps> = ({ onBack }) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [activeCourseId, setActiveCourseId] = useState<string | null>(null);
  
  // Navigation Path (Stack of folder IDs)
  const [currentPath, setCurrentPath] = useState<FileSystemNode[]>([]);
  
  // Modal States
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<FileSystemNode | null>(null);
  const [courseToDelete, setCourseToDelete] = useState<string | null>(null);

  // Form States
  const [newCourse, setNewCourse] = useState({ title: '', keywords: '', platform: '' });
  const [newItemName, setNewItemName] = useState('');

  // Drag and Drop State
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    StorageService.getCourses().then(setCourses);
  }, []);

  const handleCreateCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourse.title) return;

    const course: Course = {
      id: Date.now().toString(),
      title: newCourse.title,
      keywords: newCourse.keywords.split(',').map(k => k.trim()).filter(k => k),
      platform: newCourse.platform || 'Online',
      notes: '',
      progress: 0,
      fileSystem: []
    };

    const updated = [course, ...courses];
    setCourses(updated);
    StorageService.saveCourses(updated);
    setIsCourseModalOpen(false);
    setNewCourse({ title: '', keywords: '', platform: '' });
  };

  const activeCourse = courses.find(c => c.id === activeCourseId);

  // Helper to find the current directory node list from the path
  const getCurrentDirectory = (): FileSystemNode[] => {
      if (!activeCourse) return [];
      if (currentPath.length === 0) return activeCourse.fileSystem;
      
      const parent = currentPath[currentPath.length - 1];
      return parent.children || [];
  };

  const updateCourseFileSystem = (newFileSystem: FileSystemNode[]) => {
      const updatedCourses = courses.map(c => c.id === activeCourseId ? { ...c, fileSystem: newFileSystem } : c);
      setCourses(updatedCourses);
      StorageService.saveCourses(updatedCourses);

      // Re-traverse path to keep object references fresh
      if(currentPath.length > 0) {
          let tempNodes = newFileSystem;
          const newPath: FileSystemNode[] = [];
          for(const p of currentPath) {
              const found = tempNodes.find(n => n.id === p.id);
              if(found) {
                  newPath.push(found);
                  tempNodes = found.children || [];
              }
          }
          setCurrentPath(newPath);
      }
  };

  // Generic function to add node to current path
  const addItemToCurrentPath = (newItem: FileSystemNode) => {
      if (!activeCourse) return;
      
      const updateRecursive = (nodes: FileSystemNode[], path: FileSystemNode[]): FileSystemNode[] => {
          if (path.length === 0) {
              return [...nodes, newItem];
          }
          const [head, ...tail] = path;
          return nodes.map(node => {
              if (node.id === head.id) {
                  return { ...node, children: updateRecursive(node.children || [], tail) };
              }
              return node;
          });
      };

      const newFileSystem = updateRecursive(activeCourse.fileSystem, currentPath);
      updateCourseFileSystem(newFileSystem);
  };

  const handleCreateFolder = () => {
      if (!newItemName || !activeCourse) return;
      const newItem: FileSystemNode = {
          id: Date.now().toString(),
          name: newItemName,
          type: 'folder',
          children: [],
          createdAt: Date.now()
      };
      addItemToCurrentPath(newItem);
      setNewItemName('');
      setIsFolderModalOpen(false);
  };

  const handleFileUpload = async (files: FileList) => {
      if (!activeCourse) return;
      
      for (let i = 0; i < files.length; i++) {
          const file = files[i];
          
          // Check for size limit (Increased to 50MB for IndexedDB)
          if(file.size > 50 * 1024 * 1024) {
              alert(`Dosya çok büyük: ${file.name}. Lütfen 50MB'dan küçük dosyalar yükleyin.`);
              continue;
          }

          const reader = new FileReader();
          reader.onload = (e) => {
              const result = e.target?.result as string;
              const newItem: FileSystemNode = {
                  id: Date.now().toString() + i,
                  name: file.name,
                  type: 'file',
                  fileType: file.type.includes('image') ? 'img' : 'doc',
                  createdAt: Date.now(),
                  size: file.size,
                  dataUrl: result // Store Base64
              };
              addItemToCurrentPath(newItem);
          };
          reader.readAsDataURL(file);
      }
  };

  // Drag & Drop Handlers
  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const onDrop = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          handleFileUpload(e.dataTransfer.files);
      }
  };

  const navigateTo = (folder: FileSystemNode) => {
      setCurrentPath([...currentPath, folder]);
  };

  const navigateUp = (index?: number) => {
      if (index === undefined) {
           setCurrentPath([]);
      } else {
           setCurrentPath(currentPath.slice(0, index + 1));
      }
  };

  const requestDeleteCourse = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setCourseToDelete(id);
  }

  const confirmDeleteCourse = () => {
      if (courseToDelete) {
          const updated = courses.filter(c => c.id !== courseToDelete);
          setCourses(updated);
          StorageService.saveCourses(updated);
          if(activeCourseId === courseToDelete) setActiveCourseId(null);
          setCourseToDelete(null);
      }
  }

  // --- Views ---

  if (activeCourseId && activeCourse) {
      const currentItems = getCurrentDirectory();

      return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto h-screen flex flex-col bg-gray-50/50">
             {/* Header */}
             <div className="flex items-center justify-between mb-6">
                 <div className="flex items-center gap-4">
                     <button onClick={() => setActiveCourseId(null)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                        <ArrowLeft size={20} />
                     </button>
                     <div>
                         <h1 className="text-2xl font-bold text-gray-800">{activeCourse.title}</h1>
                         <div className="flex gap-2 text-xs text-gray-500 mt-1">
                             {activeCourse.keywords.map(k => <span key={k} className="bg-gray-200 px-2 py-0.5 rounded">{k}</span>)}
                         </div>
                     </div>
                 </div>
                 <div className="flex gap-2">
                     <button onClick={() => setIsFolderModalOpen(true)} className="flex items-center gap-2 bg-white border px-3 py-2 rounded-lg text-sm hover:bg-gray-50">
                         <FolderPlus size={16} /> Klasör
                     </button>
                     <label className="flex items-center gap-2 bg-violet-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-violet-700 cursor-pointer">
                         <FilePlus size={16} /> Dosya Yükle
                         <input type="file" multiple className="hidden" onChange={(e) => e.target.files && handleFileUpload(e.target.files)} />
                     </label>
                 </div>
             </div>

             {/* Breadcrumbs */}
             <div className="flex items-center gap-2 text-sm text-gray-600 mb-6 bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                 <button onClick={() => navigateUp()} className="hover:bg-gray-100 p-1 rounded">
                     <Home size={16} />
                 </button>
                 {currentPath.map((folder, idx) => (
                     <React.Fragment key={folder.id}>
                         <ChevronRight size={14} className="text-gray-400" />
                         <button onClick={() => navigateUp(idx)} className="hover:underline font-medium text-gray-800">
                             {folder.name}
                         </button>
                     </React.Fragment>
                 ))}
             </div>

             {/* File Browser Table */}
             <div 
                className={`bg-white rounded-xl shadow-sm border overflow-hidden flex-1 flex flex-col transition-all ${isDragging ? 'border-violet-500 border-2 bg-violet-50' : 'border-gray-200'}`}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
             >
                 {isDragging && (
                     <div className="absolute inset-0 bg-violet-500/10 z-10 flex items-center justify-center pointer-events-none">
                         <div className="text-violet-600 font-bold text-xl flex flex-col items-center">
                             <UploadCloud size={48} />
                             Dosyaları Buraya Bırak
                         </div>
                     </div>
                 )}

                 <div className="grid grid-cols-12 gap-4 p-3 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                     <div className="col-span-8">Ad</div>
                     <div className="col-span-3">Eklenme Tarihi</div>
                     <div className="col-span-1"></div>
                 </div>
                 <div className="overflow-y-auto flex-1">
                     {currentItems.length === 0 && (
                         <div className="flex flex-col items-center justify-center h-full text-gray-400">
                             <Folder size={48} className="mb-2 opacity-20" />
                             <p>Bu klasör boş.</p>
                             <p className="text-xs mt-2">Dosyaları sürükleyip bırakabilirsiniz.</p>
                         </div>
                     )}
                     {currentItems.map(item => (
                         <div 
                            key={item.id} 
                            onClick={() => item.type === 'folder' ? navigateTo(item) : setPreviewFile(item)}
                            className={`grid grid-cols-12 gap-4 p-3 border-b border-gray-50 hover:bg-blue-50/50 transition-colors items-center group cursor-pointer`}
                         >
                             <div className="col-span-8 flex items-center gap-3">
                                 {item.type === 'folder' ? (
                                     <Folder size={20} className="text-blue-400 fill-blue-400/20" />
                                 ) : item.fileType === 'img' ? (
                                      <ImageIcon size={20} className="text-purple-400" />
                                 ) : (
                                     <FileText size={20} className="text-gray-400" />
                                 )}
                                 <span className="text-gray-800 text-sm font-medium truncate">{item.name}</span>
                             </div>
                             <div className="col-span-3 text-xs text-gray-500">
                                 {new Date(item.createdAt).toLocaleDateString()}
                             </div>
                             <div className="col-span-1 text-right">
                                 <button className="text-gray-300 hover:text-gray-600">
                                     <MoreVertical size={16} />
                                 </button>
                             </div>
                         </div>
                     ))}
                 </div>
             </div>

             {/* Modals */}
             {isFolderModalOpen && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl w-full max-w-sm p-6 shadow-xl">
                        <h3 className="font-bold mb-4">Yeni Klasör</h3>
                        <input 
                            autoFocus
                            value={newItemName}
                            onChange={(e) => setNewItemName(e.target.value)}
                            placeholder="Klasör adı..."
                            className="w-full border p-2 rounded mb-4 outline-none focus:ring-2 focus:ring-violet-500"
                            onKeyDown={e => e.key === 'Enter' && handleCreateFolder()}
                        />
                        <div className="flex justify-end gap-2">
                            <button onClick={() => {setIsFolderModalOpen(false); setNewItemName('')}} className="px-3 py-1.5 text-gray-600 text-sm">İptal</button>
                            <button onClick={handleCreateFolder} className="px-3 py-1.5 bg-violet-600 text-white rounded text-sm">Oluştur</button>
                        </div>
                    </div>
                </div>
             )}

             {/* File Preview Modal */}
             {previewFile && (
                 <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                     <div className="bg-white rounded-xl w-full max-w-4xl h-[80vh] flex flex-col shadow-2xl overflow-hidden relative">
                         <div className="flex justify-between items-center p-4 border-b">
                             <h3 className="font-bold text-gray-800">{previewFile.name}</h3>
                             <button onClick={() => setPreviewFile(null)} className="p-1 hover:bg-gray-100 rounded-full">
                                 <X size={24} />
                             </button>
                         </div>
                         <div className="flex-1 overflow-auto bg-gray-50 flex items-center justify-center p-4">
                             {previewFile.fileType === 'img' && previewFile.dataUrl ? (
                                 <img src={previewFile.dataUrl} alt={previewFile.name} className="max-w-full max-h-full object-contain shadow-lg" />
                             ) : previewFile.dataUrl ? (
                                 <iframe src={previewFile.dataUrl} className="w-full h-full border bg-white" title="Preview" />
                             ) : (
                                 <div className="text-center text-gray-500">
                                     <FileText size={64} className="mx-auto mb-4 opacity-30" />
                                     <p>Ön izleme desteklenmiyor.</p>
                                 </div>
                             )}
                         </div>
                     </div>
                 </div>
             )}
        </div>
      );
  }

  // --- Course List View ---
  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto min-h-screen flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <button onClick={onBack} className="flex items-center text-gray-600 hover:text-gray-900 transition-colors">
          <ArrowLeft className="mr-2" size={20} /> Geri Dön
        </button>
        <h1 className="text-3xl font-bold text-gray-800">Kurslarım</h1>
        <button 
          onClick={() => setIsCourseModalOpen(true)}
          className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus size={18} /> Kurs Ekle
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map(course => (
          <div 
            key={course.id} 
            onClick={() => setActiveCourseId(course.id)}
            className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all cursor-pointer group hover:border-violet-200 relative"
          >
             <div className="flex justify-between items-start mb-4">
                 <div className="p-3 bg-violet-50 text-violet-600 rounded-xl group-hover:scale-110 transition-transform">
                     <GraduationCap size={28} />
                 </div>
                 <div className="px-2 py-1 bg-gray-100 text-xs font-bold text-gray-500 rounded uppercase">
                     {course.platform}
                 </div>
             </div>
             <h3 className="text-xl font-bold text-gray-800 mb-2">{course.title}</h3>
             <div className="flex flex-wrap gap-2 mb-4">
                 {course.keywords.slice(0,3).map(k => (
                     <span key={k} className="text-xs bg-gray-50 text-gray-500 px-2 py-1 rounded border border-gray-100">#{k}</span>
                 ))}
             </div>
             <div className="border-t pt-4 flex justify-between items-center text-sm text-gray-500">
                 <div className="flex items-center gap-1">
                     <Folder size={14} /> {course.fileSystem ? course.fileSystem.length : 0} ana öge
                 </div>
                 <button 
                    onClick={(e) => requestDeleteCourse(course.id, e)} 
                    className="flex items-center gap-1 text-gray-400 hover:text-red-600 hover:bg-red-50 px-2 py-1 rounded transition-colors"
                 >
                     <Trash2 size={14} /> Sil
                 </button>
             </div>
          </div>
        ))}
      </div>

      {isCourseModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl animate-scale-in">
            <h2 className="text-xl font-bold mb-4">Yeni Kurs Oluştur</h2>
            <form onSubmit={handleCreateCourse} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kurs Adı</label>
                <input 
                  required
                  className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-violet-500"
                  value={newCourse.title}
                  onChange={e => setNewCourse({...newCourse, title: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Platform</label>
                <input 
                  className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-violet-500"
                  value={newCourse.platform}
                  onChange={e => setNewCourse({...newCourse, platform: e.target.value})}
                  placeholder="Udemy, Coursera, YouTube..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Anahtar Kelimeler (Virgülle ayır)</label>
                <input 
                  className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-violet-500"
                  value={newCourse.keywords}
                  onChange={e => setNewCourse({...newCourse, keywords: e.target.value})}
                  placeholder="React, Frontend, Web..."
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setIsCourseModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">İptal</button>
                <button type="submit" className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700">Oluştur</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {courseToDelete && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl animate-scale-in">
                  <div className="flex flex-col items-center text-center">
                      <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
                          <AlertTriangle size={24} />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Emin misin?</h3>
                      <p className="text-gray-500 mb-6">
                          Bu kursu ve içerisindeki tüm dosyaları silmek üzeresin. Bu işlem geri alınamaz.
                      </p>
                      <div className="flex gap-3 w-full">
                          <button 
                              onClick={() => setCourseToDelete(null)}
                              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                          >
                              İptal
                          </button>
                          <button 
                              onClick={confirmDeleteCourse}
                              className="flex-1 px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors"
                          >
                              Evet, Sil
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Courses;