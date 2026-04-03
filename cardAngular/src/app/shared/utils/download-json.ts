/**
 * Télécharge un objet en fichier JSON (navigateur).
 */
export function downloadJsonFile(data: unknown, filenamePrefix: string): void {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  link.download = `${filenamePrefix}_${timestamp}.json`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
