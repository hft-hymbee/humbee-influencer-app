/**
 * Holds a value still until it stops changing.
 *
 * Used for the address search box, where the cost is not a render but a BILLABLE GOOGLE
 * REQUEST per keystroke. 300 ms is the server's own recommendation: shorter and a normal typing
 * speed slips through, longer and the list feels stuck.
 */
import { useEffect, useState } from 'react';

export function useDebounced<T>(value: T, delayMs: number): T {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setSettled(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return settled;
}
