
 // ============================================
 // ESPETINHOS JOÃO PAULO
 // API ADMINISTRATIVA DE CLIENTES
 // ============================================

 // ============================================
 // CONFIGURAÇÃO
 // ============================================

 const API_BASE_URL = (
   import.meta.env.VITE_API_URL ??
   "http://localhost:3000"
 ).replace(/\/$/, "");

 const ADMIN_CUSTOMERS_URL =
   `${API_BASE_URL}/api/admin/customers`;

 // ============================================
 // TIPAGENS
 // ============================================

 export type AdminCustomer = {
   id: string;
   name: string;
   displayName: string | null;
   email: string;
   image: string | null;
   createdAt: string;
   ordersBlocked: boolean;
   blockedAt: string | null;
   blockedReason: string | null;
 };

 
export type AdminCustomerAddress = {
  street: string;
  number: string;
  neighborhood: string;
  complement: string;
  city: string;
  state: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
};

export type AdminCustomerDetails = AdminCustomer & {
  phone: string | null;
  address: AdminCustomerAddress | null;
};


 export type AdminCustomerStats = {
   total: number;
   enabled: number;
   blocked: number;
 };

 type ApiResponse<T> = {
   success: boolean;
   message?: string;
   data?: T;
   errors?: Array<{
     field: string;
     message: string;
   }>;
 };

 // ============================================
 // ERRO PERSONALIZADO
 // ============================================

 export class AdminCustomersApiError extends Error {
   readonly status: number;

   constructor(
     message: string,
     status: number,
   ) {
     super(message);
     this.name = "AdminCustomersApiError";
     this.status = status;
   }
 }

 // ============================================
 // TRATAMENTO DAS RESPOSTAS
 // ============================================

 async function parseApiResponse<T>(
   response: Response,
 ): Promise<T> {
   let result: ApiResponse<T>;

   try {
     result =
       (await response.json()) as ApiResponse<T>;
   } catch {
     throw new AdminCustomersApiError(
       "O servidor retornou uma resposta inválida.",
       response.status,
     );
   }

   if (!response.ok || !result.success) {
     const validationErrors = result.errors
       ?.map((error) => error.message)
       .join(" ");

     let fallbackMessage =
       "Não foi possível processar a solicitação.";

     if (response.status === 401) {
       fallbackMessage =
         "Sua sessão expirou. Entre novamente.";
     }

     if (response.status === 403) {
       fallbackMessage =
         "Você não possui permissão para gerenciar clientes.";
     }

     if (response.status === 404) {
       fallbackMessage =
         "Cliente não encontrado.";
     }

     throw new AdminCustomersApiError(
       validationErrors ||
         result.message ||
         fallbackMessage,
       response.status,
     );
   }

   if (result.data === undefined) {
     throw new AdminCustomersApiError(
       "A API não retornou os dados solicitados.",
       response.status,
     );
   }

   return result.data;
 }

 // ============================================
 // REQUISIÇÃO AUTENTICADA
 // ============================================

 async function adminCustomersRequest<T>(
   endpoint: string,
   options: RequestInit = {},
 ): Promise<T> {
   let response: Response;

   try {
     response = await fetch(
       `${ADMIN_CUSTOMERS_URL}${endpoint}`,
       {
         ...options,
         credentials: "include",
         headers: {
           "Content-Type": "application/json",
           ...options.headers,
         },
       },
     );
   } catch (error) {
     if (
       error instanceof DOMException &&
       error.name === "AbortError"
     ) {
       throw error;
     }

     throw new AdminCustomersApiError(
       "Não foi possível conectar ao servidor.",
       0,
     );
   }

   return parseApiResponse<T>(response);
 }

 // ============================================
 // LISTAR CLIENTES
 // GET /api/admin/customers
 // ============================================

 export async function getAdminCustomers(
   signal?: AbortSignal,
 ): Promise<AdminCustomer[]> {
   return adminCustomersRequest<AdminCustomer[]>(
     "",
     {
       method: "GET",
       signal,
     },
   );
 }

 // ============================================
 // INDICADORES
 // GET /api/admin/customers/stats
 // ============================================

 export async function getAdminCustomerStats(
   signal?: AbortSignal,
 ): Promise<AdminCustomerStats> {
   return adminCustomersRequest<AdminCustomerStats>(
     "/stats",
     {
       method: "GET",
       signal,
     },
   );
 }

 // ============================================
 // CONSULTAR CLIENTE
 // GET /api/admin/customers/:id
 // ============================================

 
export async function getAdminCustomerById(
  customerId: string,
  signal?: AbortSignal,
): Promise<AdminCustomerDetails> {
  return adminCustomersRequest<AdminCustomerDetails>(
    `/${encodeURIComponent(customerId)}`,
    {
      method: "GET",
      signal,
    },
  );
}


 // ============================================
 // ATUALIZAR NOME EXIBIDO
 // PATCH /api/admin/customers/:id/name
 // ============================================

 export async function updateAdminCustomerName(
   customerId: string,
   displayName: string | null,
 ): Promise<AdminCustomer> {
   return adminCustomersRequest<AdminCustomer>(
     `/${encodeURIComponent(customerId)}/name`,
     {
       method: "PATCH",
       body: JSON.stringify({
         displayName,
       }),
     },
   );
 }

 // ============================================
 // BLOQUEAR CLIENTE
 // PATCH /api/admin/customers/:id/block
 // ============================================

 export async function blockAdminCustomer(
   customerId: string,
   reason: string | null = null,
 ): Promise<AdminCustomer> {
   return adminCustomersRequest<AdminCustomer>(
     `/${encodeURIComponent(customerId)}/block`,
     {
       method: "PATCH",
       body: JSON.stringify({
         reason,
       }),
     },
   );
 }

 // ============================================
 // DESBLOQUEAR CLIENTE
 // PATCH /api/admin/customers/:id/unblock
 // ============================================

 export async function unblockAdminCustomer(
   customerId: string,
 ): Promise<AdminCustomer> {
   return adminCustomersRequest<AdminCustomer>(
     `/${encodeURIComponent(customerId)}/unblock`,
     {
       method: "PATCH",
     },
   );
 }

 // ============================================
 // UTILITÁRIOS
 // ============================================

 export function getAdminCustomerDisplayName(
   customer: AdminCustomer,
 ): string {
   return (
     customer.displayName?.trim() ||
     customer.name ||
     "Cliente sem nome"
   );
 }

 export function formatAdminCustomerDate(
   date: string | null,
 ): string {
   if (!date) return "Não informado";

   const parsed = new Date(date);

   if (Number.isNaN(parsed.getTime())) {
     return "Data inválida";
   }

   return new Intl.DateTimeFormat("pt-BR", {
     day: "2-digit",
     month: "2-digit",
     year: "numeric",
     hour: "2-digit",
     minute: "2-digit",
   }).format(parsed);
 }
