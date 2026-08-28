import re
from difflib import SequenceMatcher

def normalize_title(title: str) -> str:
    if not title:
        return ""
    t = title.lower()
    # Replace + with plus so it doesn't get stripped by punctuation regex
    t = t.replace('+', ' plus ')
    t = re.sub(r'[^\w\s]', ' ', t)
    t = re.sub(r'\s+', ' ', t).strip()
    return t

def extract_storage(text: str) -> set:
    """Extract storage sizes and normalize to GB."""
    sizes = set()
    t = text.lower()
    # Normalize spacing
    t = re.sub(r'(\d+)\s*(gb|mb|tb|g)\b', r'\1\2', t)
    
    matches = re.findall(r'\b(\d+)(gb|tb)\b', t)
    for num_str, unit in matches:
        num = int(num_str)
        if unit == 'tb':
            sizes.add(f"{num * 1024}GB")
        else:
            sizes.add(f"{num}GB")
            
    # Also catch 1024GB explicitly if present
    if '1024gb' in t:
        sizes.add('1024GB')
    if '2048gb' in t:
        sizes.add('2048GB')
    return sizes

def extract_ram(text: str) -> set:
    """Extract RAM and normalize."""
    # RAM is often followed by RAM, or just XGB but usually in the context of memory.
    # To differentiate from storage, typical RAM is 4, 8, 12, 16, 24, 32, 64 GB.
    sizes = set()
    t = text.lower()
    t = re.sub(r'(\d+)\s*(gb|g|mb)\b', r'\1\2', t)
    
    matches = re.findall(r'\b(\d+)gb\b', t)
    for num_str in matches:
        num = int(num_str)
        # Typical RAM sizes
        if num in [4, 6, 8, 12, 16, 24, 32, 64]:
            sizes.add(f"{num}GB")
    return sizes

def extract_cpu(text: str) -> set:
    """Extract and normalize CPU models."""
    cpus = set()
    t = text.lower()
    
    # Intel Core
    if re.search(r'\b(core i3|i3)\b', t): cpus.add('i3')
    if re.search(r'\b(core i5|i5)\b', t): cpus.add('i5')
    if re.search(r'\b(core i7|i7)\b', t): cpus.add('i7')
    if re.search(r'\b(core i9|i9)\b', t): cpus.add('i9')
    
    # AMD Ryzen
    if re.search(r'\bryzen\s*3\b', t): cpus.add('ryzen 3')
    if re.search(r'\bryzen\s*5\b', t): cpus.add('ryzen 5')
    if re.search(r'\bryzen\s*7\b', t): cpus.add('ryzen 7')
    if re.search(r'\bryzen\s*9\b', t): cpus.add('ryzen 9')
    
    # Apple Silicon
    for m in ['m1', 'm2', 'm3', 'm4']:
        if re.search(rf'\b{m}(?:\s*(?:pro|max|ultra))?\b', t):
            cpus.add(m)
            
    return cpus

def extract_model_modifiers(text: str) -> set:
    """Extract smartphone/tablet modifiers."""
    modifiers = set()
    t = text.lower()
    words = set(t.split())
    for mod in ['pro', 'max', 'plus', 'ultra', 'mini', 'se']:
        # Catch pro max, etc.
        if mod in words:
            modifiers.add(mod)
    return modifiers

def extract_book_modifiers(text: str) -> set:
    """Extract book variant/edition modifiers."""
    modifiers = set()
    t = text.lower()
    words = set(t.split())
    for mod in ['workbook', 'companion', 'summary', 'guide', 'micro']:
        if mod in words:
            modifiers.add(mod)
    return modifiers

def extract_exclusions(text: str) -> set:
    """Extract exclusionary accessory terms."""
    exclusions = set()
    t = text.lower()
    words = set(t.split())
    
    exc_list = [
        'case', 'cover', 'screen', 'protector', 'charger', 'cable', 'battery', 
        'adapter', 'keyboard', 'mouse', 'bag', 'stand', 'compatible', 
        'replacement', 'refurbished', 'renewed', 'used', 'sleeve', 'skin', 'sticker',
        'flash', 'drive', 'stylus', 'pen', 'holder', 'dock', 'hub', 'mount', 'strap', 
        'band', 'glass', 'film', 'lens'
    ]
    
    for exc in exc_list:
        if exc in words:
            exclusions.add(exc)
    return exclusions

