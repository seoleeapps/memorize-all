import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { Platform } from 'react-native';
import { State } from '../core/model';
export async function exportBackup(state: State) {
  const text = JSON.stringify(state, null, 2);
  const name = `memorize-all-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  if (Platform.OS === 'web') {
    const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } else {
    if (!(await Sharing.isAvailableAsync())) throw new Error('Sharing unavailable');
    const file = new File(Paths.cache, name);
    file.write(text);
    try {
      await Sharing.shareAsync(file.uri, { mimeType: 'application/json', UTI: 'public.json' });
    } finally {
      if (file.exists) file.delete();
    }
  }
}
export async function importBackup(): Promise<string | null> {
  if (Platform.OS === 'web') {
    const file = await new Promise<globalThis.File | null>((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json,application/json,text/plain';
      input.hidden = true;
      const done = (file: globalThis.File | null) => {
        input.remove();
        resolve(file);
      };
      input.addEventListener('change', () => done(input.files?.[0] ?? null), { once: true });
      input.addEventListener('cancel', () => done(null), { once: true });
      document.body.append(input);
      input.click();
    });
    if (!file) return null;
    if (file.size > 10_000_000) throw new Error('Backup too large');
    return file.text();
  }
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/json', 'text/plain'],
    copyToCacheDirectory: true,
  });
  if (result.canceled) return null;
  const asset = result.assets[0];
  if (asset.size && asset.size > 10_000_000) throw new Error('Backup too large');
  const file = new File(asset.uri);
  try {
    return await file.text();
  } finally {
    if (file.exists) file.delete();
  }
}
