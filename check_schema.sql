-- Check sales_reps columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'sales_reps' 
ORDER BY ordinal_position;
