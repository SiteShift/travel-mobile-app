import AsyncStorage from '@react-native-async-storage/async-storage';
import type { 
  User, Trip, Entry, Media, EntryDraft, OfflineAction, 
  SyncStatus, ConflictResolution 
} from '../types';
import { StorageKeys } from '../types';

// Storage Manager Class
export class StorageManager {
  private static instance: StorageManager;
  
  public static getInstance(): StorageManager {
    if (!StorageManager.instance) {
      StorageManager.instance = new StorageManager();
    }
    return StorageManager.instance;
  }

  // User Data Management
  async saveUser(user: User): Promise<void> {
    try {
      await AsyncStorage.setItem(StorageKeys.USER_DATA, JSON.stringify(user));
    } catch (error) {
      console.error('Failed to save user data:', error);
      throw new Error('Failed to save user data');
    }
  }

  async getUser(): Promise<User | null> {
    try {
      const userData = await AsyncStorage.getItem(StorageKeys.USER_DATA);
      if (userData) {
        const user = JSON.parse(userData);
        // Convert date strings back to Date objects
        this.convertStringsToDates(user, ['joinDate', 'lastActiveAt']);
        return user;
      }
      return null;
    } catch (error) {
      console.error('Failed to get user data:', error);
      return null;
    }
  }

  // Trip Data Management
  async saveTrips(trips: Trip[]): Promise<void> {
    try {
      const serializedTrips = trips.map(trip => ({
        ...trip,
        startDate: trip.startDate.toISOString(),
        endDate: trip.endDate.toISOString(),
        createdAt: trip.createdAt.toISOString(),
        updatedAt: trip.updatedAt.toISOString(),
      }));
      await AsyncStorage.setItem(StorageKeys.TRIPS, JSON.stringify(serializedTrips));
    } catch (error) {
      console.error('Failed to save trips:', error);
      throw new Error('Failed to save trips');
    }
  }

  async getTrips(): Promise<Trip[]> {
    try {
      const tripsData = await AsyncStorage.getItem(StorageKeys.TRIPS);
      if (tripsData) {
        const trips = JSON.parse(tripsData);
        return trips.map((trip: any) => ({
          ...trip,
          startDate: new Date(trip.startDate),
          endDate: new Date(trip.endDate),
          createdAt: new Date(trip.createdAt),
          updatedAt: new Date(trip.updatedAt),
        }));
      }
      return [];
    } catch (error) {
      console.error('Failed to get trips:', error);
      return [];
    }
  }

  async saveTrip(trip: Trip): Promise<void> {
    try {
      const trips = await this.getTrips();
      const existingIndex = trips.findIndex(t => t.id === trip.id);
      
      if (existingIndex >= 0) {
        trips[existingIndex] = trip;
      } else {
        trips.push(trip);
      }
      
      await this.saveTrips(trips);
    } catch (error) {
      console.error('Failed to save trip:', error);
      throw error;
    }
  }

  async deleteTrip(tripId: string): Promise<void> {
    try {
      const trips = await this.getTrips();
      const filteredTrips = trips.filter(t => t.id !== tripId);
      await this.saveTrips(filteredTrips);
      
      // Also delete related entries
      const entries = await this.getEntries();
      const filteredEntries = entries.filter(e => e.tripId !== tripId);
      await this.saveEntries(filteredEntries);
    } catch (error) {
      console.error('Failed to delete trip:', error);
      throw error;
    }
  }

  // Entry Data Management
  async saveEntries(entries: Entry[]): Promise<void> {
    try {
      const serializedEntries = entries.map(entry => ({
        ...entry,
        date: entry.date.toISOString(),
        createdAt: entry.createdAt.toISOString(),
        updatedAt: entry.updatedAt.toISOString(),
        publishedAt: entry.publishedAt?.toISOString(),
        lastViewedAt: entry.lastViewedAt?.toISOString(),
      }));
      await AsyncStorage.setItem(StorageKeys.ENTRIES, JSON.stringify(serializedEntries));
    } catch (error) {
      console.error('Failed to save entries:', error);
      throw new Error('Failed to save entries');
    }
  }

