# predicted_ada.py

import yfinance as yf
import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import train_test_split

# Laad Cardano data
ada = yf.download('ADA-USD', start='2020-01-01', interval='1d')
ada = ada[['Close']].rename(columns={'Close': 'Price'})

# Doelvariabele: prijs van volgende dag
ada['Target'] = ada['Price'].shift(-1)

# Features: 5 lag dagen
for i in range(1, 6):
    ada[f'lag_{i}'] = ada['Price'].shift(i)

ada = ada.dropna()

X = ada[[f'lag_{i}' for i in range(1, 6)]]
y = ada['Target']

X_train, X_test, y_train, y_test = train_test_split(X, y, shuffle=False, test_size=0.1)

model = LinearRegression()
model.fit(X_train, y_train)

ada_test = ada.iloc[-len(y_test):].copy()
ada_test['Predicted'] = model.predict(X_test)

# Opslaan
ada_test[['Price', 'Predicted']].to_csv('data/predicted_ada.csv')
print("✅ Cardano-voorspellingen opgeslagen in data/predicted_ada.csv")
