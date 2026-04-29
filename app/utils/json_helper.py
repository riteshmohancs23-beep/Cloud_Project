import numpy as np

def sanitize_json_data(data):
    """
    Recursively scans and replaces JSON-incompatible floats (NaN, Inf, -Inf) 
    with None (JSON null).
    """
    if isinstance(data, dict):
        return {k: sanitize_json_data(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [sanitize_json_data(x) for x in data]
    elif isinstance(data, float):
        if np.isnan(data) or np.isinf(data):
            return None
    return data
