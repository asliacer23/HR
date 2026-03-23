export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      applicant_documents: {
        Row: {
          applicant_id: string
          document_name: string
          document_type: string | null
          document_url: string
          id: string
          uploaded_at: string
        }
        Insert: {
          applicant_id: string
          document_name: string
          document_type?: string | null
          document_url: string
          id?: string
          uploaded_at?: string
        }
        Update: {
          applicant_id?: string
          document_name?: string
          document_type?: string | null
          document_url?: string
          id?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "applicant_documents_applicant_id_fkey"
            columns: ["applicant_id"]
            isOneToOne: false
            referencedRelation: "applicants"
            referencedColumns: ["id"]
          },
        ]
      }
      applicants: {
        Row: {
          cover_letter: string | null
          created_at: string
          education_level: string | null
          id: string
          resume_url: string | null
          skills: string[] | null
          updated_at: string
          user_id: string
          years_experience: number | null
        }
        Insert: {
          cover_letter?: string | null
          created_at?: string
          education_level?: string | null
          id?: string
          resume_url?: string | null
          skills?: string[] | null
          updated_at?: string
          user_id: string
          years_experience?: number | null
        }
        Update: {
          cover_letter?: string | null
          created_at?: string
          education_level?: string | null
          id?: string
          resume_url?: string | null
          skills?: string[] | null
          updated_at?: string
          user_id?: string
          years_experience?: number | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: string | null
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          table_name: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      benefits: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          type: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          type?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          type?: string | null
        }
        Relationships: []
      }
      departments: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      employee_benefits: {
        Row: {
          benefit_id: string
          coverage_amount: number | null
          employee_id: string
          enrolled_at: string
          id: string
          is_active: boolean | null
        }
        Insert: {
          benefit_id: string
          coverage_amount?: number | null
          employee_id: string
          enrolled_at?: string
          id?: string
          is_active?: boolean | null
        }
        Update: {
          benefit_id?: string
          coverage_amount?: number | null
          employee_id?: string
          enrolled_at?: string
          id?: string
          is_active?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_benefits_benefit_id_fkey"
            columns: ["benefit_id"]
            isOneToOne: false
            referencedRelation: "benefits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_benefits_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_documents: {
        Row: {
          document_name: string
          document_type: string | null
          document_url: string
          employee_id: string
          id: string
          uploaded_at: string
          uploaded_by: string | null
        }
        Insert: {
          document_name: string
          document_type?: string | null
          document_url: string
          employee_id: string
          id?: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Update: {
          document_name?: string
          document_type?: string | null
          document_url?: string
          employee_id?: string
          id?: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_documents_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_requests: {
        Row: {
          created_at: string
          department: string
          hr_remarks: string | null
          id: string
          position: string
          reason: string
          status: string
          urgency: string
        }
        Insert: {
          created_at?: string
          department: string
          hr_remarks?: string | null
          id?: string
          position: string
          reason: string
          status?: string
          urgency?: string
        }
        Update: {
          created_at?: string
          department?: string
          hr_remarks?: string | null
          id?: string
          position?: string
          reason?: string
          status?: string
          urgency?: string
        }
        Relationships: []
      }
      employee_onboarding: {
        Row: {
          completed_at: string | null
          employee_id: string
          id: string
          is_completed: boolean | null
          notes: string | null
          task_id: string
        }
        Insert: {
          completed_at?: string | null
          employee_id: string
          id?: string
          is_completed?: boolean | null
          notes?: string | null
          task_id: string
        }
        Update: {
          completed_at?: string | null
          employee_id?: string
          id?: string
          is_completed?: boolean | null
          notes?: string | null
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_onboarding_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_onboarding_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "onboarding_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_trainings: {
        Row: {
          certificate_url: string | null
          completion_date: string | null
          created_at: string
          employee_id: string
          id: string
          program_id: string
          score: number | null
          start_date: string | null
          status: Database["public"]["Enums"]["training_status"]
        }
        Insert: {
          certificate_url?: string | null
          completion_date?: string | null
          created_at?: string
          employee_id: string
          id?: string
          program_id: string
          score?: number | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["training_status"]
        }
        Update: {
          certificate_url?: string | null
          completion_date?: string | null
          created_at?: string
          employee_id?: string
          id?: string
          program_id?: string
          score?: number | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["training_status"]
        }
        Relationships: [
          {
            foreignKeyName: "employee_trainings_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_trainings_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "training_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          created_at: string
          department_id: string | null
          employee_number: string
          employee_type: Database["public"]["Enums"]["employee_type"]
          employment_status: Database["public"]["Enums"]["employment_status"]
          hire_date: string
          id: string
          position_id: string | null
          supervisor_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          department_id?: string | null
          employee_number: string
          employee_type?: Database["public"]["Enums"]["employee_type"]
          employment_status?: Database["public"]["Enums"]["employment_status"]
          hire_date: string
          id?: string
          position_id?: string | null
          supervisor_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          department_id?: string | null
          employee_number?: string
          employee_type?: Database["public"]["Enums"]["employee_type"]
          employment_status?: Database["public"]["Enums"]["employment_status"]
          hire_date?: string
          id?: string
          position_id?: string | null
          supervisor_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employees_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_supervisor_id_fkey"
            columns: ["supervisor_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employment_contracts: {
        Row: {
          contract_type: Database["public"]["Enums"]["contract_type"]
          created_at: string
          employee_id: string
          end_date: string | null
          id: string
          is_current: boolean | null
          salary: number
          start_date: string
          terms: string | null
          updated_at: string
        }
        Insert: {
          contract_type: Database["public"]["Enums"]["contract_type"]
          created_at?: string
          employee_id: string
          end_date?: string | null
          id?: string
          is_current?: boolean | null
          salary: number
          start_date: string
          terms?: string | null
          updated_at?: string
        }
        Update: {
          contract_type?: Database["public"]["Enums"]["contract_type"]
          created_at?: string
          employee_id?: string
          end_date?: string | null
          id?: string
          is_current?: boolean | null
          salary?: number
          start_date?: string
          terms?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employment_contracts_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluation_scores: {
        Row: {
          comments: string | null
          criteria_id: string
          evaluation_id: string
          id: string
          score: number
        }
        Insert: {
          comments?: string | null
          criteria_id: string
          evaluation_id: string
          id?: string
          score: number
        }
        Update: {
          comments?: string | null
          criteria_id?: string
          evaluation_id?: string
          id?: string
          score?: number
        }
        Relationships: [
          {
            foreignKeyName: "evaluation_scores_criteria_id_fkey"
            columns: ["criteria_id"]
            isOneToOne: false
            referencedRelation: "performance_criteria"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluation_scores_evaluation_id_fkey"
            columns: ["evaluation_id"]
            isOneToOne: false
            referencedRelation: "performance_evaluations"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_schedules: {
        Row: {
          application_id: string
          created_at: string
          feedback: string | null
          id: string
          interviewer_id: string | null
          is_completed: boolean | null
          location: string | null
          notes: string | null
          scheduled_date: string
          updated_at: string
        }
        Insert: {
          application_id: string
          created_at?: string
          feedback?: string | null
          id?: string
          interviewer_id?: string | null
          is_completed?: boolean | null
          location?: string | null
          notes?: string | null
          scheduled_date: string
          updated_at?: string
        }
        Update: {
          application_id?: string
          created_at?: string
          feedback?: string | null
          id?: string
          interviewer_id?: string | null
          is_completed?: boolean | null
          location?: string | null
          notes?: string | null
          scheduled_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "interview_schedules_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "job_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interview_schedules_interviewer_id_fkey"
            columns: ["interviewer_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      job_applications: {
        Row: {
          applicant_id: string
          applied_at: string
          id: string
          job_posting_id: string
          notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["application_status"]
        }
        Insert: {
          applicant_id: string
          applied_at?: string
          id?: string
          job_posting_id: string
          notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["application_status"]
        }
        Update: {
          applicant_id?: string
          applied_at?: string
          id?: string
          job_posting_id?: string
          notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["application_status"]
        }
        Relationships: [
          {
            foreignKeyName: "job_applications_applicant_id_fkey"
            columns: ["applicant_id"]
            isOneToOne: false
            referencedRelation: "applicants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_applications_job_posting_id_fkey"
            columns: ["job_posting_id"]
            isOneToOne: false
            referencedRelation: "job_postings"
            referencedColumns: ["id"]
          },
        ]
      }
      job_postings: {
        Row: {
          created_at: string
          deadline: string | null
          description: string
          id: string
          is_active: boolean | null
          position_id: string | null
          posted_by: string | null
          requirements: string | null
          responsibilities: string | null
          salary_range_max: number | null
          salary_range_min: number | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deadline?: string | null
          description: string
          id?: string
          is_active?: boolean | null
          position_id?: string | null
          posted_by?: string | null
          requirements?: string | null
          responsibilities?: string | null
          salary_range_max?: number | null
          salary_range_min?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deadline?: string | null
          description?: string
          id?: string
          is_active?: boolean | null
          position_id?: string | null
          posted_by?: string | null
          requirements?: string | null
          responsibilities?: string | null
          salary_range_max?: number | null
          salary_range_min?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_postings_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_tasks: {
        Row: {
          created_at: string
          department_id: string | null
          description: string | null
          id: string
          is_mandatory: boolean | null
          title: string
        }
        Insert: {
          created_at?: string
          department_id?: string | null
          description?: string | null
          id?: string
          is_mandatory?: boolean | null
          title: string
        }
        Update: {
          created_at?: string
          department_id?: string | null
          description?: string | null
          id?: string
          is_mandatory?: boolean | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_tasks_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_periods: {
        Row: {
          created_at: string
          id: string
          is_processed: boolean | null
          pay_date: string
          period_end: string
          period_start: string
          processed_at: string | null
          processed_by: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_processed?: boolean | null
          pay_date: string
          period_end: string
          period_start: string
          processed_at?: string | null
          processed_by?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_processed?: boolean | null
          pay_date?: string
          period_end?: string
          period_start?: string
          processed_at?: string | null
          processed_by?: string | null
        }
        Relationships: []
      }
      payroll_records: {
        Row: {
          allowances: number | null
          basic_salary: number
          created_at: string
          deductions: number | null
          employee_id: string
          id: string
          is_paid: boolean | null
          net_pay: number
          paid_at: string | null
          period_id: string
        }
        Insert: {
          allowances?: number | null
          basic_salary: number
          created_at?: string
          deductions?: number | null
          employee_id: string
          id?: string
          is_paid?: boolean | null
          net_pay: number
          paid_at?: string | null
          period_id: string
        }
        Update: {
          allowances?: number | null
          basic_salary?: number
          created_at?: string
          deductions?: number | null
          employee_id?: string
          id?: string
          is_paid?: boolean | null
          net_pay?: number
          paid_at?: string | null
          period_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payroll_records_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_records_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "payroll_periods"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_criteria: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          weight: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          weight?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          weight?: number | null
        }
        Relationships: []
      }
      performance_evaluations: {
        Row: {
          areas_for_improvement: string | null
          created_at: string
          employee_id: string
          evaluation_period_end: string
          evaluation_period_start: string
          evaluator_id: string
          id: string
          overall_rating: number | null
          recommendations: string | null
          status: Database["public"]["Enums"]["evaluation_status"]
          strengths: string | null
          updated_at: string
        }
        Insert: {
          areas_for_improvement?: string | null
          created_at?: string
          employee_id: string
          evaluation_period_end: string
          evaluation_period_start: string
          evaluator_id: string
          id?: string
          overall_rating?: number | null
          recommendations?: string | null
          status?: Database["public"]["Enums"]["evaluation_status"]
          strengths?: string | null
          updated_at?: string
        }
        Update: {
          areas_for_improvement?: string | null
          created_at?: string
          employee_id?: string
          evaluation_period_end?: string
          evaluation_period_start?: string
          evaluator_id?: string
          id?: string
          overall_rating?: number | null
          recommendations?: string | null
          status?: Database["public"]["Enums"]["evaluation_status"]
          strengths?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "performance_evaluations_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_evaluations_evaluator_id_fkey"
            columns: ["evaluator_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      positions: {
        Row: {
          created_at: string
          department_id: string | null
          description: string | null
          id: string
          is_active: boolean | null
          max_salary: number | null
          min_salary: number | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          department_id?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          max_salary?: number | null
          min_salary?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          department_id?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          max_salary?: number | null
          min_salary?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "positions_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          city: string | null
          created_at: string
          date_of_birth: string | null
          email: string
          first_name: string
          gender: string | null
          id: string
          last_name: string
          middle_name: string | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          date_of_birth?: string | null
          email: string
          first_name: string
          gender?: string | null
          id?: string
          last_name: string
          middle_name?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string
          first_name?: string
          gender?: string | null
          id?: string
          last_name?: string
          middle_name?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      training_programs: {
        Row: {
          created_at: string
          description: string | null
          duration_hours: number | null
          id: string
          is_mandatory: boolean | null
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_hours?: number | null
          id?: string
          is_mandatory?: boolean | null
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_hours?: number | null
          id?: string
          is_mandatory?: boolean | null
          title?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      acknowledge_department_flow: {
        Args: {
          _error?: string | null
          _event_id: string
          _response?: Json
          _status?: string
        }
        Returns: Json
      }
      dispatch_department_flow: {
        Args: {
          _event_code?: string | null
          _payload?: Json
          _requested_by?: string | null
          _source_department_key: string
          _source_record_id?: string | null
          _target_department_key: string
        }
        Returns: Json
      }
      dispatch_to_cashier: {
        Args: {
          _event_code?: string | null
          _payload?: Json
          _requested_by?: string | null
          _source_record_id?: string | null
        }
        Returns: Json
      }
      dispatch_to_clinic: {
        Args: {
          _event_code?: string | null
          _payload?: Json
          _requested_by?: string | null
          _source_record_id?: string | null
        }
        Returns: Json
      }
      dispatch_to_comlab: {
        Args: {
          _event_code?: string | null
          _payload?: Json
          _requested_by?: string | null
          _source_record_id?: string | null
        }
        Returns: Json
      }
      dispatch_to_crad: {
        Args: {
          _event_code?: string | null
          _payload?: Json
          _requested_by?: string | null
          _source_record_id?: string | null
        }
        Returns: Json
      }
      dispatch_to_guidance: {
        Args: {
          _event_code?: string | null
          _payload?: Json
          _requested_by?: string | null
          _source_record_id?: string | null
        }
        Returns: Json
      }
      dispatch_to_pmed: {
        Args: {
          _event_code?: string | null
          _payload?: Json
          _requested_by?: string | null
          _source_record_id?: string | null
        }
        Returns: Json
      }
      dispatch_to_prefect: {
        Args: {
          _event_code?: string | null
          _payload?: Json
          _requested_by?: string | null
          _source_record_id?: string | null
        }
        Returns: Json
      }
      dispatch_to_registrar: {
        Args: {
          _event_code?: string | null
          _payload?: Json
          _requested_by?: string | null
          _source_record_id?: string | null
        }
        Returns: Json
      }
      dispatch_department_employee_directory: {
        Args: {
          _department_id: string
          _include_inactive?: boolean
          _metadata?: Json
          _only_primary?: boolean
          _requested_by?: string | null
          _target_department_key?: string | null
        }
        Returns: Json
      }
      dispatch_employee_profile_to_connected_departments: {
        Args: {
          _employee_id: string
          _metadata?: Json
          _only_primary?: boolean
          _requested_by?: string | null
        }
        Returns: Json
      }
      dispatch_employee_profile_to_department: {
        Args: {
          _employee_id: string
          _event_code?: string | null
          _metadata?: Json
          _requested_by?: string | null
          _target_department_key: string
        }
        Returns: Json
      }
      dispatch_hr_instructor_to_registrar: {
        Args: {
          _college_unit: string
          _instructor_id: string
          _remarks?: string | null
          _requested_by?: string | null
          _schedule_matrix?: Json
          _semester: string
          _teaching_load?: Json
        }
        Returns: Json
      }
      build_employee_integration_payload: {
        Args: {
          _employee_id: string
          _target_department_key?: string | null
        }
        Returns: Json
      }
      convert_hired_applicant_to_employee: {
        Args: {
          _applicant_id: string
          _applicant_user_id: string
          _contract_type?: Database["public"]["Enums"]["contract_type"]
          _department_id: string | null
          _employee_type: Database["public"]["Enums"]["employee_type"]
          _hire_date: string
          _position_id: string | null
          _salary?: number | null
        }
        Returns: Json
      }
      get_hr_instructor_registrar_history: {
        Args: {
          _instructor_id: string
          _limit?: number | null
        }
        Returns: Json
      }
      get_hr_instructors: {
        Args: {
          _employment_status?: string | null
          _limit?: number | null
          _search?: string | null
        }
        Returns: Json
      }
      get_department_flow_events: {
        Args: {
          _counterparty_department_key?: string | null
          _department_key?: string | null
          _direction?: string | null
          _event_code?: string | null
          _limit?: number | null
          _status?: string | null
        }
        Returns: Json
      }
      get_department_flow_status: {
        Args: {
          _correlation_id?: string | null
          _event_id?: string | null
        }
        Returns: Json
      }
      get_department_integration_registry: {
        Args: { _source_department_key?: string | null }
        Returns: Json
      }
      get_integration_ready_employees: {
        Args: {
          _include_inactive?: boolean
          _only_admins?: boolean
          _target_department_key?: string | null
        }
        Returns: Json
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "system_admin" | "hr_admin" | "employee" | "applicant"
      application_status: "applied" | "interview" | "hired" | "rejected"
      contract_type: "full_time" | "part_time" | "contractual" | "temporary"
      employee_type: "teacher" | "principal" | "registrar" | "staff" | "admin"
      employment_status: "active" | "on_leave" | "terminated" | "probation"
      evaluation_status: "pending" | "in_progress" | "completed"
      training_status: "scheduled" | "in_progress" | "completed" | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["system_admin", "hr_admin", "employee", "applicant"],
      application_status: ["applied", "interview", "hired", "rejected"],
      contract_type: ["full_time", "part_time", "contractual", "temporary"],
      employee_type: ["teacher", "principal", "registrar", "staff", "admin"],
      employment_status: ["active", "on_leave", "terminated", "probation"],
      evaluation_status: ["pending", "in_progress", "completed"],
      training_status: ["scheduled", "in_progress", "completed", "cancelled"],
    },
  },
} as const
