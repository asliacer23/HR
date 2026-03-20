# Department Integration Endpoints

This HR system is prepared to coordinate dataflow with the connected department applications through Supabase RPC endpoints.

Base endpoint pattern:

```text
POST /rest/v1/rpc/<function_name>
```

Primary RPC endpoints:

- `get_department_integration_registry`
- `dispatch_department_flow`
- `get_department_flow_status`
- `acknowledge_department_flow`

Department-specific dispatch endpoints from HR:

- `dispatch_to_cashier`
- `dispatch_to_clinic`
- `dispatch_to_comlab`
- `dispatch_to_crad`
- `dispatch_to_guidance`
- `dispatch_to_pmed`
- `dispatch_to_prefect`
- `dispatch_to_registrar`

Connected department modules:

- `cashier-system`
- `clinicsystem`
- `Computer-Laboratory`
- `CRADManagement`
- `guidance-system`
- `PMED`
- `PrefectManagementsSystem`
- `Registrar`

Example payload for `dispatch_to_cashier`:

```json
{
  "_event_code": "payroll_submission",
  "_source_record_id": "PAYROLL-BATCH-2026-03A",
  "_payload": {
    "batch_label": "March 1-15 Payroll",
    "pay_period": "2026-03-01 to 2026-03-15",
    "employee_count": 6,
    "net_amount": 126400
  }
}
```

Example payload for `dispatch_department_flow`:

```json
{
  "_source_department_key": "hr",
  "_target_department_key": "registrar",
  "_event_code": "faculty_assignment_validation",
  "_source_record_id": "FAC-LOAD-LEA-2026Q1",
  "_payload": {
    "employee_id": "f50e8400-e29b-41d4-a716-446655440008",
    "employee_name": "Lea Martinez",
    "semester": "2nd Semester",
    "college_unit": "Senior High School"
  }
}
```

Example payload for `acknowledge_department_flow`:

```json
{
  "_event_id": "event-uuid-here",
  "_status": "completed",
  "_response": {
    "status": "validated",
    "remarks": "Handled by connected department app"
  },
  "_error": null
}
```

Expected response fields:

- `ok`
- `event_id`
- `correlation_id`
- `route_key`
- `status`
- `dispatch_endpoint`
- `message`

Registry and event data are stored in:

- `public.integration_departments`
- `public.integration_flow_routes`
- `public.integration_flow_events`
