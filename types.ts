export enum BookStatus {
  UNREAD = 'Okunmadı',
  READING = 'Okunuyor',
  READ = 'Okundu'
}

export interface Book {
  id: string;
  title: string;
  author: string;
  isbn?: string;
  publisher?: string;
  year?: number;
  type: 'Physical' | 'E-Book';
  status: BookStatus;
  addedAt: number;
  coverUrl?: string; 
}

export interface Movie {
  id: string;
  title: string;
  genre: string;
  year?: number;
  director?: string;
  watched: boolean;
  rating?: number;
  posterUrl?: string;
}

export interface StudySession {
  id: string;
  date: number; // timestamp
  durationSeconds: number;
  mode: 'Pomodoro' | 'Stopwatch';
  notes?: string;
  tags?: string[]; // Added tags for categorization
}

export interface FileSystemNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  fileType?: 'pdf' | 'doc' | 'img' | 'txt' | 'other';
  children?: FileSystemNode[];
  createdAt: number;
  dataUrl?: string; // For storing file content (Base64)
  size?: number;
}

export interface Course {
  id: string;
  title: string;
  keywords: string[]; 
  platform?: string; 
  progress: number; 
  notes: string;
  aiSummary?: string;
  fileSystem: FileSystemNode[]; 
}

export interface ArchiveItem {
  id: string;
  title: string;
  category: string;
  content?: string; 
  tags: string[];
  createdAt: number;
  year?: number; // Manual year for the item
  url?: string;
  // File attachment fields
  fileData?: string; // Base64 string
  fileName?: string;
  fileSize?: number;
}

export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
}

export enum View {
  DASHBOARD = 'DASHBOARD',
  LIBRARY = 'LIBRARY',
  MOVIES = 'MOVIES',
  STUDY = 'STUDY',
  ARCHIVE = 'ARCHIVE',
  COURSES = 'COURSES'
}

export interface ViewState {
  view: View;
  params?: any; 
}