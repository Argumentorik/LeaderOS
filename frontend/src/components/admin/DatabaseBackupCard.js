/**
 * DatabaseBackupCard — Admin lädt ein vollständiges, wiederherstellbares Backup
 * der (Produktions-)Datenbank direkt von der Live-Seite herunter.
 * Download läuft authentifiziert über axios (Cookie-Session) als Blob.
 */
import { useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Database, Download, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import api from '../../lib/api';
import logger from '../../lib/logger';

export const DatabaseBackupCard = ({ de = true }) => {
  const [status, setStatus] = useState('idle'); // idle | running | done | error
  const [error, setError] = useState('');

  const download = async () => {
    setStatus('running');
    setError('');
    try {
      const res = await api.get('/admin/backup/database', {
        responseType: 'blob',
        timeout: 0, // Backup kann groß sein — kein Timeout
      });
      const disposition = res.headers['content-disposition'] || '';
      const match = disposition.match(/filename="?([^"]+)"?/);
      const filename = match ? match[1] : `leaderos-backup-${Date.now()}.archive.gz`;

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setStatus('done');
    } catch (e) {
      logger.error('DB backup download failed', e);
      setError(de ? 'Backup fehlgeschlagen. Bitte erneut versuchen.' : 'Backup failed. Please retry.');
      setStatus('error');
    }
  };

  const running = status === 'running';

  return (
    <Card data-testid="db-backup-card">
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Database size={15} className="text-[#6B8A00] dark:text-[#BFFF00]" />
          <h3 className="text-sm font-black">{de ? 'Datenbank-Backup' : 'Database backup'}</h3>
        </div>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          {de
            ? 'Lädt einen vollständigen, wiederherstellbaren Dump der Datenbank herunter (mongodump-Archiv). Enthält alle Nutzer- und Zahlungsdaten — sicher aufbewahren.'
            : 'Downloads a full, restorable dump of the database (mongodump archive). Contains all user and payment data — store securely.'}
        </p>

        <Button
          onClick={download}
          disabled={running}
          className="w-full bg-[#BFFF00] text-black hover:bg-[#AEE800] font-bold"
          data-testid="db-backup-download-btn"
        >
          {running ? (
            <><Loader2 size={15} className="mr-2 animate-spin" /> {de ? 'Erstelle Backup…' : 'Creating backup…'}</>
          ) : (
            <><Download size={15} className="mr-2" /> {de ? 'Backup herunterladen' : 'Download backup'}</>
          )}
        </Button>

        {running && (
          <p className="text-[10px] text-muted-foreground" data-testid="db-backup-hint">
            {de ? 'Das kann je nach Datenmenge einige Sekunden dauern. Fenster bitte offen lassen.' : 'This may take a few seconds depending on data size. Keep this tab open.'}
          </p>
        )}
        {status === 'done' && (
          <div className="flex items-center gap-1.5 text-[11px] text-green-600 dark:text-green-400 font-semibold" data-testid="db-backup-success">
            <CheckCircle2 size={13} /> {de ? 'Backup heruntergeladen.' : 'Backup downloaded.'}
          </div>
        )}
        {status === 'error' && (
          <div className="flex items-center gap-1.5 text-[11px] text-red-600 dark:text-red-400 font-semibold" data-testid="db-backup-error">
            <AlertTriangle size={13} /> {error}
          </div>
        )}
        <p className="text-[10px] text-muted-foreground">
          {de ? 'Wiederherstellen: ' : 'Restore: '}
          <span className="font-mono">mongorestore --archive=datei.archive.gz --gzip</span>
        </p>
      </CardContent>
    </Card>
  );
};

export default DatabaseBackupCard;
