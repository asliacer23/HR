-- =====================================================
-- Make evaluator_id nullable for HR Admins
-- =====================================================

-- Drop the existing constraint
ALTER TABLE public.performance_evaluations
DROP CONSTRAINT IF EXISTS performance_evaluations_evaluator_id_fkey;

-- Add back the constraint with ON DELETE SET NULL
ALTER TABLE public.performance_evaluations
ADD CONSTRAINT performance_evaluations_evaluator_id_fkey 
  FOREIGN KEY (evaluator_id) 
  REFERENCES public.employees(id) 
  ON DELETE SET NULL;

-- Make the column nullable
ALTER TABLE public.performance_evaluations
ALTER COLUMN evaluator_id DROP NOT NULL;
