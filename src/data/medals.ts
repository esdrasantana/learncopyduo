import { Medal } from '@/types/study';

export const defaultMedals: Medal[] = [
  // Tempo Acumulado
  { id: 'time-10', name: 'Iniciante', category: 'accumulated_time', description: 'Estude um total de 10 horas', criterion: 'Tempo total ≥ 10h', targetValue: 10, currentValue: 0, unlocked: false, unlockedAt: null, icon: '📘' },
  { id: 'time-50', name: 'Aprendiz', category: 'accumulated_time', description: 'Estude um total de 50 horas', criterion: 'Tempo total ≥ 50h', targetValue: 50, currentValue: 0, unlocked: false, unlockedAt: null, icon: '📗' },
  { id: 'time-100', name: 'Estudioso', category: 'accumulated_time', description: 'Estude um total de 100 horas', criterion: 'Tempo total ≥ 100h', targetValue: 100, currentValue: 0, unlocked: false, unlockedAt: null, icon: '📕' },
  { id: 'time-250', name: 'Especialista', category: 'accumulated_time', description: 'Estude um total de 250 horas', criterion: 'Tempo total ≥ 250h', targetValue: 250, currentValue: 0, unlocked: false, unlockedAt: null, icon: '🎓' },
  { id: 'time-500', name: 'Mestre', category: 'accumulated_time', description: 'Estude um total de 500 horas', criterion: 'Tempo total ≥ 500h', targetValue: 500, currentValue: 0, unlocked: false, unlockedAt: null, icon: '⭐' },
  { id: 'time-1000', name: 'Grão-Mestre', category: 'accumulated_time', description: 'Estude um total de 1000 horas', criterion: 'Tempo total ≥ 1000h', targetValue: 1000, currentValue: 0, unlocked: false, unlockedAt: null, icon: '👑' },
  // Alta Produtividade
  { id: 'single-5h', name: 'Bateria Cheia', category: 'performance', description: 'Estude mais de 5 horas em um único dia', criterion: 'Max diário ≥ 5h', targetValue: 5, currentValue: 0, unlocked: false, unlockedAt: null, icon: '🔋' },
  // Consistência
  { id: 'streak-7', name: 'Guerreiro da Semana', category: 'consistency', description: 'Alcance uma sequência de 7 dias de estudo', criterion: 'Streak ≥ 7', targetValue: 7, currentValue: 0, unlocked: false, unlockedAt: null, icon: '🔗' },
  { id: 'streak-14', name: 'Lutador Quinzenal', category: 'consistency', description: 'Alcance uma sequência de 14 dias de estudo', criterion: 'Streak ≥ 14', targetValue: 14, currentValue: 0, unlocked: false, unlockedAt: null, icon: '⚔️' },
  { id: 'streak-30', name: 'Mestre Mensal', category: 'consistency', description: 'Alcance uma sequência de 30 dias de estudo', criterion: 'Streak ≥ 30', targetValue: 30, currentValue: 0, unlocked: false, unlockedAt: null, icon: '🏅' },
  { id: 'streak-42', name: 'Maratonista', category: 'consistency', description: 'Alcance uma sequência de 42 dias de estudo', criterion: 'Streak ≥ 42', targetValue: 42, currentValue: 0, unlocked: false, unlockedAt: null, icon: '🏃' },
  { id: 'streak-100', name: 'Centurião', category: 'consistency', description: 'Alcance uma sequência de 100 dias de estudo', criterion: 'Streak ≥ 100', targetValue: 100, currentValue: 0, unlocked: false, unlockedAt: null, icon: '🛡️' },
  { id: 'discipline-30', name: 'Super-Homem', category: 'consistency', description: 'Estude a mesma disciplina por 30 dias consecutivos', criterion: 'Disciplina consecutiva ≥ 30', targetValue: 30, currentValue: 0, unlocked: false, unlockedAt: null, icon: '🦸' },
  // Hábito de Estudo
  { id: 'early-bird', name: 'Pessoa Matinal', category: 'habit', description: 'Registre 10 sessões entre 03:00 e 06:30', criterion: 'Sessões matinais ≥ 10', targetValue: 10, currentValue: 0, unlocked: false, unlockedAt: null, icon: '🌅' },
  { id: 'night-owl', name: 'Coruja Noturna', category: 'habit', description: 'Registre 7 sessões entre 20:00 e 23:00', criterion: 'Sessões noturnas ≥ 7', targetValue: 7, currentValue: 0, unlocked: false, unlockedAt: null, icon: '🦉' },
];
