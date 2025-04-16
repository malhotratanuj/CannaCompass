import { DatabaseStorage } from './databaseStorage';
import { setStorage } from './storage';

// Initialize the storage with DatabaseStorage
export function initializeStorage() {
  const databaseStorage = new DatabaseStorage();
  setStorage(databaseStorage);
}