'use client';

import { useState, useTransition, useEffect, useRef } from 'react';

export function useActionState() {
  const [message, setMessage] = useState<{
    text: string;
    isError: boolean;
  } | null>(null);
  const [isPending, startTransition] = useTransition();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, []);

  function run(action: () => Promise<{ error?: string; success?: string }>) {
    startTransition(async () => {
      try {
        const result = await action();
        if (result.error) setMessage({ text: result.error, isError: true });
        else if (result.success)
          setMessage({ text: result.success, isError: false });
      } catch {
        setMessage({ text: 'Something went wrong. Please try again.', isError: true });
      }
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setMessage(null), 4000);
    });
  }

  return { message, isPending, run };
}