  async getEntries(): Promise<Entry[]> {
    try {
      const entriesData = await AsyncStorage.getItem(StorageKeys.ENTRIES);
      if (entriesData) {
        const entries = JSON.parse(entriesData);
        return entries.map((entry: any) => ({
          ...entry,
          date: new Date(entry.date),
          createdAt: new Date(entry.createdAt),
          updatedAt: new Date(entry.updatedAt),
          publishedAt: entry.publishedAt ? new Date(entry.publishedAt) : undefined,
          lastViewedAt: entry.lastViewedAt ? new Date(entry.lastViewedAt) : undefined,
        }));
      }
      return [];
    } catch (error) {
      console.error('Failed to get entries:', error);
      return [];
    }
  }

  async saveEntry(entry: Entry): Promise<void> {
    try {
      const entries = await this.getEntries();
      const existingIndex = entries.findIndex(e => e.id === entry.id);
      
      if (existingIndex >= 0) {
        entries[existingIndex] = entry;
      } else {
        entries.push(entry);
      }
      
      await this.saveEntries(entries);
    } catch (error) {
      console.error('Failed to save entry:', error);
      throw error;
    }
  }

  // Draft Management
  async saveDraft(draft: EntryDraft): Promise<void> {
    try {
      const drafts = await this.getDrafts();
      const existingIndex = drafts.findIndex(d => d.id === draft.id);
      
      const serializedDraft = {
        ...draft,
        lastSaved: draft.lastSaved.toISOString(),
        expiresAt: draft.expiresAt?.toISOString(),
      };
      
      const serializedDrafts = await AsyncStorage.getItem(StorageKeys.DRAFTS);
      const parsedDrafts = serializedDrafts ? JSON.parse(serializedDrafts) : [];
      
      if (existingIndex >= 0) {
        parsedDrafts[existingIndex] = serializedDraft;
      } else {
        parsedDrafts.push(serializedDraft);
      }
      
      await AsyncStorage.setItem(StorageKeys.DRAFTS, JSON.stringify(parsedDrafts));
    } catch (error) {
      console.error('Failed to save draft:', error);
      throw error;
    }
  }

  async getDrafts(): Promise<EntryDraft[]> {
    try {
      const draftsData = await AsyncStorage.getItem(StorageKeys.DRAFTS);
      if (draftsData) {
        const drafts = JSON.parse(draftsData);
        return drafts.map((draft: any) => ({
          ...draft,
          lastSaved: new Date(draft.lastSaved),
          expiresAt: draft.expiresAt ? new Date(draft.expiresAt) : undefined,
        }));
      }
      return [];
    } catch (error) {
      console.error('Failed to get drafts:', error);
      return [];
    }
  }

  async deleteDraft(draftId: string): Promise<void> {
    try {
      const drafts = await this.getDrafts();
      const filteredDrafts = drafts.filter(d => d.id !== draftId);
      await AsyncStorage.setItem(StorageKeys.DRAFTS, JSON.stringify(filteredDrafts));
    } catch (error) {
      console.error('Failed to delete draft:', error);
      throw error;
    }
  }

  // Offline Queue Management
  async addOfflineAction(action: OfflineAction): Promise<void> {
    try {
      const serializedAction = {
        ...action,
        timestamp: action.timestamp.toISOString(),
      };
      const queueData = await AsyncStorage.getItem(StorageKeys.OFFLINE_QUEUE);
      const queue = queueData ? JSON.parse(queueData) : [];
      queue.push(serializedAction);
      await AsyncStorage.setItem(StorageKeys.OFFLINE_QUEUE, JSON.stringify(queue));
    } catch (error) {
      console.error('Failed to add offline action:', error);
      throw error;
    }
  }

  async getOfflineQueue(): Promise<OfflineAction[]> {
    try {
      const queueData = await AsyncStorage.getItem(StorageKeys.OFFLINE_QUEUE);
      if (queueData) {
        const queue = JSON.parse(queueData);
        return queue.map((action: any) => ({
          ...action,
          timestamp: new Date(action.timestamp),
        }));
      }
      return [];
    } catch (error) {
      console.error('Failed to get offline queue:', error);
      return [];
    }
  }

  async removeOfflineAction(actionId: string): Promise<void> {
    try {
      const queue = await this.getOfflineQueue();
      const filteredQueue = queue.filter(action => action.id !== actionId);
      await AsyncStorage.setItem(StorageKeys.OFFLINE_QUEUE, JSON.stringify(filteredQueue));
    } catch (error) {
      console.error('Failed to remove offline action:', error);
      throw error;
    }
  }

