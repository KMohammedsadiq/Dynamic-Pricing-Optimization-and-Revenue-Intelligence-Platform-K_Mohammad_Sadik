import os

class CurrencyService:
    def __init__(self):
        # Current Exchange Rate (USD to INR)
        # In a real application, this might be fetched from an external API or DB
        self.USD_TO_INR = 83.50

    def convert_to_inr(self, amount_usd: float) -> float:
        """
        Converts a USD amount to INR and rounds to 2 decimal places.
        If the amount is None, returns None.
        """
        if amount_usd is None:
            return None
        
        converted = float(amount_usd) * self.USD_TO_INR
        return round(converted, 2)

# Singleton instance
currency_service = CurrencyService()
