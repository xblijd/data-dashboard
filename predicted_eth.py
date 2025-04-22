# predicted_eth.py

import yfinance as yf
import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import train_test_split

# Laad Ethereum data
eth = yf.download('ETH-USD', start='2020-01-01', interval='1d')
eth = eth[['Close']].rename(columns={'Close': 'Price'})

# Doelvariabele: prijs van volgende dag
eth['Target'] = eth['Price'].shift(-1)

# Features: 5 lag dagen
for i in range(1, 6):
    eth[f'lag_{i}'] = eth['Price'].shift(i)

eth = eth.dropna()

X = eth[[f'lag_{i}' for i in range(1, 6)]]
y = eth['Target']

X_train, X_test, y_train, y_test = train_test_split(X, y, shuffle=False, test_size=0.1)

model = LinearRegression()
model.fit(X_train, y_train)

eth_test = eth.iloc[-len(y_test):].copy()
eth_test['Predicted'] = model.predict(X_test)

# Opslaan
eth_test[['Price', 'Predicted']].to_csv('data/predicted_eth.csv')
print("✅ Ethereum-voorspellingen opgeslagen in data/predicted_eth.csv")
