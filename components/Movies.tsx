import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Search, Clapperboard, Check, Trash2, Globe, Film, AlertTriangle } from 'lucide-react';
import { Movie } from '../types';
import { StorageService } from '../services/storage';
import { searchOnlineContent } from '../services/gemini';

interface MoviesProps {
  onBack: () => void;
}

const Movies: React.FC<MoviesProps> = ({ onBack }) => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [searchMode, setSearchMode] = useState<'Library' | 'Internet'>('Library');
  const [isSearchingOnline, setIsSearchingOnline] = useState(false);
  const [onlineResults, setOnlineResults] = useState<any[]>([]);
  const [movieToDelete, setMovieToDelete] = useState<string | null>(null);
  
  const [newMovie, setNewMovie] = useState<Partial<Movie>>({
    title: '', genre: '', watched: false, posterUrl: ''
  });

  useEffect(() => {
    StorageService.getMovies().then(setMovies);
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    addMovie(newMovie);
    setIsModalOpen(false);
    resetForm();
  };

  const addMovie = (movieData: Partial<Movie>) => {
    if (!movieData.title) return;

    const movie: Movie = {
      id: Date.now().toString() + Math.random().toString().slice(2,5),
      title: movieData.title,
      genre: movieData.genre || 'Genel',
      year: movieData.year,
      director: movieData.director,
      watched: movieData.watched || false,
      posterUrl: movieData.posterUrl
    };

    const updated = [movie, ...movies];
    setMovies(updated);
    StorageService.saveMovies(updated);
  }

  const resetForm = () => {
    setNewMovie({ title: '', genre: '', watched: false, posterUrl: '' });
  };

  const toggleWatched = (id: string) => {
    const updated = movies.map(m => m.id === id ? { ...m, watched: !m.watched } : m);
    setMovies(updated);
    StorageService.saveMovies(updated);
  };

  const requestDelete = (id: string, e?: React.MouseEvent) => {
    if(e) e.stopPropagation();
    setMovieToDelete(id);
  };

  const confirmDelete = () => {
    if (movieToDelete) {
        const updated = movies.filter(m => m.id !== movieToDelete);
        setMovies(updated);
        StorageService.saveMovies(updated);
        setMovieToDelete(null);
    }
  };

  const handleOnlineSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if(searchMode !== 'Internet' || !search.trim()) return;

    setIsSearchingOnline(true);
    setOnlineResults([]);
    const results = await searchOnlineContent(search, 'movie');
    setIsSearchingOnline(false);

    if(Array.isArray(results) && results.length > 0) {
        setOnlineResults(results);
    } else {
        alert("İnternette film bulunamadı.");
    }
  };

  const quickAdd = (result: any) => {
      addMovie({
          title: result.title,
          genre: result.genre,
          year: result.year,
          director: result.director,
          posterUrl: result.posterUrl,
          watched: false
      });
      alert(`${result.title} film odasına eklendi!`);
  };

  const filteredMovies = movies.filter(m => 
    m.title.toLowerCase().includes(search.toLowerCase()) || 
    m.genre.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto min-h-screen flex flex-col bg-gray-50/50">
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="flex items-center text-gray-600 hover:text-gray-900 transition-colors">
          <ArrowLeft className="mr-2" size={20} /> Geri Dön
        </button>
        <button 
           onClick={() => { resetForm(); setIsModalOpen(true); }}
           className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
        >
          <Plus size={18} /> Manuel Ekle
        </button>
      </div>

       {/* Gemini Style Search Hero */}
      <div className="flex flex-col items-center justify-center mb-8 transition-all duration-500 ease-in-out">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
             <Clapperboard size={32} className="text-red-500" />
             Film Odası
        </h1>
        
        <div className="w-full max-w-2xl relative group z-10">
            <div className={`absolute inset-0 bg-gradient-to-r from-red-100 to-orange-100 rounded-2xl blur opacity-20 group-hover:opacity-40 transition-opacity`}></div>
            <form onSubmit={handleOnlineSearch} className="relative bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden flex items-center p-2">
                <Search className="text-gray-400 ml-3" size={24} />
                <input 
                    type="text"
                    placeholder={searchMode === 'Internet' ? "İnternette film ara..." : "Arşivde ara..."}
                    className="flex-1 px-4 py-3 text-lg outline-none text-gray-700 bg-transparent"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                 {isSearchingOnline && <div className="animate-spin h-5 w-5 border-2 border-red-500 border-t-transparent rounded-full mr-4"></div>}
            </form>
            
            {/* Search Toggle Pill */}
            <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 bg-gray-200/50 p-1 rounded-full flex gap-1 backdrop-blur-sm z-20">
                 <button 
                    onClick={() => { setSearchMode('Library'); setOnlineResults([]); }}
                    className={`px-4 py-1 rounded-full text-sm font-medium transition-all ${searchMode === 'Library' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                 >
                    <div className="flex items-center gap-2"><Film size={14}/> Arşiv</div>
                 </button>
                 <button 
                    onClick={() => setSearchMode('Internet')}
                    className={`px-4 py-1 rounded-full text-sm font-medium transition-all ${searchMode === 'Internet' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                 >
                    <div className="flex items-center gap-2"><Globe size={14}/> İnternet</div>
                 </button>
            </div>
        </div>
      </div>

      {/* Online Results */}
      {searchMode === 'Internet' && onlineResults.length > 0 && (
          <div className="mt-12 mb-8">
              <h2 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
                  <Globe size={18} /> İnternet Sonuçları
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {onlineResults.map((result, idx) => (
                      <div key={idx} className="bg-white p-4 rounded-xl border border-red-100 shadow-sm flex gap-4 hover:shadow-md transition-shadow">
                          <div className="w-16 h-24 bg-gray-200 rounded shrink-0 overflow-hidden">
                              {result.posterUrl ? <img src={result.posterUrl} className="w-full h-full object-cover"/> : <Clapperboard className="m-auto mt-8 text-gray-400"/>}
                          </div>
                          <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-gray-800 truncate" title={result.title}>{result.title}</h3>
                              <p className="text-sm text-gray-500 truncate">{result.director}</p>
                              <p className="text-xs text-gray-400 mt-1">{result.year} • {result.genre}</p>
                              <button 
                                onClick={() => quickAdd(result)}
                                className="mt-2 text-xs bg-red-50 text-red-600 hover:bg-red-600 hover:text-white px-3 py-1.5 rounded-full font-medium transition-colors flex items-center gap-1 w-fit"
                              >
                                  <Plus size={12} /> Hızlı Ekle
                              </button>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {/* Local Movies */}
      {searchMode === 'Library' && (
        <div className="mt-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 pb-12">
            {filteredMovies.map(movie => (
            <div key={movie.id} className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden border border-gray-100 hover:-translate-y-1">
                <div className="relative aspect-[2/3] bg-gray-900 overflow-hidden">
                        {movie.posterUrl ? (
                            <img src={movie.posterUrl} alt={movie.title} className={`w-full h-full object-cover transition-opacity ${movie.watched ? 'opacity-50 grayscale' : ''}`} />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-700 bg-gray-200">
                                <Clapperboard size={48} />
                            </div>
                        )}
                        {/* Overlay delete for hover */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3 p-4">
                            <button onClick={(e) => requestDelete(movie.id, e)} className="bg-white/20 hover:bg-red-500 hover:text-white text-white rounded-full p-2 backdrop-blur-sm transition-colors">
                                <Trash2 size={20} />
                            </button>
                        </div>
                        {movie.watched && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="bg-green-500/80 text-white px-3 py-1 rounded-full flex items-center gap-1 backdrop-blur-sm shadow-lg transform -rotate-12 border border-white/20">
                                    <Check size={16} strokeWidth={3} />
                                    <span className="font-bold tracking-wide">İZLENDİ</span>
                                </div>
                            </div>
                        )}
                </div>

                <div className="p-4 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-1">
                    <h3 className="text-lg font-bold text-gray-800 line-clamp-1">{movie.title}</h3>
                    {/* Mobile accessible delete button */}
                    <button onClick={(e) => requestDelete(movie.id, e)} className="text-gray-300 hover:text-red-500 p-1 md:hidden">
                        <Trash2 size={16} />
                    </button>
                </div>
                <div className="text-sm text-gray-500 mb-3 flex items-center gap-2">
                    <span>{movie.year}</span>
                    <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                    <span className="truncate">{movie.genre}</span>
                </div>
                
                <button 
                    onClick={() => toggleWatched(movie.id)}
                    className={`mt-auto w-full py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-colors border
                    ${movie.watched 
                        ? 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100' 
                        : 'bg-red-50 text-red-600 border-red-100 hover:bg-red-100'}
                    `}
                >
                    {movie.watched ? 'Tekrar İzlenecek' : 'İzlendi İşaretle'}
                </button>
                </div>
            </div>
            ))}
            {filteredMovies.length === 0 && (
                <div className="col-span-full text-center text-gray-400 mt-12">Arşivde bu kriterlere uygun film yok.</div>
            )}
        </div>
      )}
      
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl animate-scale-in max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Manuel Film Ekle</h2>
            <form onSubmit={handleSave} className="space-y-4">
               {newMovie.posterUrl && (
                  <div className="w-24 h-36 mx-auto bg-gray-100 rounded-lg overflow-hidden shadow-md mb-4">
                      <img src={newMovie.posterUrl} alt="Poster" className="w-full h-full object-cover" />
                  </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Film Adı</label>
                <input 
                  required
                  className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-red-500"
                  value={newMovie.title}
                  onChange={e => setNewMovie({...newMovie, title: e.target.value})}
                />
              </div>
               <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Poster URL</label>
                <input 
                  className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-red-500 text-xs"
                  value={newMovie.posterUrl || ''}
                  onChange={e => setNewMovie({...newMovie, posterUrl: e.target.value})}
                  placeholder="https://..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tür</label>
                   <input 
                    className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-red-500"
                    value={newMovie.genre}
                    onChange={e => setNewMovie({...newMovie, genre: e.target.value})}
                  />
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Yıl</label>
                  <input 
                    type="number"
                    className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-red-500"
                    value={newMovie.year || ''}
                    onChange={e => setNewMovie({...newMovie, year: parseInt(e.target.value)})}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">İptal</button>
                <button type="submit" className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {movieToDelete && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl animate-scale-in">
                  <div className="flex flex-col items-center text-center">
                      <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
                          <AlertTriangle size={24} />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Emin misin?</h3>
                      <p className="text-gray-500 mb-6">
                          Bu filmi arşivden kalıcı olarak silmek üzeresin.
                      </p>
                      <div className="flex gap-3 w-full">
                          <button 
                              onClick={() => setMovieToDelete(null)}
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

export default Movies;