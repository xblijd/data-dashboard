from flask import Flask, request, jsonify
from flask_cors import CORS
from predict_btc import predict_crypto

app = Flask(__name__)
CORS(app)

@app.route('/api/predict')
def get_prediction():
    crypto = request.args.get('crypto', 'bitcoin')
    model = request.args.get('model', 'linear')
    try:
        df, errors, features = predict_crypto(crypto, model)
        return jsonify({
            "labels": df.index.strftime('%Y-%m-%d').tolist(),
            "predicted": df['Predicted'].round(2).tolist(),
            "actual": df['Price'].round(2).tolist(),
            "errors": errors,
            "features": features
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
