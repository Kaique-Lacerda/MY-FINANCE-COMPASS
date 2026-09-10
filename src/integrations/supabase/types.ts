export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      accounts: {
        Row: {
          color: string;
          created_at: string;
          external_account_id: string | null;
          external_institution_id: string | null;
          icon: string | null;
          id: string;
          include_in_total: boolean;
          institution_code: string;
          institution_name: string | null;
          initial_balance: number;
          initial_balance_date: string;
          institution: string | null;
          is_active: boolean;
          is_demo: boolean;
          last_synced_at: string | null;
          name: string;
          source: string;
          type: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          color?: string;
          created_at?: string;
          external_account_id?: string | null;
          external_institution_id?: string | null;
          icon?: string | null;
          id?: string;
          include_in_total?: boolean;
          institution_code?: string;
          institution_name?: string | null;
          initial_balance?: number;
          initial_balance_date?: string;
          institution?: string | null;
          is_active?: boolean;
          is_demo?: boolean;
          last_synced_at?: string | null;
          name: string;
          source?: string;
          type?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          color?: string;
          created_at?: string;
          external_account_id?: string | null;
          external_institution_id?: string | null;
          icon?: string | null;
          id?: string;
          include_in_total?: boolean;
          institution_code?: string;
          institution_name?: string | null;
          initial_balance?: number;
          initial_balance_date?: string;
          institution?: string | null;
          is_active?: boolean;
          is_demo?: boolean;
          last_synced_at?: string | null;
          name?: string;
          source?: string;
          type?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          color: string;
          created_at: string;
          icon: string | null;
          id: string;
          is_demo: boolean;
          kind: string;
          name: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          color?: string;
          created_at?: string;
          icon?: string | null;
          id?: string;
          is_demo?: boolean;
          kind?: string;
          name: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          color?: string;
          created_at?: string;
          icon?: string | null;
          id?: string;
          is_demo?: boolean;
          kind?: string;
          name?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      category_budgets: {
        Row: {
          category_id: string;
          created_at: string;
          id: string;
          is_demo: boolean;
          monthly_limit: number;
          start_month: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          category_id: string;
          created_at?: string;
          id?: string;
          is_demo?: boolean;
          monthly_limit?: number;
          start_month?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          category_id?: string;
          created_at?: string;
          id?: string;
          is_demo?: boolean;
          monthly_limit?: number;
          start_month?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "category_budgets_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      credit_card_invoices: {
        Row: {
          card_id: string;
          closing_date: string;
          created_at: string;
          due_date: string;
          id: string;
          paid_transaction_id: string | null;
          reference_month: string;
          status: string;
          total_amount: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          card_id: string;
          closing_date: string;
          created_at?: string;
          due_date: string;
          id?: string;
          paid_transaction_id?: string | null;
          reference_month: string;
          status?: string;
          total_amount?: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          card_id?: string;
          closing_date?: string;
          created_at?: string;
          due_date?: string;
          id?: string;
          paid_transaction_id?: string | null;
          reference_month?: string;
          status?: string;
          total_amount?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "credit_card_invoices_card_id_fkey";
            columns: ["card_id"];
            isOneToOne: false;
            referencedRelation: "credit_cards";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "credit_card_invoices_paid_transaction_id_fkey";
            columns: ["paid_transaction_id"];
            isOneToOne: false;
            referencedRelation: "transactions";
            referencedColumns: ["id"];
          },
        ];
      };
      credit_card_transactions: {
        Row: {
          amount: number;
          card_id: string;
          category_id: string | null;
          created_at: string;
          description: string;
          id: string;
          installment_number: number;
          installment_total: number;
          invoice_id: string | null;
          purchase_date: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          amount: number;
          card_id: string;
          category_id?: string | null;
          created_at?: string;
          description: string;
          id?: string;
          installment_number?: number;
          installment_total?: number;
          invoice_id?: string | null;
          purchase_date: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          amount?: number;
          card_id?: string;
          category_id?: string | null;
          created_at?: string;
          description?: string;
          id?: string;
          installment_number?: number;
          installment_total?: number;
          invoice_id?: string | null;
          purchase_date?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "credit_card_transactions_card_id_fkey";
            columns: ["card_id"];
            isOneToOne: false;
            referencedRelation: "credit_cards";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "credit_card_transactions_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "credit_card_transactions_invoice_id_fkey";
            columns: ["invoice_id"];
            isOneToOne: false;
            referencedRelation: "credit_card_invoices";
            referencedColumns: ["id"];
          },
        ];
      };
      credit_cards: {
        Row: {
          account_id: string;
          active: boolean;
          card_brand: string;
          closing_day: number;
          created_at: string;
          credit_limit: number;
          due_day: number;
          id: string;
          name: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          account_id: string;
          active?: boolean;
          card_brand?: string;
          closing_day: number;
          created_at?: string;
          credit_limit?: number;
          due_day: number;
          id?: string;
          name: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          account_id?: string;
          active?: boolean;
          card_brand?: string;
          closing_day?: number;
          created_at?: string;
          credit_limit?: number;
          due_day?: number;
          id?: string;
          name?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "credit_cards_account_id_fkey";
            columns: ["account_id"];
            isOneToOne: false;
            referencedRelation: "accounts";
            referencedColumns: ["id"];
          },
        ];
      };
      debts: {
        Row: {
          account_id: string | null;
          category_id: string | null;
          created_at: string;
          creditor: string | null;
          expected_end_date: string | null;
          id: string;
          installment_amount: number;
          installments_count: number;
          is_demo: boolean;
          name: string;
          notes: string | null;
          original_amount: number;
          paid_installments: number;
          start_date: string;
          status: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          account_id?: string | null;
          category_id?: string | null;
          created_at?: string;
          creditor?: string | null;
          expected_end_date?: string | null;
          id?: string;
          installment_amount?: number;
          installments_count?: number;
          is_demo?: boolean;
          name: string;
          notes?: string | null;
          original_amount?: number;
          paid_installments?: number;
          start_date?: string;
          status?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          account_id?: string | null;
          category_id?: string | null;
          created_at?: string;
          creditor?: string | null;
          expected_end_date?: string | null;
          id?: string;
          installment_amount?: number;
          installments_count?: number;
          is_demo?: boolean;
          name?: string;
          notes?: string | null;
          original_amount?: number;
          paid_installments?: number;
          start_date?: string;
          status?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "debts_account_id_fkey";
            columns: ["account_id"];
            isOneToOne: false;
            referencedRelation: "accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "debts_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      financial_goals: {
        Row: {
          created_at: string;
          current_amount: number;
          id: string;
          is_demo: boolean;
          name: string;
          status: string;
          target_amount: number;
          target_date: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          current_amount?: number;
          id?: string;
          is_demo?: boolean;
          name: string;
          status?: string;
          target_amount?: number;
          target_date?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          current_amount?: number;
          id?: string;
          is_demo?: boolean;
          name?: string;
          status?: string;
          target_amount?: number;
          target_date?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      installments: {
        Row: {
          account_id: string | null;
          category_id: string | null;
          created_at: string;
          description: string;
          first_due_date: string;
          id: string;
          installment_amount: number;
          installments_count: number;
          is_demo: boolean;
          paid_count: number;
          status: string;
          total_amount: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          account_id?: string | null;
          category_id?: string | null;
          created_at?: string;
          description: string;
          first_due_date?: string;
          id?: string;
          installment_amount?: number;
          installments_count?: number;
          is_demo?: boolean;
          paid_count?: number;
          status?: string;
          total_amount?: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          account_id?: string | null;
          category_id?: string | null;
          created_at?: string;
          description?: string;
          first_due_date?: string;
          id?: string;
          installment_amount?: number;
          installments_count?: number;
          is_demo?: boolean;
          paid_count?: number;
          status?: string;
          total_amount?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "installments_account_id_fkey";
            columns: ["account_id"];
            isOneToOne: false;
            referencedRelation: "accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "installments_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      investment_transactions: {
        Row: {
          account_id: string | null;
          amount: number;
          created_at: string;
          date: string;
          id: string;
          investment_id: string;
          is_demo: boolean;
          transaction_id: string | null;
          type: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          account_id?: string | null;
          amount?: number;
          created_at?: string;
          date?: string;
          id?: string;
          investment_id: string;
          is_demo?: boolean;
          transaction_id?: string | null;
          type?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          account_id?: string | null;
          amount?: number;
          created_at?: string;
          date?: string;
          id?: string;
          investment_id?: string;
          is_demo?: boolean;
          transaction_id?: string | null;
          type?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "investment_transactions_account_id_fkey";
            columns: ["account_id"];
            isOneToOne: false;
            referencedRelation: "accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "investment_transactions_investment_id_fkey";
            columns: ["investment_id"];
            isOneToOne: false;
            referencedRelation: "investments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "investment_transactions_transaction_id_fkey";
            columns: ["transaction_id"];
            isOneToOne: false;
            referencedRelation: "transactions";
            referencedColumns: ["id"];
          },
        ];
      };
      investments: {
        Row: {
          account_id: string | null;
          created_at: string;
          current_value: number;
          id: string;
          institution: string | null;
          invested_amount: number;
          is_demo: boolean;
          name: string;
          start_date: string;
          type: string;
          updated_at: string;
          user_id: string;
          yield_rate: number | null;
        };
        Insert: {
          account_id?: string | null;
          created_at?: string;
          current_value?: number;
          id?: string;
          institution?: string | null;
          invested_amount?: number;
          is_demo?: boolean;
          name: string;
          start_date?: string;
          type?: string;
          updated_at?: string;
          user_id: string;
          yield_rate?: number | null;
        };
        Update: {
          account_id?: string | null;
          created_at?: string;
          current_value?: number;
          id?: string;
          institution?: string | null;
          invested_amount?: number;
          is_demo?: boolean;
          name?: string;
          start_date?: string;
          type?: string;
          updated_at?: string;
          user_id?: string;
          yield_rate?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "investments_account_id_fkey";
            columns: ["account_id"];
            isOneToOne: false;
            referencedRelation: "accounts";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          cpf: string | null;
          created_at: string;
          currency: string;
          date_format: string;
          first_day_of_month: number;
          full_name: string | null;
          id: string;
          notify_negative_forecast: boolean;
          notify_reconciliation: boolean;
          notify_upcoming: boolean;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          cpf?: string | null;
          created_at?: string;
          currency?: string;
          date_format?: string;
          first_day_of_month?: number;
          full_name?: string | null;
          id: string;
          notify_negative_forecast?: boolean;
          notify_reconciliation?: boolean;
          notify_upcoming?: boolean;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          cpf?: string | null;
          created_at?: string;
          currency?: string;
          date_format?: string;
          first_day_of_month?: number;
          full_name?: string | null;
          id?: string;
          notify_negative_forecast?: boolean;
          notify_reconciliation?: boolean;
          notify_upcoming?: boolean;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      reconciliations: {
        Row: {
          account_id: string;
          created_at: string;
          date: string;
          difference: number;
          id: string;
          is_demo: boolean;
          notes: string | null;
          real_balance: number;
          system_balance: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          account_id: string;
          created_at?: string;
          date?: string;
          difference?: number;
          id?: string;
          is_demo?: boolean;
          notes?: string | null;
          real_balance?: number;
          system_balance?: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          account_id?: string;
          created_at?: string;
          date?: string;
          difference?: number;
          id?: string;
          is_demo?: boolean;
          notes?: string | null;
          real_balance?: number;
          system_balance?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reconciliations_account_id_fkey";
            columns: ["account_id"];
            isOneToOne: false;
            referencedRelation: "accounts";
            referencedColumns: ["id"];
          },
        ];
      };
      recurring_transactions: {
        Row: {
          account_id: string | null;
          amount: number;
          category_id: string | null;
          created_at: string;
          day_of_month: number | null;
          description: string;
          end_date: string | null;
          frequency: string;
          id: string;
          is_active: boolean;
          is_demo: boolean;
          occurrences: number | null;
          start_date: string;
          type: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          account_id?: string | null;
          amount?: number;
          category_id?: string | null;
          created_at?: string;
          day_of_month?: number | null;
          description: string;
          end_date?: string | null;
          frequency?: string;
          id?: string;
          is_active?: boolean;
          is_demo?: boolean;
          occurrences?: number | null;
          start_date?: string;
          type?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          account_id?: string | null;
          amount?: number;
          category_id?: string | null;
          created_at?: string;
          day_of_month?: number | null;
          description?: string;
          end_date?: string | null;
          frequency?: string;
          id?: string;
          is_active?: boolean;
          is_demo?: boolean;
          occurrences?: number | null;
          start_date?: string;
          type?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "recurring_transactions_account_id_fkey";
            columns: ["account_id"];
            isOneToOne: false;
            referencedRelation: "accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "recurring_transactions_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      obligations: {
        Row: {
          account_id: string | null;
          category_id: string | null;
          created_at: string;
          description: string;
          due_date: string | null;
          id: string;
          planned_amount: number;
          planned_date: string;
          status: string;
          type: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          account_id?: string | null;
          category_id?: string | null;
          created_at?: string;
          description: string;
          due_date?: string | null;
          id?: string;
          planned_amount?: number;
          planned_date?: string;
          status?: string;
          type?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          account_id?: string | null;
          category_id?: string | null;
          created_at?: string;
          description?: string;
          due_date?: string | null;
          id?: string;
          planned_amount?: number;
          planned_date?: string;
          status?: string;
          type?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "obligations_account_id_fkey";
            columns: ["account_id"];
            isOneToOne: false;
            referencedRelation: "accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "obligations_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      transactions: {
        Row: {
          account_id: string | null;
          amount: number;
          category_id: string | null;
          credit_card_invoice_id: string | null;
          created_at: string;
          date: string;
          debt_id: string | null;
          description: string;
          discount_amount: number | null;
          due_date: string | null;
          external_account_id: string | null;
          external_id: string | null;
          external_institution_id: string | null;
          fine_amount: number | null;
          id: string;
          installment_id: string | null;
          installment_number: number | null;
          interest_amount: number | null;
          investment_id: string | null;
          is_demo: boolean;
          notes: string | null;
          obligation_id: string | null;
          planned_amount: number | null;
          planned_date: string | null;
          real_amount: number | null;
          reconciled: boolean;
          recurring_id: string | null;
          source: string;
          status: string;
          synced_at: string | null;
          to_account_id: string | null;
          type: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          account_id?: string | null;
          amount?: number;
          category_id?: string | null;
          credit_card_invoice_id?: string | null;
          created_at?: string;
          date?: string;
          debt_id?: string | null;
          description: string;
          discount_amount?: number | null;
          due_date?: string | null;
          external_account_id?: string | null;
          external_id?: string | null;
          external_institution_id?: string | null;
          fine_amount?: number | null;
          id?: string;
          installment_id?: string | null;
          installment_number?: number | null;
          interest_amount?: number | null;
          investment_id?: string | null;
          is_demo?: boolean;
          notes?: string | null;
          obligation_id?: string | null;
          planned_amount?: number | null;
          planned_date?: string | null;
          real_amount?: number | null;
          reconciled?: boolean;
          recurring_id?: string | null;
          source?: string;
          status?: string;
          synced_at?: string | null;
          to_account_id?: string | null;
          type?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          account_id?: string | null;
          amount?: number;
          category_id?: string | null;
          credit_card_invoice_id?: string | null;
          created_at?: string;
          date?: string;
          debt_id?: string | null;
          description?: string;
          discount_amount?: number | null;
          due_date?: string | null;
          external_account_id?: string | null;
          external_id?: string | null;
          external_institution_id?: string | null;
          fine_amount?: number | null;
          id?: string;
          installment_id?: string | null;
          installment_number?: number | null;
          interest_amount?: number | null;
          investment_id?: string | null;
          is_demo?: boolean;
          notes?: string | null;
          obligation_id?: string | null;
          planned_amount?: number | null;
          planned_date?: string | null;
          real_amount?: number | null;
          reconciled?: boolean;
          recurring_id?: string | null;
          source?: string;
          status?: string;
          synced_at?: string | null;
          to_account_id?: string | null;
          type?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "transactions_account_id_fkey";
            columns: ["account_id"];
            isOneToOne: false;
            referencedRelation: "accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transactions_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transactions_debt_id_fkey";
            columns: ["debt_id"];
            isOneToOne: false;
            referencedRelation: "debts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transactions_credit_card_invoice_id_fkey";
            columns: ["credit_card_invoice_id"];
            isOneToOne: false;
            referencedRelation: "credit_card_invoices";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transactions_installment_id_fkey";
            columns: ["installment_id"];
            isOneToOne: false;
            referencedRelation: "installments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transactions_investment_id_fkey";
            columns: ["investment_id"];
            isOneToOne: false;
            referencedRelation: "investments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transactions_obligation_id_fkey";
            columns: ["obligation_id"];
            isOneToOne: false;
            referencedRelation: "obligations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transactions_recurring_id_fkey";
            columns: ["recurring_id"];
            isOneToOne: false;
            referencedRelation: "recurring_transactions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transactions_to_account_id_fkey";
            columns: ["to_account_id"];
            isOneToOne: false;
            referencedRelation: "accounts";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
