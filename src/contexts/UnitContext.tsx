import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { executeSqlAsync } from '../db/db';
import type { Unit } from '../utils/units';

type UnitContextType = {
  unit: Unit;
  setUnit: (u: Unit) => Promise<void>;
};

const UnitContext = createContext<UnitContextType>({
  unit: 'kg',
  setUnit: async () => {},
});

export function UnitProvider({ children }: { children: React.ReactNode }) {
  const [unit, setUnitState] = useState<Unit>('kg');

  useEffect(() => {
    (async () => {
      try {
        const res = await executeSqlAsync(
          `SELECT value FROM app_settings WHERE key='unit';`
        );
        if (res.rows.length) {
          setUnitState(res.rows.item(0).value as Unit);
        }
      } catch {}
    })();
  }, []);

  const setUnit = useCallback(async (u: Unit) => {
    setUnitState(u);
    await executeSqlAsync(
      `INSERT INTO app_settings(key, value) VALUES ('unit', ?)
       ON CONFLICT(key) DO UPDATE SET value=excluded.value;`,
      [u]
    );
  }, []);

  return (
    <UnitContext.Provider value={{ unit, setUnit }}>
      {children}
    </UnitContext.Provider>
  );
}

export function useUnit() {
  return useContext(UnitContext);
}
