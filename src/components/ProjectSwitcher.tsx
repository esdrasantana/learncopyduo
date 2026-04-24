import { useState } from 'react';
import { useStudyData } from '@/hooks/useStudyData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { FolderKanban, Plus, Check, Trash2 } from 'lucide-react';

export default function ProjectSwitcher() {
  const { projects, activeProject, createProject, switchProject, deleteProject } = useStudyData();
  const [showNew, setShowNew] = useState(false);
  const [name, setName] = useState('');

  const handleCreate = async () => {
    const created = await createProject(name);
    if (created) {
      setName('');
      setShowNew(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2 max-w-[180px] truncate">
            <FolderKanban className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate text-xs">{activeProject?.name || 'Projeto'}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64 bg-popover border-border/50">
          <DropdownMenuLabel className="text-xs text-muted-foreground">Projetos (Ciclos)</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {projects.map(p => (
            <DropdownMenuItem
              key={p.id}
              onSelect={() => !p.isActive && switchProject(p.id)}
              className="flex items-center justify-between gap-2 cursor-pointer"
            >
              <span className="flex items-center gap-2 truncate">
                {p.isActive ? <Check className="w-3.5 h-3.5 text-primary" /> : <span className="w-3.5" />}
                <span className={`truncate text-sm ${p.isActive ? 'font-semibold text-primary' : ''}`}>{p.name}</span>
              </span>
              {!p.isActive && projects.length > 1 && (
                <button
                  onClick={(e) => { e.stopPropagation(); if (confirm(`Excluir projeto "${p.name}" e todas suas sessões?`)) deleteProject(p.id); }}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setShowNew(true)} className="cursor-pointer text-primary">
            <Plus className="w-3.5 h-3.5 mr-2" /> Novo Projeto
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="sm:max-w-sm bg-card border-border/50">
          <DialogHeader><DialogTitle>Novo Projeto (Ciclo)</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Cria um novo ciclo zerado. As sessões anteriores ficam preservadas no projeto antigo.
            </p>
            <div className="space-y-1.5">
              <Label className="text-xs">Nome do Projeto</Label>
              <Input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ex: ENEM 2026, Concurso TRT..."
                className="bg-secondary border-border/50"
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNew(false)}>Cancelar</Button>
            <Button onClick={handleCreate}>Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
