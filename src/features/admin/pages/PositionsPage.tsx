import { formatCurrencyPHP } from '@/lib/utils';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Pencil, Trash2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { toast } from 'sonner';

interface Position {
  id: string;
  title: string;
  description: string | null;
  min_salary: number | null;
  max_salary: number | null;
  is_active: boolean;
  department_id: string | null;
  departments?: { name: string } | null;
}

export function PositionsPage() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Pagination State
  const PAGE_SIZE = 10;
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery.trim());
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const fetchPositions = useCallback(async () => {
    setIsLoading(true);

    let query = supabase
      .from('positions')
      .select('*, departments(name)', { count: 'exact' });

    if (debouncedSearchQuery) {
      query = query.ilike('title', `%${debouncedSearchQuery}%`);
    }

    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, error, count } = await query
      .order('title')
      .range(from, to);

    setTotalCount(count || 0);

    if (error) {
      toast.error('Failed to fetch positions');
    } else {
      setPositions((data as unknown as Position[]) || []);
    }
    setIsLoading(false);
  }, [debouncedSearchQuery, page]);

  useEffect(() => {
    void fetchPositions();
  }, [fetchPositions]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearchQuery]);

  const filteredPositions = positions; // server side filtering

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1>Positions</h1>
          <p>Manage job positions and titles</p>
        </div>
        <Button className="btn-primary-gradient">
          <Plus className="mr-2 h-4 w-4" />
          Add Position
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search positions..."
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
              <th>Title</th>
              <th>Department</th>
              <th>Salary Range</th>
              <th>Status</th>
              <th className="w-24">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-muted-foreground">
                  Loading positions...
                </td>
              </tr>
            ) : filteredPositions.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-muted-foreground">
                  No positions found
                </td>
              </tr>
            ) : (
              filteredPositions.map((pos) => (
                <tr key={pos.id}>
                  <td className="font-medium">{pos.title}</td>
                  <td>{pos.departments?.name || '-'}</td>
                  <td>
                    {pos.min_salary !== null ? formatCurrencyPHP(pos.min_salary, { maximumFractionDigits: 0 }) : '-'} - {pos.max_salary !== null ? formatCurrencyPHP(pos.max_salary, { maximumFractionDigits: 0 }) : '-'}
                  </td>
                  <td>
                    <Badge className={pos.is_active ? 'status-active' : 'bg-muted'}>
                      {pos.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {totalCount > 0 && (
          <div className="p-4 border-t flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, totalCount)} of {totalCount}
            </span>
            <div className="flex flex-wrap items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage(1)}
                disabled={page === 1 || isLoading}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || isLoading}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="px-3 text-sm font-medium">
                Page {page} of {Math.ceil(totalCount / PAGE_SIZE) || 1}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage((p) => Math.min(Math.ceil(totalCount / PAGE_SIZE) || 1, p + 1))}
                disabled={page === (Math.ceil(totalCount / PAGE_SIZE) || 1) || isLoading}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage(Math.ceil(totalCount / PAGE_SIZE) || 1)}
                disabled={page === (Math.ceil(totalCount / PAGE_SIZE) || 1) || isLoading}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

