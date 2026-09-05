"""
Working Schedule domain service — deterministic weekly hours calculation.

Phase 2 (Contracts & Working Schedules). Calculates daily and weekly working
hours based on shift start/end times and break durations.
"""

from datetime import time
from typing import TYPE_CHECKING

if TYPE_CHECKING:  # pragma: no cover
    from app.models.working_schedule import WorkingSchedule


def calculate_day_working_hours(
    is_working_day: bool,
    start_time: time | None,
    end_time: time | None,
    break_minutes: int = 0,
) -> float:
    """Calculate decimal working hours for a single day.

    :param is_working_day: Whether the day is classified as a working day.
    :param start_time: Shift start time.
    :param end_time: Shift end time.
    :param break_minutes: Unpaid break duration in minutes.
    :return: Net working hours as float.
    :raises ValueError: If parameters represent invalid shift intervals or negative durations.
    """
    if not is_working_day:
        return 0.0

    if start_time is None or end_time is None:
        raise ValueError("Working days require valid start_time and end_time.")

    if break_minutes < 0:
        raise ValueError("Break duration cannot be negative.")

    start_mins = start_time.hour * 60 + start_time.minute + start_time.second / 60.0
    end_mins = end_time.hour * 60 + end_time.minute + end_time.second / 60.0

    if end_mins <= start_mins:
        raise ValueError("Shift end_time must be after start_time.")

    net_minutes = (end_mins - start_mins) - break_minutes
    if net_minutes < 0:
        raise ValueError(
            "Break duration exceeds shift duration, resulting in negative working time."
        )

    return round(net_minutes / 60.0, 2)


def calculate_weekly_hours(schedule: "WorkingSchedule") -> float:
    """Calculate total weekly working hours for a WorkingSchedule.

    :param schedule: The WorkingSchedule model instance.
    :return: Total weekly hours as float.
    """
    if not schedule.days:
        return 0.0

    total = 0.0
    for day in schedule.days:
        total += calculate_day_working_hours(
            is_working_day=day.is_working_day,
            start_time=day.start_time,
            end_time=day.end_time,
            break_minutes=day.break_minutes,
        )
    return round(total, 2)


def sync_schedule_weekly_hours(schedule: "WorkingSchedule") -> float:
    """Recalculate and update the weekly_hours field on a WorkingSchedule instance.

    :param schedule: The WorkingSchedule model instance.
    :return: Updated weekly_hours float value.
    """
    total = calculate_weekly_hours(schedule)
    schedule.weekly_hours = total
    return total
