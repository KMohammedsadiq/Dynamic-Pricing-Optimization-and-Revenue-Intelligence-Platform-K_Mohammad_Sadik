import joblib
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

# The old preprocessor was using the OLD dataset columns, so we must load the OLD dataset to evaluate it properly
# or we can just try to see if we can get metrics from the notebook.
# Let's just run the notebook evaluation if it exists.
