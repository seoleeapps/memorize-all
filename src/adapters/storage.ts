import AsyncStorage from '@react-native-async-storage/async-storage';
import { Catalog, State, StoragePort } from '../core/model';
import { parseBackup } from '../core/learning';
export const STORAGE_KEY = 'memorize-all.state.v1';
export class LocalStorage implements StoragePort {
  constructor(private catalog: Catalog) {}
  async load() {
    const text = await AsyncStorage.getItem(STORAGE_KEY);
    return text === null ? null : parseBackup(text, this.catalog);
  }
  async save(state: State) {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }
}
