-- BWE - Ahmad bin Hassan
-- Status: submitted
INSERT INTO jkm_applications (
    id,
    program_id,
    external_reference,
    source_system,
    reference_no,
    applicant_name,
    applicant_identification_no,
    application_data,
    status,
    submitted_at,
    updated_at
)
SELECT
    'jkm-demo-001',
    'jkm-program-bwe',
    'JKM-DEMO-001',
    'jkm-demo-seed',
    'JKM-BWE-2026-DEMO001',
    'Ahmad bin Hassan',
    NULL,
    '{
        "demo": true,
        "programCode": "BWE",
        "applicant": {
            "fullName": "Ahmad bin Hassan"
        },
        "household": {
            "estimatedMonthlyIncome": 1500
        },
        "notes": "Fictional demonstration application; not a real applicant."
    }',
    'submitted',
    '2026-10-17 09:00:00',
    '2026-10-17 09:00:00'
WHERE NOT EXISTS (
    SELECT 1
    FROM jkm_applications
    WHERE source_system = 'jkm-demo-seed'
      AND external_reference = 'JKM-DEMO-001'
);

-- BWE - Siti Aminah binti Omar
-- Status: under_review
INSERT INTO jkm_applications (
    id,
    program_id,
    external_reference,
    source_system,
    reference_no,
    applicant_name,
    applicant_identification_no,
    application_data,
    status,
    submitted_at,
    updated_at
)
SELECT
    'jkm-demo-002',
    'jkm-program-bwe',
    'JKM-DEMO-002',
    'jkm-demo-seed',
    'JKM-BWE-2026-DEMO002',
    'Siti Aminah binti Omar',
    NULL,
    '{
        "demo": true,
        "programCode": "BWE",
        "applicant": {
            "fullName": "Siti Aminah binti Omar"
        },
        "household": {
            "estimatedMonthlyIncome": 1850
        },
        "notes": "Fictional demonstration application; not a real applicant."
    }',
    'under_review',
    '2026-10-18 10:30:00',
    '2026-10-18 10:30:00'
WHERE NOT EXISTS (
    SELECT 1
    FROM jkm_applications
    WHERE source_system = 'jkm-demo-seed'
      AND external_reference = 'JKM-DEMO-002'
);

-- BA - Muhammad Farid bin Ali
-- Status: submitted
INSERT INTO jkm_applications (
    id,
    program_id,
    external_reference,
    source_system,
    reference_no,
    applicant_name,
    applicant_identification_no,
    application_data,
    status,
    submitted_at,
    updated_at
)
SELECT
    'jkm-demo-003',
    'jkm-program-ba',
    'JKM-DEMO-003',
    'jkm-demo-seed',
    'JKM-BA-2026-DEMO003',
    'Muhammad Farid bin Ali',
    NULL,
    '{
        "demo": true,
        "programCode": "BA",
        "applicant": {
            "fullName": "Muhammad Farid bin Ali"
        },
        "household": {
            "estimatedMonthlyIncome": 1200
        },
        "notes": "Fictional demonstration application; not a real applicant."
    }',
    'submitted',
    '2026-10-19 11:15:00',
    '2026-10-19 11:15:00'
WHERE NOT EXISTS (
    SELECT 1
    FROM jkm_applications
    WHERE source_system = 'jkm-demo-seed'
      AND external_reference = 'JKM-DEMO-003'
);

-- BA - Nur Aisyah binti Rahman
-- Status: approved
INSERT INTO jkm_applications (
    id,
    program_id,
    external_reference,
    source_system,
    reference_no,
    applicant_name,
    applicant_identification_no,
    application_data,
    status,
    submitted_at,
    updated_at
)
SELECT
    'jkm-demo-004',
    'jkm-program-ba',
    'JKM-DEMO-004',
    'jkm-demo-seed',
    'JKM-BA-2026-DEMO004',
    'Nur Aisyah binti Rahman',
    NULL,
    '{
        "demo": true,
        "programCode": "BA",
        "applicant": {
            "fullName": "Nur Aisyah binti Rahman"
        },
        "household": {
            "estimatedMonthlyIncome": 1700
        },
        "notes": "Fictional demonstration application; not a real applicant."
    }',
    'approved',
    '2026-10-20 14:00:00',
    '2026-10-20 14:00:00'
WHERE NOT EXISTS (
    SELECT 1
    FROM jkm_applications
    WHERE source_system = 'jkm-demo-seed'
      AND external_reference = 'JKM-DEMO-004'
);

