export function downloadCsv(filename: string, rows: Array<Record<string, string | number | null | undefined>>) {
  const headers = Object.keys(rows[0] ?? {});
  const escape = (value: string | number | null | undefined) => {
    const text = String(value ?? '');
    return `"${text.replace(/"/g, '""')}"`;
  };
  const csv = [headers.join(','), ...rows.map((row) => headers.map((header) => escape(row[header])).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
