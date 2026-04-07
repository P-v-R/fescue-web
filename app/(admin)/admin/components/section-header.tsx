export function SectionHeader({
  label,
  title,
  description,
}: {
  label: string;
  title: string;
  description?: string;
}) {
  return (
    <div className='mb-5'>
      <p className='font-mono text-label uppercase tracking-[0.28em] text-gold mb-1'>
        {label}
      </p>
      <h2 className='font-serif text-xl font-light text-navy'>{title}</h2>
      {description && (
        <p className='font-mono text-label text-navy/50 mt-1 tracking-[0.1em]'>
          {description}
        </p>
      )}
    </div>
  );
}
