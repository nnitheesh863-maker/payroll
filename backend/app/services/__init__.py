"""
Services package — domain services for schedules and contracts.
"""

from app.services.schedule_service import (
    calculate_day_working_hours,
    calculate_weekly_hours,
    sync_schedule_weekly_hours,
)
from app.services.contract_service import (
    ContractConflictError,
    ContractDomainError,
    ContractOverlapError,
    NoApplicableContractError,
    do_date_ranges_overlap,
    get_applicable_contract,
    is_contract_applicable_on_date,
    validate_contract_dates,
    validate_no_overlapping_contracts,
)

__all__ = [
    "calculate_day_working_hours",
    "calculate_weekly_hours",
    "sync_schedule_weekly_hours",
    "ContractDomainError",
    "NoApplicableContractError",
    "ContractConflictError",
    "ContractOverlapError",
    "validate_contract_dates",
    "is_contract_applicable_on_date",
    "do_date_ranges_overlap",
    "validate_no_overlapping_contracts",
    "get_applicable_contract",
]
