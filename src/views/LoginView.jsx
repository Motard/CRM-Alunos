import { useEffect, useRef, useState } from 'react';

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
  const [charCount, setCharCount] = useState(0);

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
          setCharCount(0);
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
        setCharCount(0);
      } else if (e.key === 'Backspace') {
        inputRef.current = inputRef.current.slice(0, -1);
        setCharCount(inputRef.current.length);
      } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        inputRef.current += e.key;
        setCharCount(inputRef.current.length);
      }
    }

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', background: 'black', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <style>{`
        @keyframes cursor-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
      <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
        <span style={{ color: 'white', fontSize: '1.5rem', letterSpacing: '0.15em', fontFamily: 'monospace' }}>
          {'*'.repeat(charCount)}
        </span>
        <div style={{ width: '2px', height: '1.5rem', background: 'white', animation: 'cursor-blink 1s step-start infinite' }} />
      </div>
    </div>
  );
}
