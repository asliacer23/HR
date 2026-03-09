import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
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

  useEffect(() => {
    fetchPositions();
  }, []);

  const fetchPositions = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('positions')
      .select('*, departments(name)')
      .order('title');

    if (error) {
      toast.error('Failed to fetch positions');
    } else {
      setPositions(data || []);
    }
    setIsLoading(false);
  };

  const filteredPositions = positions.filter(pos =>
    pos.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatSalary = (amount: number | null) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount);
  };

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
                    {formatSalary(pos.min_salary)} - {formatSalary(pos.max_salary)}
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
      </div>
    </div>
  );
}
