export function Table({
  headers,
  rows,
}: {
  headers: string[];
  rows: { id: string; cells: (string | React.ReactNode)[] }[];
}) {
  return (
    <div className='overflow-x-auto'>
      <table className='w-full text-left border-collapse'>
        <thead>
          <tr className='border-b border-cream-mid'>
            {headers.map((h) => (
              <th
                key={h}
                className='pb-2 font-mono text-label uppercase tracking-[0.2em] text-navy/40 font-normal pr-6'
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className='border-b border-cream-mid/60 last:border-0'
            >
              {row.cells.map((cell, i) => (
                <td
                  key={i}
                  className='py-3 pr-6 font-serif text-sm text-navy font-light'
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
