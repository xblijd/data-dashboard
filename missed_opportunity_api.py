from flask import Flask, request, jsonify
import requests
import time
from datetime import datetime
from flask_cors import CORS

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "http://127.0.0.1:5500"}})

@app.route('/api/investment', methods=['GET'])
def get_investment_data():
    coin = request.args.get('coin')
    amount = float(request.args.get('amount'))
    date_str = request.args.get('date')  # format YYYY-MM-DD

    try:
        start_timestamp = int(time.mktime(datetime.strptime(date_str, "%Y-%m-%d").timetuple()))
        end_timestamp = int(time.time())

        url = f"https://api.coingecko.com/api/v3/coins/{coin}/market_chart/range"
        params = {
            'vs_currency': 'eur',
            'from': start_timestamp,
            'to': end_timestamp
        }

        res = requests.get(url, params=params)
        data = res.json()
        if 'prices' not in data or len(data['prices']) == 0:
            return jsonify({'error': 'Geen prijsdata beschikbaar'}), 400

        prices = data['prices']
        bought_price = prices[0][1]
        current_price = prices[-1][1]
        coins_bought = amount / bought_price
        current_value = coins_bought * current_price

        result = {
            'summary': {
                'coin': coin,
                'amount': amount,
                'start_date': date_str,
                'bought_price': round(bought_price, 2),
                'coins_bought': round(coins_bought, 4),
                'current_price': round(current_price, 2),
                'current_value': round(current_value, 2)
            },
            'timeseries': [
                {
                    'date': datetime.fromtimestamp(p[0] / 1000).strftime('%Y-%m-%d'),
                    'value': round(p[1] * coins_bought, 2)
                } for p in prices
            ]
        }

        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
