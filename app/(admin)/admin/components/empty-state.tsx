export function EmptyState({ text }: { text: string }) {
  return (
    <div className='py-10 text-center border border-cream-mid bg-white'>
      <p className='font-mono text-label uppercase tracking-[0.2em] text-sand'>
        {text}
      </p>
    </div>
  );
}
