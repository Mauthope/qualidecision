/**
 * Paleta de cores harmoniosas desenvolvida especificamente para visualização de dados
 * em interfaces industriais com tema escuro (Dark Mode).
 * 
 * Cores balanceadas em saturação e luminosidade, garantindo alto contraste visual,
 * excelente legibilidade e harmonia estética no dashboard.
 */
export const HARMONIOUS_CHART_COLORS = [
  '#06b6d4', // 0. Cyan Elétrico / Turquesa
  '#8b5cf6', // 1. Violeta Vibrante
  '#10b981', // 2. Esmeralda / Verde Menta
  '#f59e0b', // 3. Âmbar Solar
  '#ec4899', // 4. Pink Magenta
  '#3b82f6', // 5. Azul Safira
  '#f97316', // 6. Coral Tangerina
  '#14b8a6', // 7. Teal Oceânico
  '#a855f7', // 8. Púrpura Imperial
  '#f43f5e', // 9. Rosa Framboesa / Carmim
  '#0ea5e9', // 10. Azul Celeste
  '#84cc16', // 11. Verde Limão
  '#6366f1', // 12. Índigo Noturno
  '#d946ef', // 13. Fúcsia Intenso
  '#eab308', // 14. Amarelo Dourado
  '#2dd4bf', // 15. Água-Marinha Suave
] as const;

/**
 * Retorna uma cor harmoniosa a partir de um índice sequencial.
 */
export function getHarmoniousColor(index: number): string {
  return HARMONIOUS_CHART_COLORS[index % HARMONIOUS_CHART_COLORS.length];
}

/**
 * Retorna o ID único para gradientes SVG de barras.
 */
export function getBarGradientId(index: number, prefix: string = 'defect-grad'): string {
  return `${prefix}-${index}`;
}
