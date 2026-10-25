-- DEMO001 - BWE
-- submitted
INSERT INTO jkm_application_status_history (
    id,
    application_id,
    previous_status,
    new_status,
    changed_by,
    remarks,
    changed_at
)
SELECT
    'jkm-demo-history-001-01',
    id,
    NULL,
    'submitted',
    'jkm-demo-seed',
    'Application submitted',
    '2026-10-17 09:00:00'
FROM jkm_applications
WHERE source_system = 'jkm-demo-seed'
  AND external_reference = 'JKM-DEMO-001'
  AND NOT EXISTS (
      SELECT 1
      FROM jkm_application_status_history
      WHERE id = 'jkm-demo-history-001-01'
  );

-- DEMO002 - BWE
-- submitted -> under_review
INSERT INTO jkm_application_status_history (
    id, application_id, previous_status, new_status,
    changed_by, remarks, changed_at
)
SELECT
    'jkm-demo-history-002-01',
    id,
    NULL,
    'submitted',
    'jkm-demo-seed',
    'Application submitted',
    '2026-10-18 10:30:00'
FROM jkm_applications
WHERE source_system = 'jkm-demo-seed'
  AND external_reference = 'JKM-DEMO-002'
  AND NOT EXISTS (
      SELECT 1 FROM jkm_application_status_history
      WHERE id = 'jkm-demo-history-002-01'
  );

INSERT INTO jkm_application_status_history (
    id, application_id, previous_status, new_status,
    changed_by, remarks, changed_at
)
SELECT
    'jkm-demo-history-002-02',
    id,
    'submitted',
    'under_review',
    'admin',
    'Application review started',
    '2026-10-19 09:00:00'
FROM jkm_applications
WHERE source_system = 'jkm-demo-seed'
  AND external_reference = 'JKM-DEMO-002'
  AND NOT EXISTS (
      SELECT 1 FROM jkm_application_status_history
      WHERE id = 'jkm-demo-history-002-02'
  );

-- DEMO003 - BA
-- submitted
INSERT INTO jkm_application_status_history (
    id, application_id, previous_status, new_status,
    changed_by, remarks, changed_at
)
SELECT
    'jkm-demo-history-003-01',
    id,
    NULL,
    'submitted',
    'jkm-demo-seed',
    'Application submitted',
    '2026-10-19 11:15:00'
FROM jkm_applications
WHERE source_system = 'jkm-demo-seed'
  AND external_reference = 'JKM-DEMO-003'
  AND NOT EXISTS (
      SELECT 1 FROM jkm_application_status_history
      WHERE id = 'jkm-demo-history-003-01'
  );

-- DEMO004 - BA
-- submitted -> under_review -> approved
INSERT INTO jkm_application_status_history (
    id, application_id, previous_status, new_status,
    changed_by, remarks, changed_at
)
SELECT
    'jkm-demo-history-004-01',
    id,
    NULL,
    'submitted',
    'jkm-demo-seed',
    'Application submitted',
    '2026-10-20 14:00:00'
FROM jkm_applications
WHERE source_system = 'jkm-demo-seed'
  AND external_reference = 'JKM-DEMO-004'
  AND NOT EXISTS (
      SELECT 1 FROM jkm_application_status_history
      WHERE id = 'jkm-demo-history-004-01'
  );

INSERT INTO jkm_application_status_history (
    id, application_id, previous_status, new_status,
    changed_by, remarks, changed_at
)
SELECT
    'jkm-demo-history-004-02',
    id,
    'submitted',
    'under_review',
    'admin',
    'Application review started',
    '2026-10-21 09:30:00'
FROM jkm_applications
WHERE source_system = 'jkm-demo-seed'
  AND external_reference = 'JKM-DEMO-004'
  AND NOT EXISTS (
      SELECT 1 FROM jkm_application_status_history
      WHERE id = 'jkm-demo-history-004-02'
  );

INSERT INTO jkm_application_status_history (
    id, application_id, previous_status, new_status,
    changed_by, remarks, changed_at
)
SELECT
    'jkm-demo-history-004-03',
    id,
    'under_review',
    'approved',
    'admin',
    'Application approved',
    '2026-10-22 15:00:00'
FROM jkm_applications
WHERE source_system = 'jkm-demo-seed'
  AND external_reference = 'JKM-DEMO-004'
  AND NOT EXISTS (
      SELECT 1 FROM jkm_application_status_history
      WHERE id = 'jkm-demo-history-004-03'
  );

-- DEMO005 - BAT
-- submitted -> under_review -> additional_information_required
INSERT INTO jkm_application_status_history (
    id, application_id, previous_status, new_status,
    changed_by, remarks, changed_at
)
SELECT
    'jkm-demo-history-005-01',
    id,
    NULL,
    'submitted',
    'jkm-demo-seed',
    'Application submitted',
    '2026-10-21 08:45:00'
FROM jkm_applications
WHERE source_system = 'jkm-demo-seed'
  AND external_reference = 'JKM-DEMO-005'
  AND NOT EXISTS (
      SELECT 1 FROM jkm_application_status_history
      WHERE id = 'jkm-demo-history-005-01'
  );

INSERT INTO jkm_application_status_history (
    id, application_id, previous_status, new_status,
    changed_by, remarks, changed_at
)
SELECT
    'jkm-demo-history-005-02',
    id,
    'submitted',
    'under_review',
    'admin',
    'Application review started',
    '2026-10-22 10:00:00'
