import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { toast } from 'sonner';

interface AuditLog {
  id: string;
  action: string;
  table_name: string | null;
  record_id: string | null;
  created_at: string;
}

const PAGE_SIZE = 15;

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
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);

    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabase
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    // Server-side search filtering
    if (searchQuery.trim()) {
      const term = `%${searchQuery.trim()}%`;
      query = query.or(`action.ilike.${term},table_name.ilike.${term}`);
    }

    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      toast.error('Failed to fetch audit logs');
    } else {
      const normalizedLogs = (data ?? [])
        .map(normalizeAuditLog)
        .filter((log): log is AuditLog => log !== null);

      setLogs(normalizedLogs);
      setTotalCount(count ?? 0);
    }
    setIsLoading(false);
  }, [page, searchQuery]);

  useEffect(() => {
    void fetchLogs();
  }, [fetchLogs]);

  // Reset to page 1 when search changes
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setPage(1);
  };

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
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {totalCount} total record{totalCount !== 1 ? 's' : ''}
        </span>
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
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-8 text-muted-foreground">
                  No audit logs found
                </td>
              </tr>
            ) : (
              logs.map((log) => (
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

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, totalCount)} of {totalCount}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage(1)}
              disabled={page === 1 || isLoading}
              aria-label="First page"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || isLoading}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-3 text-sm font-medium">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || isLoading}
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage(totalPages)}
              disabled={page === totalPages || isLoading}
              aria-label="Last page"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
