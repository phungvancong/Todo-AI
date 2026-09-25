import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_NOTE_KEY = 'APP_NOTE_LIST';

export function useNotes() {
  const [noteList, setNoteList] = useState([]);

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    try {
      const savedNotesJson = await AsyncStorage.getItem(STORAGE_NOTE_KEY);
      if (savedNotesJson) {
        const parsedNotes = JSON.parse(savedNotesJson);
        if (Array.isArray(parsedNotes)) setNoteList(parsedNotes);
      }
    } catch (e) {
      console.log('Lỗi tải ghi chú:', e);
    }
  };

  const saveNotes = async (notes) => {
    try {
      setNoteList(notes);
      await AsyncStorage.setItem(STORAGE_NOTE_KEY, JSON.stringify(notes));
    } catch (e) {
      console.log('Lỗi lưu ghi chú:', e);
    }
  };

  const addNote = (text) => {
    const newNote = {
      id: Date.now().toString(),
      text,
      createdAt: new Date().toISOString(),
    };
    saveNotes([newNote, ...noteList]);
  };

  const deleteNote = (noteId) => {
    saveNotes(noteList.filter((n) => n.id !== noteId));
  };

  return { noteList, addNote, deleteNote };
}