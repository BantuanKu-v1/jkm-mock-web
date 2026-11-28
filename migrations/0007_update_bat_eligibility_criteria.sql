update jkm_programs
set eligibility_criteria = json_insert(
        eligibility_criteria,
        '$.rules[#]',
        json('{
        "ruleCode": "BAT-006",
        "name": "Equipment Cost Exceeds Assistance Limit",
        "conditions": {
            "all": [
                {
                    "ruleMatched": "BAT-001"
                },
                {
                    "field": "application.equipmentCost",
                    "operator": "gt",
                    "value": 20000
                }
            ]
        },
        "result": "further_assessment_required",
        "assessmentNotes": "The estimated equipment cost exceeds the documented maximum BAT assistance amount. JKM assessment is required to determine the applicable assistance amount and available options."
    }')
                           ),
    eligibility_version = 2,
    updated_at = current_timestamp
where code = 'BAT'
  and eligibility_version = 1
  and json_type(eligibility_criteria, '$.rules') = 'array'
  and not exists (
        select 1
        from json_each(eligibility_criteria, '$.rules') as rule
        where json_extract(rule.value, '$.ruleCode') = 'BAT-006'
  );
