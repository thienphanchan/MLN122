// Backend giả cho localStorage: một bản trong bộ nhớ và một bản luôn ném lỗi.
export function memoryBackend(initial = {}) {
  const map = new Map(Object.entries(initial));
  return {
    map,
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => { map.set(key, String(value)); },
    removeItem: (key) => { map.delete(key); },
  };
}

export function throwingBackend() {
  const fail = () => { throw new Error('SecurityError: storage is disabled'); };
  return { getItem: fail, setItem: fail, removeItem: fail };
}
