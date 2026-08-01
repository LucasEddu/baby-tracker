import { BowelMovement, GrowthRecord, VaccineApplication, MedicalAppointment } from '@prisma/client';

export interface TimelineItem {
  id: string;
  category: 'bowel' | 'growth' | 'vaccine' | 'appointment';
  date: Date;
  title: string;
  subtitle: string;
  details?: string;
  badgeColor?: string;
  raw: BowelMovement | GrowthRecord | VaccineApplication | MedicalAppointment | any;
}

export function formatAge(birthDate: Date): string {
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - new Date(birthDate).getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 30) {
    return `${diffDays} dias`;
  }
  
  const months = Math.floor(diffDays / 30.4375);
  if (months < 12) {
    return `${months} meses`;
  }

  const years = Math.floor(months / 12);
  const remMonths = months % 12;
  return `${years} ano${years > 1 ? 's' : ''} ${remMonths > 0 ? `e ${remMonths} m` : ''}`;
}

export function translateColor(color: string | null): string {
  switch (color) {
    case 'YELLOW': return 'Amarelo 🟡';
    case 'GREEN': return 'Verde 🟢';
    case 'BROWN': return 'Castanho 🟤';
    case 'MECONIUM': return 'Meconial 🖤';
    case 'ALERT_BLOOD': return 'Alerta / Sangue 🚨';
    default: return 'Não especificado';
  }
}

export function translateConsistency(consistency: string | null): string {
  switch (consistency) {
    case 'LIQUID': return 'Líquido';
    case 'PASTY': return 'Pastoso';
    case 'HARDENED': return 'Endurecido';
    case 'MECONIUM': return 'Mecônio';
    default: return 'Não especificado';
  }
}