def extract_product_type(text: str) -> set:
    """Extract core product nouns for fashion/electronics."""
    types = set()
    t = text.lower()
    words = set(t.split())
    for ptype in ['shirt', 'shorts', 'pants', 'joggers', 'shoes', 'jacket', 'laptop', 'phone', 'tablet', 'watch', 'tshirt', 't-shirt', 'hoodie']:
        if ptype in words:
            types.add(ptype)
    return types

def compare_attributes(internal_attr: set, candidate_attr: set, attr_name: str, reasons: list) -> str:
    """Returns 'MATCH', 'UNKNOWN', or 'MISMATCH'."""
    if not internal_attr:
        if candidate_attr:
            reasons.append(f"{attr_name}: candidate specifies {candidate_attr} but internal does not")
            return "UNKNOWN"
        return "MATCH" # Neither specifies
        
    if not candidate_attr:
        reasons.append(f"{attr_name}: internal specifies {internal_attr} but candidate does not")
        return "UNKNOWN"
        
    if internal_attr.intersection(candidate_attr):
        reasons.append(f"{attr_name} MATCH ({internal_attr.intersection(candidate_attr)})")
        return "MATCH"
    else:
        reasons.append(f"{attr_name} MISMATCH (internal: {internal_attr}, candidate: {candidate_attr})")
        return "MISMATCH"

def compare_modifiers(internal_mods: set, candidate_mods: set, attr_name: str, reasons: list) -> str:
    """For modifiers, if candidate has extra modifiers that internal lacks, it's a MISMATCH."""
    extra_in_candidate = candidate_mods - internal_mods
    if extra_in_candidate:
        reasons.append(f"{attr_name} MISMATCH (candidate has extra: {extra_in_candidate})")
        return "MISMATCH"
        
    missing_in_candidate = internal_mods - candidate_mods
    if missing_in_candidate:
        reasons.append(f"{attr_name} UNKNOWN/MISMATCH (candidate missing: {missing_in_candidate})")
        return "MISMATCH" # Strictly require modifiers to match both ways
        
    reasons.append(f"{attr_name} MATCH")
    return "MATCH"

def has_exclusionary_terms(internal_exc: set, candidate_exc: set, reasons: list) -> str:
    extra_in_candidate = candidate_exc - internal_exc
    if extra_in_candidate:
        reasons.append(f"ACCESSORY/EXCLUSION MISMATCH: detected {extra_in_candidate}")
        return "MISMATCH"
    return "MATCH"

