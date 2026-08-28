"""
base.py — Abstract base for all competitor data providers.

Any provider (web scraper, API, data feed) must implement this interface.
CompetitorSyncService depends only on this abstraction, not on any specific provider.
"""
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Optional


@dataclass
class CandidateProduct:
    """
    Standardized structure returned by every provider.
    Maps to what our matching engine and DB layer expect.
    """
    title: str
    price: Optional[float]        # Current selling price (INR). None = not extracted.
    currency: str = "INR"
    url: Optional[str] = None
    is_available: bool = True
    brand: Optional[str] = None
    category: Optional[str] = None
    model: Optional[str] = None
    storage: Optional[str] = None
    ram: Optional[str] = None
    variant: Optional[str] = None
    color: Optional[str] = None
    product_id: Optional[str] = None  # Retailer's own ID (ASIN, etc.)
    raw_price_text: Optional[str] = None  # Original price text before parsing


@dataclass
class RetrievalResult:
    """
    Full result of a provider fetch attempt, including diagnostics.
    """
    http_status: Optional[int] = None
    accessible: bool = False      # Did we get a 200?
    content_usable: bool = False  # Is the page a real product/search page?
    block_reason: Optional[str] = None   # e.g. "HTTP 403", "CAPTCHA detected"
    candidates: list = field(default_factory=list)  # List[CandidateProduct]
    error: Optional[str] = None   # Any exception message
    metadata: dict = field(default_factory=dict)  # For tracking usage credits, diagnostics, etc.


class CompetitorDataProvider(ABC):
    """
    Abstract base class for all competitor data providers.
    """

    @property
    @abstractmethod
    def name(self) -> str:
        """Human-readable provider name e.g. 'Amazon India Web'"""
        ...

    @abstractmethod
    def get_candidates(
        self,
        product_name: str,
        brand: str,
        category: str = "",
        **kwargs,
    ) -> RetrievalResult:
        """
        Retrieve candidate products for the given internal product.
        Returns a RetrievalResult containing zero or more CandidateProducts.
        Must NOT bypass any website protection mechanism.
        """
        ...