-- BAT - Lim Wei Jian
-- Status: additional_information_required
INSERT INTO jkm_applications (
    id,
    program_id,
    external_reference,
    source_system,
    reference_no,
    applicant_name,
    applicant_identification_no,
    application_data,
    status,
    submitted_at,
    updated_at
)
SELECT
    'jkm-demo-005',
    'jkm-program-bat',
    'JKM-DEMO-005',
    'jkm-demo-seed',
    'JKM-BAT-2026-DEMO005',
    'Lim Wei Jian',
    NULL,
    '{
        "demo": true,
        "programCode": "BAT",
        "applicant": {
            "fullName": "Lim Wei Jian"
        },
        "household": {
            "estimatedMonthlyIncome": 2100
        },
        "notes": "Fictional demonstration application; not a real applicant."
    }',
    'additional_information_required',
    '2026-10-21 08:45:00',
    '2026-10-21 08:45:00'
WHERE NOT EXISTS (
    SELECT 1
    FROM jkm_applications
    WHERE source_system = 'jkm-demo-seed'
      AND external_reference = 'JKM-DEMO-005'
);

-- BAT - Tan Mei Ling
-- Status: under_review
INSERT INTO jkm_applications (
    id,
    program_id,
    external_reference,
    source_system,
    reference_no,
    applicant_name,
    applicant_identification_no,
    application_data,
    status,
    submitted_at,
    updated_at
)
SELECT
    'jkm-demo-006',
    'jkm-program-bat',
    'JKM-DEMO-006',
    'jkm-demo-seed',
    'JKM-BAT-2026-DEMO006',
    'Tan Mei Ling',
    NULL,
    '{
        "demo": true,
        "programCode": "BAT",
        "applicant": {
            "fullName": "Tan Mei Ling"
        },
        "household": {
            "estimatedMonthlyIncome": 1900
        },
        "notes": "Fictional demonstration application; not a real applicant."
    }',
    'under_review',
    '2026-10-22 13:20:00',
    '2026-10-22 13:20:00'
WHERE NOT EXISTS (
    SELECT 1
    FROM jkm_applications
    WHERE source_system = 'jkm-demo-seed'
      AND external_reference = 'JKM-DEMO-006'
);

-- BPT - Raj Kumar
-- Status: rejected
INSERT INTO jkm_applications (
    id,
    program_id,
    external_reference,
    source_system,
    reference_no,
    applicant_name,
    applicant_identification_no,
    application_data,
    status,
    submitted_at,
    updated_at
)
SELECT
    'jkm-demo-007',
    'jkm-program-bpt',
    'JKM-DEMO-007',
    'jkm-demo-seed',
    'JKM-BPT-2026-DEMO007',
    'Raj Kumar',
    NULL,
    '{
        "demo": true,
        "programCode": "BPT",
        "applicant": {
            "fullName": "Raj Kumar"
        },
        "household": {
            "estimatedMonthlyIncome": 2300
        },
        "notes": "Fictional demonstration application; not a real applicant."
    }',
    'rejected',
    '2026-10-23 15:10:00',
    '2026-10-23 15:10:00'
WHERE NOT EXISTS (
    SELECT 1
    FROM jkm_applications
    WHERE source_system = 'jkm-demo-seed'
      AND external_reference = 'JKM-DEMO-007'
);

-- 8. BPT - Nurul Huda binti Ismail
-- Status: cancelled
INSERT INTO jkm_applications (
    id,
    program_id,
    external_reference,
    source_system,
    reference_no,
    applicant_name,
    applicant_identification_no,
    application_data,
    status,
    submitted_at,
    updated_at
)
SELECT
    'jkm-demo-008',
    'jkm-program-bpt',
    'JKM-DEMO-008',
    'jkm-demo-seed',
    'JKM-BPT-2026-DEMO008',
    'Nurul Huda binti Ismail',
    NULL,
    '{
        "demo": true,
        "programCode": "BPT",
        "applicant": {
            "fullName": "Nurul Huda binti Ismail"
        },
        "household": {
            "estimatedMonthlyIncome": 1400
        },
        "notes": "Fictional demonstration application; not a real applicant."
    }',
    'cancelled',
    '2026-10-24 16:05:00',
    '2026-10-24 16:05:00'
WHERE NOT EXISTS (
    SELECT 1
    FROM jkm_applications
    WHERE source_system = 'jkm-demo-seed'
      AND external_reference = 'JKM-DEMO-008'
);
