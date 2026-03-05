import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { LogIn, UserPlus, KeyRound } from 'lucide-react';

type Mode = 'login' | 'signup' | 'forgot';

function translateError(message: string): string {
  if (message.includes('Invalid login credentials')) return 'Email ou senha incorretos.';
  if (message.includes('Email not confirmed')) return 'Email não confirmado. Verifique sua caixa de entrada.';
  if (message.includes('User already registered')) return 'Este email já está cadastrado.';
  if (message.includes('Password should be at least')) return 'A senha deve ter pelo menos 6 caracteres.';
  if (message.includes('Unable to validate email')) return 'Email inválido.';
  if (message.includes('rate limit')) return 'Muitas tentativas. Aguarde um momento.';
  if (message.includes('network') || message.includes('fetch')) return 'Erro de conexão. Verifique sua internet.';
  return message;
}

export default function AuthPage() {
  const { signIn, signUp, resetPassword, user } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  if (user) {
    navigate('/', { replace: true });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'forgot') {
        const { error } = await resetPassword(email);
        if (error) toast.error(translateError(error.message));
        else toast.success('Email de recuperação enviado!');
        setLoading(false);
        return;
      }

      if (mode === 'signup') {
        const { error } = await signUp(email, password);
        if (error) {
          toast.error(translateError(error.message));
        } else {
          toast.success('Conta criada com sucesso!');
        }
        setLoading(false);
        return;
      }

      // Login
      const { error } = await signIn(email, password);
      if (error) {
        toast.error(translateError(error.message));
      }
    } catch (err: any) {
      toast.error('Erro inesperado. Tente novamente.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gradient-primary tracking-tight">StudyOS</h1>
          <p className="text-muted-foreground text-sm mt-2">Performance Dashboard</p>
        </div>

        <div className="metric-card space-y-5">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            {mode === 'login' && <><LogIn className="w-4 h-4 text-primary" /> Entrar</>}
            {mode === 'signup' && <><UserPlus className="w-4 h-4 text-primary" /> Criar conta</>}
            {mode === 'forgot' && <><KeyRound className="w-4 h-4 text-primary" /> Recuperar senha</>}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Email</Label>
              <Input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                className="bg-secondary border-border/50"
              />
            </div>

            {mode !== 'forgot' && (
              <div className="space-y-1.5">
                <Label className="text-xs">Senha</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="bg-secondary border-border/50"
                />
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Carregando...' : mode === 'login' ? 'Entrar' : mode === 'signup' ? 'Criar conta' : 'Enviar email'}
            </Button>
          </form>

          <div className="flex flex-col gap-2 text-center text-xs text-muted-foreground">
            {mode === 'login' && (
              <>
                <button onClick={() => setMode('forgot')} className="hover:text-primary transition-colors">
                  Esqueci minha senha
                </button>
                <button onClick={() => setMode('signup')} className="hover:text-primary transition-colors">
                  Não tem conta? <span className="text-primary font-medium">Criar conta</span>
                </button>
              </>
            )}
            {mode === 'signup' && (
              <button onClick={() => setMode('login')} className="hover:text-primary transition-colors">
                Já tem conta? <span className="text-primary font-medium">Entrar</span>
              </button>
            )}
            {mode === 'forgot' && (
              <button onClick={() => setMode('login')} className="hover:text-primary transition-colors">
                Voltar para login
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
