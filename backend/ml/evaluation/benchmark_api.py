"""
API Performance Benchmark Script
================================
Runs local performance measurements against the FastAPI backend.
It creates a valid JWT token programmatically and uses `requests` to test endpoints.
"""

import os
import sys
import time
import requests
import json

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.core.security import create_access_token

# ── 1. Configuration ──────────────────────────────────────────────────
BASE_URL = "http://127.0.0.1:8000/api/v1"
N_REQUESTS = 10
N_CONCURRENT = 5

ENDPOINTS = [
    {"name": "Executive Summary", "path": "/analytics/executive-summary", "method": "GET"},
    {"name": "Pricing Strategies (Bulk)", "path": "/analytics/pricing-strategies", "method": "GET"},
    {"name": "Single Strategy (ACC001)", "path": "/analytics/pricing-strategy/ACC001", "method": "GET"},
    {"name": "Single Strategy (BOK501)", "path": "/analytics/pricing-strategy/BOK501", "method": "GET"},
    {"name": "Single Strategy (ELE509)", "path": "/analytics/pricing-strategy/ELE509", "method": "GET"},
    {"name": "Profitability Analysis", "path": "/analytics/profitability", "method": "GET"},
]

OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "api_performance_results.json")

# ── 2. Helper functions ───────────────────────────────────────────────
def get_auth_headers():
    token = create_access_token(data={
        "sub": "benchmark@test.com",
        "user_id": 1,
        "role": "Admin"
    })
    return {"Authorization": f"Bearer {token}"}

def measure_endpoint(endpoint, headers, n=N_REQUESTS):
    url = f"{BASE_URL}{endpoint['path']}"
    
    # Warm-up request
    try:
        r = requests.request(endpoint["method"], url, headers=headers, timeout=10)
        r.raise_for_status()
    except Exception as e:
        return {"status": "FAIL (Warmup)", "error": str(e), "min": 0, "max": 0, "avg": 0, "median": 0}

    times = []
    failed = 0
    response_size = len(r.content)

    for i in range(n):
        start = time.time()
        try:
            r = requests.request(endpoint["method"], url, headers=headers, timeout=10)
            r.raise_for_status()
            elapsed = time.time() - start
            times.append(elapsed * 1000) # convert to ms
        except Exception:
            failed += 1

    if not times:
        return {"status": "FAIL", "error": "All requests failed", "min": 0, "max": 0, "avg": 0, "median": 0}

    times.sort()
    return {
        "status": "OK" if failed == 0 else f"{failed} FAILED",
        "requests": n,
        "min": round(times[0], 2),
        "max": round(times[-1], 2),
        "avg": round(sum(times) / len(times), 2),
        "median": round(times[len(times)//2], 2),
        "response_size_bytes": response_size
    }

import concurrent.futures

def concurrent_test(endpoint, headers, n_concurrent):
    url = f"{BASE_URL}{endpoint['path']}"
    
    def fetch():
        start = time.time()
        r = requests.get(url, headers=headers, timeout=10)
        r.raise_for_status()
        return time.time() - start

    times = []
    failed = 0
    with concurrent.futures.ThreadPoolExecutor(max_workers=n_concurrent) as executor:
        futures = [executor.submit(fetch) for _ in range(n_concurrent)]
        for f in concurrent.futures.as_completed(futures):
            try:
                times.append(f.result() * 1000)
            except Exception:
                failed += 1

    if not times:
        return {"status": "FAIL"}

    return {
        "concurrent_requests": n_concurrent,
        "avg_ms": round(sum(times) / len(times), 2),
        "max_ms": round(max(times), 2),
        "failed": failed
    }

def main():
    import argparse
    parser = argparse.ArgumentParser(description="API Benchmark")
    parser.add_argument("--output", default=OUTPUT_PATH, help="Output JSON path")
    args = parser.parse_args()

    print("=" * 65)
    print("API Performance Benchmarking")
    print("NOTE: Local development environment, not production load-test.")
    print("=" * 65)

    headers = get_auth_headers()
    
    # Wait for API to be responsive
    print("Waiting for backend to start...")
    ready = False
    for i in range(10):
        try:
            requests.get("http://127.0.0.1:8000/docs", timeout=2)
            ready = True
            break
        except requests.exceptions.RequestException:
            time.sleep(1)
            
    if not ready:
        print("Backend failed to start or respond!")
        sys.exit(1)
        
    print("Backend is running. Starting sequential tests...\n")
    results = {}
    
    # Sequential Test
    for ep in ENDPOINTS:
        print(f"Testing {ep['name']} ({ep['path']})... ", end="", flush=True)
        res = measure_endpoint(ep, headers)
        print(f"{res['status']} | Avg: {res.get('avg', 'N/A')}ms | Median: {res.get('median', 'N/A')}ms")
        results[ep['name']] = res

    # Concurrent Test
    concurrent_levels = [1, 2, 5, 10]
    concurrent_results = {}
    
    for level in concurrent_levels:
        print(f"\nStarting concurrent test ({level} concurrent requests)...")
        concurrent_results[f"concurrency_{level}"] = {}
        for ep in ENDPOINTS:
            # Skip heavy bulk for high concurrency if needed, but we should test them as requested
            print(f"Concurrent {ep['name']} (x{level})... ", end="", flush=True)
            res = concurrent_test(ep, headers, level)
            print(f"Avg: {res.get('avg_ms', 'FAIL')}ms | Max: {res.get('max_ms', 'FAIL')}ms | Failed: {res.get('failed', 'FAIL')}")
            concurrent_results[f"concurrency_{level}"][ep['name']] = res

    # Verify Bulk Endpoint Data
    print("\nVerifying Pricing Strategies Bulk endpoint data...")
    bulk_url = f"{BASE_URL}/analytics/pricing-strategies"
    try:
        r = requests.get(bulk_url, headers=headers)
        data = r.json()
        is_list = isinstance(data, list)
        item_count = len(data) if is_list else 0
        unique_ids = len(set(d["product"]["id"] for d in data)) if is_list else 0
        
        print(f"Total items returned: {item_count}")
        print(f"Unique product IDs: {unique_ids}")
        
        data_validation = {
            "items_returned": item_count,
            "unique_product_ids": unique_ids,
            "is_correct_count": item_count == 828 and unique_ids == 828
        }
    except Exception as e:
        print(f"Data validation failed: {e}")
        data_validation = {"error": str(e)}

    final_report = {
        "environment": "Local Development (FastAPI/Uvicorn/PostgreSQL)",
        "note": "These results are local development benchmarks and should not be interpreted as production load-test results.",
        "sequential_results": results,
        "concurrent_results": concurrent_results,
        "data_validation": data_validation
    }

    os.makedirs(os.path.dirname(args.output), exist_ok=True)
    with open(args.output, "w") as f:
        json.dump(final_report, f, indent=2)

    print(f"\nReport saved to: {args.output}")

if __name__ == "__main__":
    main()
