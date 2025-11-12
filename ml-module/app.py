from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)


@app.get("/ping")
def ping():
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    app.run(port=5005, debug=True)


