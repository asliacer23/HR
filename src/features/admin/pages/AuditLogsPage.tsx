import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { toast } from 'sonner';

interface AuditLog {
  id: string;
  action: string;
  table_name: string | null;
  record_id: string | null;
  created_at: string;
}

function asStringOrNull(value: unknown) {
  if (typeof value === 'string') {
    return value;
  }

  if (value === null || value === undefined) {
    return null;
  }

  return String(value);
}

function normalizeAuditLog(log: unknown): AuditLog | null {
  if (!log || typeof log !== 'object' || Array.isArray(log)) {
    return null;
  }

  const record = log as Record<string, unknown>;

  return {
    id: String(record.id ?? ''),
    action: asStringOrNull(record.action) ?? 'unknown',
    table_name:
      asStringOrNull(record.table_name) ??
      asStringOrNull(record.entity_type) ??
      asStringOrNull(record.module_key),
    record_id: asStringOrNull(record.record_id) ?? asStringOrNull(record.entity_id),
    created_at: asStringOrNull(record.created_at) ?? '',
  };
}

function formatRecordId(value: string | null) {
  if (!value) {
    return '-';
  }

  return value.slice(0, 8);
}

function formatTimestamp(value: string) {
  if (!value) {
    return '-';
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString();
}

export function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      toast.error('Failed to fetch audit logs');
    } else {
      const normalizedLogs = (data ?? [])
        .map(normalizeAuditLog)
        .filter((log): log is AuditLog => log !== null);

      setLogs(normalizedLogs);
    }
    setIsLoading(false);
  };

  const filteredLogs = logs.filter((log) =>
    log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.table_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1>Audit Logs</h1>
        <p>Track system activities and changes</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="card-elevated overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>Action</th>
              <th>Table</th>
              <th>Record ID</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={4} className="text-center py-8 text-muted-foreground">
                  Loading logs...
                </td>
              </tr>
            ) : filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-8 text-muted-foreground">
                  No audit logs found
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr key={log.id}>
                  <td className="font-medium">{log.action}</td>
                  <td>{log.table_name || '-'}</td>
                  <td className="font-mono text-xs">{formatRecordId(log.record_id)}</td>
                  <td>{formatTimestamp(log.created_at)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