  async clearOfflineQueue(): Promise<void> {
    try {
      await AsyncStorage.removeItem(StorageKeys.OFFLINE_QUEUE);
    } catch (error) {
      console.error('Failed to clear offline queue:', error);
      throw error;
    }
  }

  // Sync Status Management
  async saveSyncStatus(status: SyncStatus): Promise<void> {
    try {
      const serializedStatus = {
        ...status,
        lastSyncAt: status.lastSyncAt?.toISOString(),
        syncErrors: status.syncErrors.map(error => ({
          ...error,
          timestamp: error.timestamp.toISOString(),
        })),
        syncBatch: status.syncBatch ? {
          ...status.syncBatch,
          startedAt: status.syncBatch.startedAt.toISOString(),
        } : undefined,
      };
      await AsyncStorage.setItem(StorageKeys.SYNC_STATUS, JSON.stringify(serializedStatus));
    } catch (error) {
      console.error('Failed to save sync status:', error);
      throw error;
    }
  }

  async getSyncStatus(): Promise<SyncStatus | null> {
    try {
      const statusData = await AsyncStorage.getItem(StorageKeys.SYNC_STATUS);
      if (statusData) {
        const status = JSON.parse(statusData);
        return {
          ...status,
          lastSyncAt: status.lastSyncAt ? new Date(status.lastSyncAt) : undefined,
          syncErrors: status.syncErrors.map((error: any) => ({
            ...error,
            timestamp: new Date(error.timestamp),
          })),
          syncBatch: status.syncBatch ? {
            ...status.syncBatch,
            startedAt: new Date(status.syncBatch.startedAt),
          } : undefined,
        };
      }
      return null;
    } catch (error) {
      console.error('Failed to get sync status:', error);
      return null;
    }
  }

  // Conflict Resolution Management
  async saveConflictResolution(conflict: ConflictResolution): Promise<void> {
    try {
      const serializedConflict = {
        ...conflict,
        detectedAt: conflict.detectedAt.toISOString(),
        resolvedAt: conflict.resolvedAt?.toISOString(),
        localLastModified: conflict.localLastModified.toISOString(),
        remoteLastModified: conflict.remoteLastModified.toISOString(),
      };
      
      const conflictsData = await AsyncStorage.getItem(StorageKeys.CONFLICT_QUEUE);
      const conflicts = conflictsData ? JSON.parse(conflictsData) : [];
      const existingIndex = conflicts.findIndex((c: any) => c.id === conflict.id);
      
      if (existingIndex >= 0) {
        conflicts[existingIndex] = serializedConflict;
      } else {
        conflicts.push(serializedConflict);
      }
      
      await AsyncStorage.setItem(StorageKeys.CONFLICT_QUEUE, JSON.stringify(conflicts));
    } catch (error) {
      console.error('Failed to save conflict resolution:', error);
      throw error;
    }
  }

  async getConflictResolutions(): Promise<ConflictResolution[]> {
    try {
      const conflictsData = await AsyncStorage.getItem(StorageKeys.CONFLICT_QUEUE);
      if (conflictsData) {
        const conflicts = JSON.parse(conflictsData);
        return conflicts.map((conflict: any) => ({
          ...conflict,
          detectedAt: new Date(conflict.detectedAt),
          resolvedAt: conflict.resolvedAt ? new Date(conflict.resolvedAt) : undefined,
          localLastModified: new Date(conflict.localLastModified),
          remoteLastModified: new Date(conflict.remoteLastModified),
        }));
      }
      return [];
    } catch (error) {
      console.error('Failed to get conflict resolutions:', error);
      return [];
    }
  }

  // Cache Management
  async setCache(key: string, data: any, ttl?: number): Promise<void> {
    try {
      const cacheItem = {
        data,
        timestamp: Date.now(),
        ttl: ttl || 24 * 60 * 60 * 1000, // Default 24 hours
      };
      await AsyncStorage.setItem(`@cache/${key}`, JSON.stringify(cacheItem));
    } catch (error) {
      console.error('Failed to set cache:', error);
    }
  }

  async getCache(key: string): Promise<any | null> {
    try {
      const cacheData = await AsyncStorage.getItem(`@cache/${key}`);
      if (cacheData) {
        const cacheItem = JSON.parse(cacheData);
        const now = Date.now();
        
        // Check if cache has expired
        if (now - cacheItem.timestamp > cacheItem.ttl) {
          await this.removeCache(key);
          return null;
        }
        
        return cacheItem.data;
      }
      return null;
    } catch (error) {
      console.error('Failed to get cache:', error);
      return null;
    }
  }

