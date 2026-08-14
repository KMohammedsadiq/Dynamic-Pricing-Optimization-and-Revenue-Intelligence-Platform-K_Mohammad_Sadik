# backend/ml/calendar_config.py

# A separate, verified calendar source for seasonal/dashboard context.
# This prevents fabricating synthetic holiday flags in the historical demand dataset.
# The dates cover late 2026 and 2027 to support the 365-day forecast horizon.

VERIFIED_CALENDAR = [
    # 2026 (Post-August Cutoff)
    {"date": "2026-08-15", "event_name": "Independence Day", "type": "Holiday"},
    {"date": "2026-08-26", "event_name": "Onam", "type": "Festival"},
    {"date": "2026-09-14", "event_name": "Ganesh Chaturthi", "type": "Festival"},
    {"date": "2026-10-19", "event_name": "Dussehra", "type": "Festival"},
    {"date": "2026-11-08", "event_name": "Diwali", "type": "Festival"},
    {"date": "2026-12-25", "event_name": "Christmas", "type": "Holiday"},
    
    # 2027
    {"date": "2027-01-01", "event_name": "New Year", "type": "Holiday"},
    {"date": "2027-01-26", "event_name": "Republic Day", "type": "Holiday"},
    {"date": "2027-03-10", "event_name": "Eid al-Fitr", "type": "Festival"},
    {"date": "2027-03-22", "event_name": "Holi", "type": "Festival"},
    {"date": "2027-08-15", "event_name": "Independence Day", "type": "Holiday"},
    {"date": "2027-09-03", "event_name": "Ganesh Chaturthi", "type": "Festival"},
    {"date": "2027-09-14", "event_name": "Onam", "type": "Festival"},
    {"date": "2027-10-09", "event_name": "Dussehra", "type": "Festival"},
    {"date": "2027-10-29", "event_name": "Diwali", "type": "Festival"},
    {"date": "2027-12-25", "event_name": "Christmas", "type": "Holiday"}
]
