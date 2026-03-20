import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Lock, Loader2, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { isSupabaseConfigured } from '@/integrations/supabase/client';
import {
  Alert,
  AlertDescription,
} from '@/components/ui/alert';

export function LoginForm() {
  const [email, setEmail] = useState('adminhr@gmail.com');
  const [password, setPassword] = useState('admin123');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await signIn(email, password);
    
    if (error) {
      toast.error(error.message);
      setIsLoading(false);
    } else {
      toast.success('Login successful!');
      navigate('/dashboard');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium text-foreground">
          Default Admin Email
        </Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            placeholder="Enter the seeded admin email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-10 h-11 bg-secondary/30 border-border focus:border-primary"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-sm font-medium text-foreground">
          Password
        </Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pl-10 pr-10 h-11 bg-secondary/30 border-border focus:border-primary"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <ShieldCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <AlertDescription className="text-sm text-blue-800 dark:text-blue-300 ml-2">
          {isSupabaseConfigured
            ? 'Default access is provisioned from the database seed. Self-service registration and email recovery are disabled for this build.'
            : 'Supabase publishable key is still missing in .env. Add the real key, restart the dev server, then log in with the seeded account.'}
        </AlertDescription>
      </Alert>

      <Button
        type="submit"
        className="w-full h-11 btn-primary-gradient font-semibold text-base"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Logging in...
          </>
        ) : (
          'Login'
        )}
      </Button>
    </form>
  );
}
