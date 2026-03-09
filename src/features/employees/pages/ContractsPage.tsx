import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Search, Eye, Edit2, Trash2, Loader2, Plus } from 'lucide-react';
import { CONTRACT_TYPE_LABELS, ContractType, CONTRACT_TYPE_LABELS as CONTRACT_TYPES } from '@/lib/constants';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Contract {
  id: string;
  employee_id: string;
  contract_type: ContractType;
  start_date: string;
  end_date: string | null;
  salary: number;
  is_current: boolean;
  terms: string | null;
  created_at: string;
  employees?: {
    profiles?: {
      first_name: string;
      last_name: string;
      email: string;
    };
  };
}

interface Contract {
  id: string;
  employee_id: string;
  contract_type: ContractType;
  start_date: string;
  end_date: string | null;
  salary: number;
  is_current: boolean;
  terms: string | null;
  created_at: string;
  employees?: {
    profiles?: {
      first_name: string;
      last_name: string;
      email: string;
    };
  };
}

export function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [editFormData, setEditFormData] = useState({
    contract_type: 'full_time' as ContractType,
    start_date: '',
    end_date: '',
    salary: '',
    terms: '',
    is_current: true,
  });

  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
    setIsLoading(true);
    try {
      // First fetch contracts with employee info
      const { data: contractsData, error: contractsError } = await supabase
        .from('employment_contracts')
        .select('*')
        .order('created_at', { ascending: false });

      if (contractsError) {
        toast.error('Failed to fetch contracts');
        setIsLoading(false);
        return;
      }

      // Then fetch employee and profile data
      const { data: employeesData } = await supabase
        .from('employees')
        .select('id, user_id');

      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, email');

      // Combine the data
      const contractsWithDetails = (contractsData || []).map(contract => {
        const employee = (employeesData || []).find(e => e.id === contract.employee_id);
        const profile = (profilesData || []).find(p => p.user_id === employee?.user_id);

        return {
          ...contract,
          employees: {
            user_id: employee?.user_id,
            profiles: profile,
          },
        };
      });

      setContracts(contractsWithDetails);
    } catch (error) {
      console.error('Error fetching contracts:', error);
      toast.error('Failed to fetch contracts');
    }
    setIsLoading(false);
  };

  const handleViewDetails = (contract: Contract) => {
    setSelectedContract(contract);
    setIsDetailOpen(true);
  };

  const handleEdit = (contract: Contract) => {
    setSelectedContract(contract);
    setEditFormData({
      contract_type: contract.contract_type,
      start_date: contract.start_date,
      end_date: contract.end_date || '',
      salary: contract.salary.toString(),
      terms: contract.terms || '',
      is_current: contract.is_current,
    });
    setIsEditOpen(true);
  };

  const handleSaveContract = async () => {
    if (!selectedContract || !editFormData.salary) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSaving(true);
    const { error } = await supabase
      .from('employment_contracts')
      .update({
        contract_type: editFormData.contract_type,
        start_date: editFormData.start_date,
        end_date: editFormData.end_date || null,
        salary: parseFloat(editFormData.salary),
        terms: editFormData.terms || null,
        is_current: editFormData.is_current,
      })
      .eq('id', selectedContract.id);

    if (error) {
      toast.error('Failed to update contract');
    } else {
      toast.success('Contract updated successfully');
      setIsEditOpen(false);
      setSelectedContract(null);
      fetchContracts();
    }
    setIsSaving(false);
  };

  const handleDeleteContract = async () => {
    if (!selectedContract || !confirm('Are you sure you want to delete this contract?')) return;

    setIsDeleting(true);
    const { error } = await supabase
      .from('employment_contracts')
      .delete()
      .eq('id', selectedContract.id);

    if (error) {
      toast.error('Failed to delete contract');
    } else {
      toast.success('Contract deleted successfully');
      setIsDetailOpen(false);
      setSelectedContract(null);
      fetchContracts();
    }
    setIsDeleting(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1>Employment Contracts</h1>
        <p>View and manage employment contracts</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search contracts..."
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
              <th>Employee</th>
              <th>Contract Type</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Salary</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-muted-foreground">
                  Loading contracts...
                </td>
              </tr>
            ) : contracts.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-muted-foreground">
                  No contracts found
                </td>
              </tr>
            ) : (
              contracts.map((contract) => (
                <tr key={contract.id}>
                  <td className="font-medium">
                    {contract.employees?.profiles?.first_name} {contract.employees?.profiles?.last_name}
                  </td>
                  <td>{CONTRACT_TYPE_LABELS[contract.contract_type]}</td>
                  <td>{new Date(contract.start_date).toLocaleDateString()}</td>
                  <td>{contract.end_date ? new Date(contract.end_date).toLocaleDateString() : 'Ongoing'}</td>
                  <td>{formatCurrency(contract.salary)}</td>
                  <td>
                    <Badge className={contract.is_current ? 'status-active' : 'bg-muted'}>
                      {contract.is_current ? 'Current' : 'Expired'}
                    </Badge>
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(contract)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(contract)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedContract(contract);
                          handleDeleteContract();
                        }}
                        disabled={isDeleting}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* View Details Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Contract Details</DialogTitle>
          </DialogHeader>
          {selectedContract && (
            <div className="space-y-6">
              <div className="bg-muted p-4 rounded-lg space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Employee</p>
                  <p className="font-medium">
                    {selectedContract.employees?.profiles?.first_name} {selectedContract.employees?.profiles?.last_name}
                  </p>
                  <p className="text-xs text-muted-foreground">{selectedContract.employees?.profiles?.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Contract Type</p>
                  <p className="font-medium">{CONTRACT_TYPE_LABELS[selectedContract.contract_type]}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Start Date</p>
                    <p className="font-medium">{new Date(selectedContract.start_date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">End Date</p>
                    <p className="font-medium">{selectedContract.end_date ? new Date(selectedContract.end_date).toLocaleDateString() : 'Ongoing'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Monthly Salary</p>
                    <p className="font-medium">{formatCurrency(selectedContract.salary)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge className={selectedContract.is_current ? 'status-active' : 'bg-muted'}>
                      {selectedContract.is_current ? 'Current' : 'Expired'}
                    </Badge>
                  </div>
                </div>
              </div>

              {selectedContract.terms && (
                <div className="border-t pt-4">
                  <p className="text-sm font-medium mb-2">Terms & Conditions</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedContract.terms}</p>
                </div>
              )}

              <div className="flex gap-2 justify-end border-t pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsDetailOpen(false)}
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    setIsDetailOpen(false);
                    handleEdit(selectedContract);
                  }}
                >
                  <Edit2 className="mr-2 h-4 w-4" />
                  Edit Contract
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteContract}
                  disabled={isDeleting}
                >
                  {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                  Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Contract Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Contract</DialogTitle>
          </DialogHeader>
          {selectedContract && (
            <div className="space-y-4">
              <div className="bg-muted p-3 rounded text-sm">
                <p className="text-muted-foreground">
                  {selectedContract.employees?.profiles?.first_name} {selectedContract.employees?.profiles?.last_name}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Contract Type</Label>
                <Select
                  value={editFormData.contract_type}
                  onValueChange={(v) => setEditFormData({ ...editFormData, contract_type: v as ContractType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CONTRACT_TYPES).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={editFormData.start_date}
                    onChange={(e) => setEditFormData({ ...editFormData, start_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Date (Optional)</Label>
                  <Input
                    type="date"
                    value={editFormData.end_date}
                    onChange={(e) => setEditFormData({ ...editFormData, end_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Monthly Salary (PHP)</Label>
                <Input
                  type="number"
                  placeholder="e.g., 35000"
                  value={editFormData.salary}
                  onChange={(e) => setEditFormData({ ...editFormData, salary: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Terms & Conditions</Label>
                <Textarea
                  placeholder="Enter contract terms..."
                  value={editFormData.terms}
                  onChange={(e) => setEditFormData({ ...editFormData, terms: e.target.value })}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editFormData.is_current}
                    onChange={(e) => setEditFormData({ ...editFormData, is_current: e.target.checked })}
                    className="rounded"
                  />
                  <span>Mark as Current</span>
                </Label>
              </div>

              <div className="flex gap-2 justify-end border-t pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsEditOpen(false)}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveContract}
                  disabled={isSaving}
                  className="btn-primary-gradient"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Edit2 className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
