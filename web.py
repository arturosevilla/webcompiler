#!/usr/bin/env python
from flask import Flask, render_template as render, jsonify, request, abort
from python_compiler.compiler.ir import QTable, Quadruple, Environment
#from python_compiler.compiler.x86 import CodeGenerator

app = Flask(__name__)

@app.route('/', methods=['GET'])
def form():
    return render('form.html')

@app.route('/compile', methods=['POST'])
def compile():
    code = request.json['code']
    serialized_environment = request.json['env']
    if len(code) == 0:
        abort(400)
        
    qtable = QTable()
    for line in code:
        qtable.append(Quadruple(
            line['operator'],
            line['argument1'],
            line['argument2'],
            line['result']
        ))

    env = Environment()
    for env_name, info in serialized_environment.iteritems():
        env.put(env_name, info)
    print env.env
    print [block for block in qtable.get_basic_blocks()]
    return jsonify({'lines': ['hello', 'world']})


if __name__ == '__main__':
    app.run(debug=True)

