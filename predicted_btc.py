# predict_btc.py

import yfinance as yf
import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import train_test_split

# Load historical BTC-USD data
btc = yf.download('BTC-USD', start='2020-01-01', interval='1d')
btc = btc[['Close']].rename(columns={'Close': 'Price'})

# Create target column
btc['Target'] = btc['Price'].shift(-1)

# Add lag features
for i in range(1, 6):
    btc[f'lag_{i}'] = btc['Price'].shift(i)

btc = btc.dropna()

# Features and labels
X = btc[[f'lag_{i}' for i in range(1, 6)]]
y = btc['Target']

# Train/test split
X_train, X_test, y_train, y_test = train_test_split(X, y, shuffle=False, test_size=0.1)

# Train model
model = LinearRegression()
model.fit(X_train, y_train)

# Predict
btc_test = btc.iloc[-len(y_test):].copy()
btc_test['Predicted'] = model.predict(X_test)

# Export to CSV
btc_test[['Price', 'Predicted']].to_csv('data/predicted_btc.csv')
print("✅ Predictions saved to data/predicted_btc.csv")
