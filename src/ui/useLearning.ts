import {
  createContext,
  createElement,
  ReactNode,
  useContext,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { getLocales } from 'expo-localization';
import { LocalStorage } from '../adapters/storage';
import { initialState, State } from '../core/model';
import { catalog } from '../content';
const storage = new LocalStorage(catalog);
function useLearningStore() {
  const [state, setState] = useState<State | null>(null);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  const current = useRef<State | null>(null);
  const locked = useRef(false);
  const load = useCallback(
    () =>
      storage
        .load()
        .then((saved) => {
          const next = saved ?? initialState(getLocales()[0]?.languageCode === 'ko' ? 'ko' : 'en');
          current.current = next;
          setState(next);
          setError(false);
        })
        .catch(() => setError(true)),
    [],
  );
  useEffect(() => {
    void load();
  }, [load]);
  async function commit(change: (state: State) => State) {
    if (locked.current || !current.current) return false;
    locked.current = true;
    setBusy(true);
    setError(false);
    try {
      const next = change(current.current);
      await storage.save(next);
      current.current = next;
      setState(next);
      return true;
    } catch {
      setError(true);
      return false;
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }
  return { state, error, busy, commit, load };
}

const LearningContext = createContext<ReturnType<typeof useLearningStore> | null>(null);
export function LearningProvider({ children }: { children: ReactNode }) {
  return createElement(LearningContext.Provider, { value: useLearningStore() }, children);
}
export function useLearning() {
  const value = useContext(LearningContext);
  if (!value) throw new Error('LearningProvider missing');
  return value;
}
