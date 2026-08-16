export interface SleepWindowStatus {
  minutesAwake: number;
  status: 'resting' | 'ideal' | 'warning' | 'overtired';
  label: string;
  badgeClass: string;
}

export function calculateSleepWindow(
  lastNapEndedAt: Date | string | null,
  birthDate: Date | string
): SleepWindowStatus {
  if (!lastNapEndedAt) {
    return {
      minutesAwake: 0,
      status: 'resting',
      label: 'Sem registro recente',
      badgeClass: 'bg-slate-800 text-slate-400 border border-slate-700',
    };
  }

  const now = new Date();
  const diffMs = now.getTime() - new Date(lastNapEndedAt).getTime();
  const minutesAwake = Math.max(0, Math.floor(diffMs / (1000 * 60)));

  const birth = new Date(birthDate);
  const ageInDays = Math.max(0, Math.floor((now.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24)));

  let minIdeal = 35;
  let maxIdeal = 60;

  if (ageInDays <= 30) {
    minIdeal = 35;
    maxIdeal = 60;
  } else if (ageInDays <= 60) {
    minIdeal = 45;
    maxIdeal = 90;
  } else if (ageInDays <= 120) {
    minIdeal = 75;
    maxIdeal = 120;
  } else {
    minIdeal = 120;
    maxIdeal = 180;
  }

  if (minutesAwake < minIdeal) {
    return {
      minutesAwake,
      status: 'resting',
      label: 'Acordado / Tranquilo',
      badgeClass: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30',
    };
  }

  if (minutesAwake <= maxIdeal) {
    return {
      minutesAwake,
      status: 'ideal',
      label: 'Momento Ideal p/ Soneca',
      badgeClass: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40',
    };
  }

  if (minutesAwake <= maxIdeal + 20) {
    return {
      minutesAwake,
      status: 'warning',
      label: 'Janela Estourando',
      badgeClass: 'bg-amber-500/20 text-amber-300 border border-amber-500/40',
    };
  }

  return {
    minutesAwake,
    status: 'overtired',
    label: 'Sobrecansaço (Atenção)',
    badgeClass: 'bg-rose-500/20 text-rose-300 border border-rose-500/40',
  };
}
