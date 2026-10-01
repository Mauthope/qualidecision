import { Customer, DefectType, Complaint, ConcessionShipment } from '@/types';

/**
 * Base de dados padrão vazia.
 * Todos os dados de clientes, reclamações, concessões e defeitos são
 * carregados exclusivamente do banco de dados seguro (Supabase) após autenticação.
 * Nenhuma informação corporativa ou dados comerciais são embutidos no bundle público do cliente.
 */
export const DEFAULT_DEFECTS: DefectType[] = [];
export const DEFAULT_CUSTOMERS: Customer[] = [];
export const DEFAULT_COMPLAINTS: Complaint[] = [];
export const DEFAULT_CONCESSIONS: ConcessionShipment[] = [];
