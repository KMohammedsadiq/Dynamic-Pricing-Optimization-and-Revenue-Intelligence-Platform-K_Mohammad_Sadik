def calculate_financials(revenue, units_sold, cost_price):
    rev = float(revenue or 0)
    units = int(units_sold or 0)
    cost = float(cost_price or 0)

    cogs = units * cost
    gross_profit = rev - cogs
    margin_pct = (gross_profit / rev * 100) if rev > 0 else 0.0
    asp = (rev / units) if units > 0 else 0.0

    return {
        "revenue": rev,
        "units_sold": units,
        "cost_price": cost,
        "cogs": cogs,
        "gross_profit": gross_profit,
        "profit_margin_pct": margin_pct,
        "asp": asp
    }

def get_risk_status(margin_pct):
    if margin_pct is None:
        return "Insufficient Data"
    if margin_pct < 10.0:
        return "High Risk"
    elif 10.0 <= margin_pct < 15.0:
        return "At Risk"
    elif 15.0 <= margin_pct < 30.0:
        return "Healthy"
    else:
        return "High Margin"
