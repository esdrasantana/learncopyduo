import { Medal } from '@/types/study';

export const defaultMedals: Medal[] = [
  // Tempo acumulado
  { id: 'time-10', name: '10 Horas', category: 'accumulated_time', description: 'Acumule 10 horas de estudo', criterion: 'Tempo total ≥ 10h', targetValue: 10, currentValue: 0, unlocked: false, unlockedAt: null, icon: '⏱️' },
  { id: 'time-50', name: '50 Horas', category: 'accumulated_time', description: 'Acumule 50 horas de estudo', criterion: 'Tempo total ≥ 50h', targetValue: 50, currentValue: 0, unlocked: false, unlockedAt: null, icon: '🔥' },
  { id: 'time-100', name: '100 Horas', category: 'accumulated_time', description: 'Acumule 100 horas de estudo', criterion: 'Tempo total ≥ 100h', targetValue: 100, currentValue: 0, unlocked: false, unlockedAt: null, icon: '💯' },
  { id: 'time-300', name: '300 Horas', category: 'accumulated_time', description: 'Acumule 300 horas de estudo', criterion: 'Tempo total ≥ 300h', targetValue: 300, currentValue: 0, unlocked: false, unlockedAt: null, icon: '🚀' },
  { id: 'time-500', name: '500 Horas', category: 'accumulated_time', description: 'Acumule 500 horas de estudo', criterion: 'Tempo total ≥ 500h', targetValue: 500, currentValue: 0, unlocked: false, unlockedAt: null, icon: '⭐' },
  { id: 'time-1000', name: '1000 Horas', category: 'accumulated_time', description: 'Acumule 1000 horas de estudo', criterion: 'Tempo total ≥ 1000h', targetValue: 1000, currentValue: 0, unlocked: false, unlockedAt: null, icon: '👑' },
  // Consistência
  { id: 'streak-7', name: '7 Dias Seguidos', category: 'consistency', description: 'Estude 7 dias consecutivos cumprindo a meta', criterion: 'Streak ≥ 7', targetValue: 7, currentValue: 0, unlocked: false, unlockedAt: null, icon: '🔗' },
  { id: 'single-6h', name: 'Maratonista', category: 'consistency', description: 'Estude 6 horas em um único dia', criterion: 'Max diário ≥ 6h', targetValue: 6, currentValue: 0, unlocked: false, unlockedAt: null, icon: '🏃' },
  { id: 'single-10h', name: 'Ultra Maratonista', category: 'consistency', description: 'Estude 10 horas em um único dia', criterion: 'Max diário ≥ 10h', targetValue: 10, currentValue: 0, unlocked: false, unlockedAt: null, icon: '🦸' },
];
