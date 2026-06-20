import { useEffect, useRef } from 'react';

const LOCKOUT_KEY = 'login_lockout';

function getLockedUntil() {
  try {
    const v = localStorage.getItem(LOCKOUT_KEY);
    return v ? parseInt(v, 10) : 0;
  } catch { return 0; }
}

export default function LoginView({ onSuccess }) {
  const inputRef = useRef('');
  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;

  useEffect(() => {
    function isLocked() {
      return Date.now() < getLockedUntil();
    }

    async function submit() {
      const code = inputRef.current;
      if (!code) return;
      inputRef.current = '';

      try {
        const res = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        });

        if (res.ok) {
          const { token } = await res.json();
          sessionStorage.setItem('token', token);
          localStorage.removeItem(LOCKOUT_KEY);
          onSuccessRef.current();
          return;
        }

        if (res.status === 429) {
          const { lockedUntil } = await res.json();
          localStorage.setItem(LOCKOUT_KEY, String(lockedUntil));
        }
      } catch {}
    }

    function onKey(e) {
      if (isLocked()) return;
      if (e.key === 'Enter') {
        submit();
      } else if (e.key === 'Backspace') {
        inputRef.current = inputRef.current.slice(0, -1);
      } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        inputRef.current += e.key;
      }
    }

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return <div style={{ width: '100vw', height: '100vh', background: 'black' }} />;
}
