import { Book, Movie, StudySession, Course, ArchiveItem, TodoItem } from '../types';

// --- WEB INDEXEDDB IMPLEMENTATION ---
const DB_NAME = 'MyLifeOS_Data_Storage';
const DB_VERSION = 1;
const STORES = ['books', 'movies', 'sessions', 'courses', 'archive', 'todos'];

const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = (e) => {
            const db = (e.target as IDBOpenDBRequest).result;
            STORES.forEach(storeName => {
                if (!db.objectStoreNames.contains(storeName)) {
                    db.createObjectStore(storeName, { keyPath: 'id' });
                }
            });
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

const getAllWeb = async <T>(storeName: string): Promise<T[]> => {
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, 'readonly');
            const store = tx.objectStore(storeName);
            const req = store.getAll();
            req.onsuccess = () => resolve(req.result || []);
            req.onerror = () => reject(req.error);
        });
    } catch (error) {
        console.error(`Error reading web DB ${storeName}:`, error);
        return [];
    }
};

const saveAllWeb = async <T extends {id: string}>(storeName: string, items: T[]): Promise<void> => {
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            const clearReq = store.clear();
            clearReq.onsuccess = () => {
                items.forEach(item => store.put(item));
            };
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    } catch (error) {
        console.error(`Error saving to web DB ${storeName}:`, error);
    }
};

export const StorageService = {
  getBooks: () => getAllWeb<Book>('books'),
  saveBooks: (items: Book[]) => saveAllWeb('books', items),

  getMovies: () => getAllWeb<Movie>('movies'),
  saveMovies: (items: Movie[]) => saveAllWeb('movies', items),

  getSessions: () => getAllWeb<StudySession>('sessions'),
  saveSessions: (items: StudySession[]) => saveAllWeb('sessions', items),

  getCourses: () => getAllWeb<Course>('courses'),
  saveCourses: (items: Course[]) => saveAllWeb('courses', items),

  getArchive: () => getAllWeb<ArchiveItem>('archive'),
  saveArchive: (items: ArchiveItem[]) => saveAllWeb('archive', items),

  getTodos: () => getAllWeb<TodoItem>('todos'),
  saveTodos: (items: TodoItem[]) => saveAllWeb('todos', items),
};