FROM jkm_applications
WHERE source_system = 'jkm-demo-seed'
  AND external_reference = 'JKM-DEMO-005'
  AND NOT EXISTS (
      SELECT 1 FROM jkm_application_status_history
      WHERE id = 'jkm-demo-history-005-02'
  );

INSERT INTO jkm_application_status_history (
    id, application_id, previous_status, new_status,
    changed_by, remarks, changed_at
)
SELECT
    'jkm-demo-history-005-03',
    id,
    'under_review',
    'additional_information_required',
    'admin',
    'Additional supporting information requested',
    '2026-10-23 11:30:00'
FROM jkm_applications
WHERE source_system = 'jkm-demo-seed'
  AND external_reference = 'JKM-DEMO-005'
  AND NOT EXISTS (
      SELECT 1 FROM jkm_application_status_history
      WHERE id = 'jkm-demo-history-005-03'
  );

-- DEMO006 - BAT
-- submitted -> under_review
INSERT INTO jkm_application_status_history (
    id, application_id, previous_status, new_status,
    changed_by, remarks, changed_at
)
SELECT
    'jkm-demo-history-006-01',
    id,
    NULL,
    'submitted',
    'jkm-demo-seed',
    'Application submitted',
    '2026-10-22 13:20:00'
FROM jkm_applications
WHERE source_system = 'jkm-demo-seed'
  AND external_reference = 'JKM-DEMO-006'
  AND NOT EXISTS (
      SELECT 1 FROM jkm_application_status_history
      WHERE id = 'jkm-demo-history-006-01'
  );

INSERT INTO jkm_application_status_history (
    id, application_id, previous_status, new_status,
    changed_by, remarks, changed_at
)
SELECT
    'jkm-demo-history-006-02',
    id,
    'submitted',
    'under_review',
    'admin',
    'Application review started',
    '2026-10-23 09:15:00'
FROM jkm_applications
WHERE source_system = 'jkm-demo-seed'
  AND external_reference = 'JKM-DEMO-006'
  AND NOT EXISTS (
      SELECT 1 FROM jkm_application_status_history
      WHERE id = 'jkm-demo-history-006-02'
  );

-- DEMO007 - BPT
-- submitted -> under_review -> rejected
INSERT INTO jkm_application_status_history (
    id, application_id, previous_status, new_status,
    changed_by, remarks, changed_at
)
SELECT
    'jkm-demo-history-007-01',
    id,
    NULL,
    'submitted',
    'jkm-demo-seed',
    'Application submitted',
    '2026-10-23 15:10:00'
FROM jkm_applications
WHERE source_system = 'jkm-demo-seed'
  AND external_reference = 'JKM-DEMO-007'
  AND NOT EXISTS (
      SELECT 1 FROM jkm_application_status_history
      WHERE id = 'jkm-demo-history-007-01'
  );

INSERT INTO jkm_application_status_history (
    id, application_id, previous_status, new_status,
    changed_by, remarks, changed_at
)
SELECT
    'jkm-demo-history-007-02',
    id,
    'submitted',
    'under_review',
    'admin',
    'Application review started',
    '2026-10-24 09:00:00'
FROM jkm_applications
WHERE source_system = 'jkm-demo-seed'
  AND external_reference = 'JKM-DEMO-007'
  AND NOT EXISTS (
      SELECT 1 FROM jkm_application_status_history
      WHERE id = 'jkm-demo-history-007-02'
  );

INSERT INTO jkm_application_status_history (
    id, application_id, previous_status, new_status,
    changed_by, remarks, changed_at
)
SELECT
    'jkm-demo-history-007-03',
    id,
    'under_review',
    'rejected',
    'admin',
    'Application rejected',
    '2026-10-24 14:30:00'
FROM jkm_applications
WHERE source_system = 'jkm-demo-seed'
  AND external_reference = 'JKM-DEMO-007'
  AND NOT EXISTS (
      SELECT 1 FROM jkm_application_status_history
      WHERE id = 'jkm-demo-history-007-03'
  );

-- DEMO008 - BPT
-- submitted -> cancelled
INSERT INTO jkm_application_status_history (
    id, application_id, previous_status, new_status,
    changed_by, remarks, changed_at
)
SELECT
    'jkm-demo-history-008-01',
    id,
    NULL,
    'submitted',
    'jkm-demo-seed',
    'Application submitted',
    '2026-10-24 16:05:00'
FROM jkm_applications
WHERE source_system = 'jkm-demo-seed'
  AND external_reference = 'JKM-DEMO-008'
  AND NOT EXISTS (
      SELECT 1 FROM jkm_application_status_history
      WHERE id = 'jkm-demo-history-008-01'
  );

INSERT INTO jkm_application_status_history (
    id, application_id, previous_status, new_status,
    changed_by, remarks, changed_at
)
SELECT
    'jkm-demo-history-008-02',
    id,
    'submitted',
    'cancelled',
    'admin',
    'Application cancelled',
    '2026-10-25 09:00:00'
FROM jkm_applications
WHERE source_system = 'jkm-demo-seed'
  AND external_reference = 'JKM-DEMO-008'
  AND NOT EXISTS (
      SELECT 1 FROM jkm_application_status_history
      WHERE id = 'jkm-demo-history-008-02'
  );
