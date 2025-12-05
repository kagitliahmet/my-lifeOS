import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Search, Book as BookIcon, X, Sparkles, Globe, Library as LibraryIcon, Trash2, Download, AlertTriangle } from 'lucide-react';
import { Book, BookStatus } from '../types';
import { StorageService } from '../services/storage';
import { searchOnlineContent } from '../services/gemini';

interface LibraryProps {
  onBack: () => void;
}

const Library: React.FC<LibraryProps> = ({ onBack }) => {
  const [books, setBooks] = useState<Book[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [searchMode, setSearchMode] = useState<'Library' | 'Internet'>('Library');
  const [isSearchingOnline, setIsSearchingOnline] = useState(false);
  const [onlineResults, setOnlineResults] = useState<any[]>([]);
  const [bookToDelete, setBookToDelete] = useState<string | null>(null);
  
  // Form State
  const [newBook, setNewBook] = useState<Partial<Book>>({
    title: '', author: '', type: 'Physical', status: BookStatus.UNREAD, coverUrl: ''
  });

  useEffect(() => {
    StorageService.getBooks().then(setBooks);
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    addBook(newBook);
    setIsModalOpen(false);
    resetForm();
  };

  const addBook = (bookData: Partial<Book>) => {
    if (!bookData.title || !bookData.author) return;

    const book: Book = {
        id: Date.now().toString() + Math.random().toString().slice(2,5),
        title: bookData.title,
        author: bookData.author,
        isbn: bookData.isbn,
        publisher: bookData.publisher,
        year: bookData.year,
        type: (bookData.type as 'Physical' | 'E-Book') || 'Physical',
        status: (bookData.status as BookStatus) || BookStatus.UNREAD,
        addedAt: Date.now(),
        coverUrl: bookData.coverUrl
    };

    const updated = [book, ...books];
    setBooks(updated);
    StorageService.saveBooks(updated);
  };

  const resetForm = () => {
    setNewBook({ title: '', author: '', type: 'Physical', status: BookStatus.UNREAD, coverUrl: '' });
  };

  const requestDelete = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setBookToDelete(id);
  };

  const confirmDelete = () => {
    if (bookToDelete) {
        const updated = books.filter(b => b.id !== bookToDelete);
        setBooks(updated);
        StorageService.saveBooks(updated);
        setBookToDelete(null);
    }
  };

  const handleOnlineSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if(searchMode !== 'Internet' || !search.trim()) return;

    setIsSearchingOnline(true);
    setOnlineResults([]);
    const results = await searchOnlineContent(search, 'book');
    setIsSearchingOnline(false);

    if(Array.isArray(results) && results.length > 0) {
        setOnlineResults(results);
    } else {
        alert("İnternette kitap bulunamadı veya bir hata oluştu.");
    }
  };

  const quickAdd = (result: any) => {
      addBook({
          title: result.title,
          author: result.author,
          year: result.year,
          publisher: result.publisher,
          coverUrl: result.coverUrl,
          status: BookStatus.UNREAD,
          type: 'Physical'
      });
      alert(`${result.title} kütüphaneye eklendi!`);
  };

  const filteredBooks = books.filter(b => 
    b.title.toLowerCase().includes(search.toLowerCase()) || 
    b.author.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto min-h-screen flex flex-col bg-gray-50/50">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="flex items-center text-gray-600 hover:text-gray-900 transition-colors">
          <ArrowLeft className="mr-2" size={20} /> Geri Dön
        </button>
        <button 
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
        >
          <Plus size={18} /> Manuel Ekle
        </button>
      </div>

      {/* Gemini Style Search Hero */}
      <div className="flex flex-col items-center justify-center mb-8 transition-all duration-500 ease-in-out">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
             <BookIcon size={32} className="text-blue-500" />
             Kütüphanem
        </h1>
        
        <div className="w-full max-w-2xl relative group z-10">
            <div className={`absolute inset-0 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-2xl blur opacity-20 group-hover:opacity-40 transition-opacity`}></div>
            <form onSubmit={handleOnlineSearch} className="relative bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden flex items-center p-2">
                <Search className="text-gray-400 ml-3" size={24} />
                <input 
                    type="text"
                    placeholder={searchMode === 'Internet' ? "İnternette ara..." : "Kütüphanende ara..."}
                    className="flex-1 px-4 py-3 text-lg outline-none text-gray-700 bg-transparent"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                 {isSearchingOnline && <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full mr-4"></div>}
            </form>
            
            {/* Search Toggle Pill */}
            <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 bg-gray-200/50 p-1 rounded-full flex gap-1 backdrop-blur-sm z-20">
                 <button 
                    onClick={() => { setSearchMode('Library'); setOnlineResults([]); }}
                    className={`px-4 py-1 rounded-full text-sm font-medium transition-all ${searchMode === 'Library' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                 >
                    <div className="flex items-center gap-2"><LibraryIcon size={14}/> Kütüphane</div>
                 </button>
                 <button 
                    onClick={() => setSearchMode('Internet')}
                    className={`px-4 py-1 rounded-full text-sm font-medium transition-all ${searchMode === 'Internet' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                 >
                    <div className="flex items-center gap-2"><Globe size={14}/> İnternet</div>
                 </button>
            </div>
        </div>
      </div>

      {/* Online Search Results */}
      {searchMode === 'Internet' && onlineResults.length > 0 && (
          <div className="mt-12 mb-8">
              <h2 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
                  <Globe size={18} /> İnternet Sonuçları
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {onlineResults.map((result, idx) => (
                      <div key={idx} className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm flex gap-4 hover:shadow-md transition-shadow">
                          <div className="w-16 h-24 bg-gray-200 rounded shrink-0 overflow-hidden">
                              {result.coverUrl ? <img src={result.coverUrl} className="w-full h-full object-cover"/> : <BookIcon className="m-auto mt-8 text-gray-400"/>}
                          </div>
                          <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-gray-800 truncate" title={result.title}>{result.title}</h3>
                              <p className="text-sm text-gray-500 truncate">{result.author}</p>
                              <p className="text-xs text-gray-400 mt-1">{result.year} • {result.publisher}</p>
                              <button 
                                onClick={() => quickAdd(result)}
                                className="mt-2 text-xs bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white px-3 py-1.5 rounded-full font-medium transition-colors flex items-center gap-1 w-fit"
                              >
                                  <Plus size={12} /> Hızlı Ekle
                              </button>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {/* Local Library Grid */}
      {searchMode === 'Library' && (
        <div className="mt-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 pb-12">
            {filteredBooks.map(book => (
                <div key={book.id} className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden border border-gray-100 hover:-translate-y-1">
                    <div className="relative aspect-[2/3] bg-gray-100 overflow-hidden">
                        {book.coverUrl ? (
                            <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                                <BookIcon size={48} />
                            </div>
                        )}
                        {/* Overlay delete button (Hover only) */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3 p-4">
                            <button onClick={(e) => requestDelete(book.id, e)} className="bg-white/20 hover:bg-red-500 hover:text-white text-white rounded-full p-2 backdrop-blur-sm transition-colors">
                                <Trash2 size={20} />
                            </button>
                        </div>
                        <div className="absolute top-2 right-2 px-2 py-1 rounded text-xs font-bold bg-white/90 shadow-sm">
                            {book.status}
                        </div>
                    </div>
                    
                    <div className="p-4 flex-1 flex flex-col">
                        <div className="flex justify-between items-start mb-1">
                           <h3 className="font-bold text-gray-800 line-clamp-2">{book.title}</h3>
                           {/* Mobile Accessible Delete Button */}
                           <button onClick={(e) => requestDelete(book.id, e)} className="text-gray-300 hover:text-red-500 p-1 md:hidden">
                                <Trash2 size={16} />
                           </button>
                        </div>
                        <p className="text-sm text-gray-500 mb-2">{book.author}</p>
                        <div className="mt-auto flex items-center justify-between text-xs text-gray-400">
                            <span>{book.year}</span>
                            <span className="uppercase border border-gray-200 px-1 rounded">{book.type}</span>
                        </div>
                    </div>
                </div>
            ))}
            {filteredBooks.length === 0 && (
                 <div className="col-span-full text-center text-gray-400 mt-12">Kütüphanende bu kriterlere uygun kitap yok.</div>
            )}
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl animate-scale-in max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Manuel Kitap Ekle</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kitap Adı</label>
                <input 
                  required
                  className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                  value={newBook.title}
                  onChange={e => setNewBook({...newBook, title: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Yazar</label>
                <input 
                  required
                  className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                  value={newBook.author}
                  onChange={e => setNewBook({...newBook, author: e.target.value})}
                />
              </div>
               <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kapak Resmi URL</label>
                <input 
                  className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 text-xs font-mono"
                  value={newBook.coverUrl || ''}
                  onChange={e => setNewBook({...newBook, coverUrl: e.target.value})}
                  placeholder="https://..."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Yayınevi</label>
                  <input 
                    className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                    value={newBook.publisher || ''}
                    onChange={e => setNewBook({...newBook, publisher: e.target.value})}
                  />
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Yıl</label>
                  <input 
                    type="number"
                    className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                    value={newBook.year || ''}
                    onChange={e => setNewBook({...newBook, year: parseInt(e.target.value)})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tip</label>
                    <select 
                        className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                        value={newBook.type}
                        onChange={e => setNewBook({...newBook, type: e.target.value as any})}
                    >
                        <option value="Physical">Fiziksel</option>
                        <option value="E-Book">E-Kitap</option>
                    </select>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Durum</label>
                    <select 
                        className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                        value={newBook.status}
                        onChange={e => setNewBook({...newBook, status: e.target.value as any})}
                    >
                        {Object.values(BookStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">İptal</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {bookToDelete && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl animate-scale-in">
                  <div className="flex flex-col items-center text-center">
                      <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
                          <AlertTriangle size={24} />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Emin misin?</h3>
                      <p className="text-gray-500 mb-6">
                          Bu kitabı kütüphaneden kalıcı olarak silmek üzeresin.
                      </p>
                      <div className="flex gap-3 w-full">
                          <button 
                              onClick={() => setBookToDelete(null)}
                              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                          >
                              İptal
                          </button>
                          <button 
                              onClick={confirmDelete}
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

export default Library;