def calculate_match_confidence(internal_product: dict, candidate_name: str, brand: str = "", category: str = "") -> dict:
    """
    Returns a dict with:
    confidence: int
    reasons: list
    diagnostics: dict
    """
    if not candidate_name:
        return {"confidence": 0, "reasons": ["Missing candidate name"], "status": "REJECTED", "diagnostics": {}}
        
    reasons = []
    diag = {}
    
    internal_name = internal_product.get("product_name", "")
    if internal_product.get("product_model"):
        internal_name += f" {internal_product['product_model']}"
        
    norm_internal = normalize_title(internal_name)
    norm_candidate = normalize_title(candidate_name)
    
    # ── HARD VALIDATION ──────────────────────────────────────────
    
    # Brand
    if brand and normalize_title(brand) not in norm_candidate:
        diag['Brand'] = "UNKNOWN"
        reasons.append("Brand UNKNOWN (missing from candidate title)")
    else:
        diag['Brand'] = "MATCH"
        
    # Exclusions
    int_exc = extract_exclusions(norm_internal)
    cand_exc = extract_exclusions(norm_candidate)
    diag['Exclusions'] = has_exclusionary_terms(int_exc, cand_exc, reasons)
    
    # CPU
    if internal_product.get('cpu'): int_cpu = {internal_product['cpu'].lower()}
    else: int_cpu = extract_cpu(norm_internal)
    cand_cpu = extract_cpu(norm_candidate)
    diag['CPU'] = compare_attributes(int_cpu, cand_cpu, "CPU", reasons)
    
    # RAM
    # RAM
    if internal_product.get('ram'): int_ram = {internal_product['ram'].upper()}
    else: int_ram = extract_ram(norm_internal)
    cand_ram = extract_ram(norm_candidate)
    diag['RAM'] = compare_attributes(int_ram, cand_ram, "RAM", reasons)
    
    # Storage
    if internal_product.get('storage'): int_sto = {internal_product['storage'].upper()}
    else: int_sto = extract_storage(norm_internal)
    cand_sto = extract_storage(norm_candidate)
    diag['Storage'] = compare_attributes(int_sto, cand_sto, "Storage", reasons)
    
    # Model Modifiers
    int_mod = extract_model_modifiers(norm_internal)
    cand_mod = extract_model_modifiers(norm_candidate)
    diag['Model'] = compare_modifiers(int_mod, cand_mod, "Model Modifiers", reasons)
    
    # Product Type
    int_type = extract_product_type(norm_internal)
    cand_type = extract_product_type(norm_candidate)
    diag['Product Type'] = compare_attributes(int_type, cand_type, "Product Type", reasons)
    
    # Book Modifiers
    int_book = extract_book_modifiers(norm_internal)
    cand_book = extract_book_modifiers(norm_candidate)
    diag['Book Identity'] = compare_modifiers(int_book, cand_book, "Book Modifiers", reasons)
    
    # ISBN
    if internal_product.get('isbn'):
        int_isbn = {internal_product['isbn']}
        cand_isbn = set(re.findall(r'\b(978\d{10}|\d{10})\b', norm_candidate))
        diag['ISBN'] = compare_attributes(int_isbn, cand_isbn, "ISBN", reasons)
    
    # Extra Checks for Apparel/Beauty (Size, Gender, Color, etc.)
    if internal_product.get('size'):
        int_size = {internal_product['size'].lower()}
        cand_sizes = set(re.findall(r'\b(s|m|l|xl|xxl|uk \d+)\b', norm_candidate))
        diag['Size'] = compare_attributes(int_size, cand_sizes, "Size", reasons)
        
    if internal_product.get('gender'):
        int_gender = {internal_product['gender'].lower()}
        cand_gender = set(re.findall(r'\b(men|women|mens|womens|unisex|boy|girl)\b', norm_candidate))
        diag['Gender'] = compare_attributes(int_gender, cand_gender, "Gender", reasons)
    else:
        # If internal lacks gender but candidate explicitly states one, hard penalty
        cand_gender = set(re.findall(r'\b(men|women|mens|womens|boy|girl)\b', norm_candidate))
        if cand_gender:
            diag['Gender'] = "MISMATCH"
            reasons.append(f"Gender MISMATCH (internal specifies none but candidate specifies {cand_gender})")
    
    # Check for Hard Mismatch
    is_hard_mismatch = any(val == "MISMATCH" for val in diag.values())
    
    if is_hard_mismatch:
        reasons.append("HARD REJECTION: One or more attributes explicitly mismatched.")
        return {"confidence": 0, "reasons": reasons, "status": "REJECTED", "diagnostics": diag}

    # ── FUZZY SCORING ────────────────────────────────────────────
    # Normalize attributes in the text to avoid penalty for 1TB vs 1024GB or 8 GB vs 8GB
    def _normalize_text_for_fuzzy(text):
        t = text
        t = re.sub(r'\b1tb\b', '1024gb', t)
        t = re.sub(r'\b2tb\b', '2048gb', t)
        t = re.sub(r'\b(\d+)\s+gb\b', r'\1gb', t)
        return t
        
    fuzz_internal = _normalize_text_for_fuzzy(norm_internal)
    fuzz_candidate = _normalize_text_for_fuzzy(norm_candidate)
    
    matcher = SequenceMatcher(None, fuzz_internal, fuzz_candidate)
    ratio = matcher.ratio()
    
    internal_words = set(fuzz_internal.split())
    # Remove brand from internal_words if it exists, to avoid heavy penalty when candidate lacks brand
    if brand and normalize_title(brand) in internal_words:
        internal_words.discard(normalize_title(brand))
        
    candidate_words = set(fuzz_candidate.split())
    
    missing_words = internal_words - candidate_words
    
    # If all internal words (minus brand) are found in candidate, we guarantee a high score.
    if len(missing_words) == 0:
        ratio = max(ratio, 0.90)
        reasons.append("excellent text match (all internal words present)")
    elif len(missing_words) > len(internal_words) / 2:
        ratio *= 0.5
        reasons.append(f"poor text match (missing words: {', '.join(missing_words)})")
    else:
        # Check if the missing word is actually a substring of one of candidate words
        # e.g., "inspiron" missing but candidate has "inspiron15"
        truly_missing = []
        for mw in missing_words:
            if not any(mw in cw for cw in candidate_words):
                truly_missing.append(mw)
        
        if not truly_missing:
            ratio = max(ratio, 0.85)
            reasons.append("good text match (all internal words present as substrings)")
        else:
            reasons.append(f"partial text match (missing words: {', '.join(truly_missing)})")
            # slight boost if only minor missing words
            ratio = max(ratio, 0.70) if len(truly_missing) == 1 else ratio
        
    final_score = int(ratio * 100)
    
    # Penalty for UNKNOWNs
    unknowns = sum(1 for val in diag.values() if val == "UNKNOWN")
    if unknowns > 0:
        final_score = max(0, final_score - (unknowns * 5))
        reasons.append(f"Penalty: deducted {unknowns * 5}% for UNKNOWN attributes.")
        
    reasons.append(f"final confidence score = {final_score}%")
    status = "ACCEPTED" if final_score >= 85 else "REJECTED"
    
    return {"confidence": final_score, "reasons": reasons, "status": status, "diagnostics": diag}