  async removeCache(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(`@cache/${key}`);
    } catch (error) {
      console.error('Failed to remove cache:', error);
    }
  }

  async clearCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('@cache/'));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }

  // Utility Functions
  private convertStringsToDates(obj: any, dateFields: string[]): void {
    dateFields.forEach(field => {
      if (obj[field] && typeof obj[field] === 'string') {
        obj[field] = new Date(obj[field]);
      }
    });
  }

  // Data Migration
  async migrateData(fromVersion: string, toVersion: string): Promise<void> {
    try {
      console.log(`Migrating data from ${fromVersion} to ${toVersion}`);
      
      // Example migration logic
      if (fromVersion === '1.0.0' && toVersion === '1.1.0') {
        await this.migrateFrom1_0_0To1_1_0();
      }
      
      // Update version in storage
      await AsyncStorage.setItem(StorageKeys.APP_VERSION, toVersion);
    } catch (error) {
      console.error('Data migration failed:', error);
      throw error;
    }
  }

  private async migrateFrom1_0_0To1_1_0(): Promise<void> {
    // Example migration: Add new fields to existing data
    const trips = await this.getTrips();
    const migratedTrips = trips.map(trip => ({
      ...trip,
      // Add new fields with default values
      archived: trip.archived ?? false,
      tags: trip.tags ?? [],
    }));
    await this.saveTrips(migratedTrips);
  }

  // Backup and Restore
  async createBackup(): Promise<string> {
    try {
      const user = await this.getUser();
      const trips = await this.getTrips();
      const entries = await this.getEntries();
      const drafts = await this.getDrafts();
      
      const backup = {
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        data: {
          user,
          trips,
          entries,
          drafts,
        },
      };
      
      return JSON.stringify(backup);
    } catch (error) {
      console.error('Failed to create backup:', error);
      throw error;
    }
  }

  async restoreFromBackup(backupData: string): Promise<void> {
    try {
      const backup = JSON.parse(backupData);
      
      if (backup.data.user) {
        await this.saveUser(backup.data.user);
      }
      
      if (backup.data.trips) {
        await this.saveTrips(backup.data.trips);
      }
      
      if (backup.data.entries) {
        await this.saveEntries(backup.data.entries);
      }
      
      if (backup.data.drafts) {
        // Restore drafts individually to handle date conversion
        for (const draft of backup.data.drafts) {
          await this.saveDraft(draft);
        }
      }
      
      console.log('Backup restored successfully');
    } catch (error) {
      console.error('Failed to restore backup:', error);
      throw error;
    }
  }

  // Clear All Data
  async clearAllData(): Promise<void> {
    try {
      const keys = [
        StorageKeys.USER_DATA,
        StorageKeys.TRIPS,
        StorageKeys.ENTRIES,
        StorageKeys.MEDIA,
        StorageKeys.DRAFTS,
        StorageKeys.OFFLINE_QUEUE,
        StorageKeys.SYNC_STATUS,
        StorageKeys.CONFLICT_QUEUE,
      ];
      
      await AsyncStorage.multiRemove(keys);
      await this.clearCache();
      
      console.log('All data cleared');
    } catch (error) {
      console.error('Failed to clear all data:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const storage = StorageManager.getInstance();

// Helper functions for common operations
export const StorageHelpers = {
  // Auto-save drafts with debouncing
  createAutoSaver: (callback: () => void, delay: number = 2000) => {
    let timeoutId: NodeJS.Timeout;
    
    return () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(callback, delay);
    };
  },

  // Check storage space
  async getStorageInfo(): Promise<{ used: number; available: number }> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const items = await AsyncStorage.multiGet(keys);
      
      let totalSize = 0;
      items.forEach(([key, value]) => {
        if (value) {
          totalSize += new Blob([value]).size;
        }
      });
      
      return {
        used: totalSize,
        available: 50 * 1024 * 1024 - totalSize, // Assume 50MB limit
      };
    } catch (error) {
      console.error('Failed to get storage info:', error);
      return { used: 0, available: 0 };
    }
  },

  // Compress data before storage
  compressData: (data: any): string => {
    // Simple compression by removing whitespace
    return JSON.stringify(data);
  },

  // Decompress data after retrieval
  decompressData: (compressedData: string): any => {
    return JSON.parse(compressedData);
  },
}; 