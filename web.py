#!/usr/bin/env python
from flask import Flask, render_template as render, jsonify, request, abort

app = Flask(__name__)

@app.route('/', methods=['GET'])
def form():
    return render('form.html')

@app.route('/compile', methods=['POST'])
def compile():
    code = request.json['code']
    if len(code) == 0:
        abort(400)
        
    print code
    return jsonify({'lines': ['hello', 'world']})


if __name__ == '__main__':
    app.run(debug=True)