def find_best_match(internal_product: dict, brand: str, search_results: list) -> dict:
    valid_candidates = []
    all_diagnostics = []
    
    for result in search_results:
        title = result.get("title") or result.get("product_title") or ""
        if not title:
            continue
            
        eval_res = calculate_match_confidence(internal_product, title, brand)
        confidence = eval_res["confidence"]
        status = eval_res["status"]
        reasons = eval_res["reasons"]
        
        diagnostic_entry = {
            "candidate": title,
            "url": result.get("url"),
            "asin": result.get("asin") or result.get("id"),
            "confidence": confidence,
            "reasons": reasons,
            "status": status,
            "detailed_diag": eval_res["diagnostics"]
        }
        all_diagnostics.append(diagnostic_entry)
        
        if status == "ACCEPTED": 
            result["match_confidence"] = confidence
            result["match_reasons"] = reasons
            valid_candidates.append(result)
            
    # Sort diagnostics so accepted ones are at the top, then by highest confidence
    all_diagnostics.sort(key=lambda x: (x["status"] != "ACCEPTED", -x["confidence"]))

    if not valid_candidates:
        return {"best_match": None, "diagnostics": all_diagnostics}
        
    priced_candidates = [c for c in valid_candidates if (c.get("price") is not None or c.get("product_price") is not None)]
    if not priced_candidates:
        return {"best_match": None, "diagnostics": all_diagnostics}
        
    def _get_raw_price(c):
        return c.get("price") if c.get("price") is not None else c.get("product_price")
        
    # NEW TIE-BREAKING LOGIC:
    # 1. Sort by confidence DESC
    # 2. THEN sort by price ASC
    priced_candidates.sort(key=lambda x: (-x["match_confidence"], _get_raw_price(x)))
    
    return {"best_match": priced_candidates[0], "diagnostics": all_diagnostics}
