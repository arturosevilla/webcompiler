(function(window, undefined) {
    function InternalParserError(message) {
        this.message = message;
    }
    
    function LabelRedefinition(label) {
        this.message = 'Label "' + label + '" was defined multiple times.';
    }

    function IRSyntaxError(error) {
        this.message = error;
    }

    function UndefinedVariable(id) {
        this.message = 'Use of undefined variable "' + id + '"';
    }

    function PendingLabelDefinition(pending) {
        this.message = 'Pending definition of labels: ' + pending;
    }

    function match(types, allowNull) {
        var token = window.IRLexer.getNextToken();
        if (token === null && allowNull) {
            return null;
        } else if (token === null) {
            throw new IRSyntaxError('Unexpected end of input');
        }
        if (types.indexOf(token.type) === -1) {
            throw new IRSyntaxError('Unexpected token: ' + token.lexeme);
        }
        return token;
    }

    function gen(qtable, op, arg1, arg2, result) {
        qtable.push({
            operator: op,
            argument1: arg1,
            argument2: arg2,
            result: result
        });
    }

    function useLabel(qtable, labels, id) {
        if (labels.defined[id] !== undefined) {
            return labels.defined[id];
        }
        if (labels.pending[id] === undefined) {
            labels.pending[id] = [];
        }
        labels.pending[id].push(qtable.length);
    }

    function boolExpr(qtable, env) {
        var term1 = term(env);
        var relop = match(['RELOP'], false);
        var term2 = term(env);

        return [relop.lexeme, term1, term2];
    }

    function ifStmt(qtable, env, labels) {
        var exprInfo = boolExpr(qtable, env);
        match(['GOTO'], false);
        var id = match(['ID'], false);
        gen(
            qtable, 'if' + exprInfo[0],
            exprInfo[1],
            exprInfo[2],
            useLabel(qtable, labels, id.lexeme)
        );
    }

    function gotoStmt(qtable, labels) {
        var id = match(['ID'], false);
        gen(qtable, 'goto', null, null, useLabel(qtable, labels, id.lexeme));
    }

    function term(env) {
        var token = match(['NUMBER', 'ID'], false);
        if (token.type === 'ID') {
            var varEntry = env[token.lexeme];
            if (varEntry === undefined) {
                throw new UndefinedVariable(token.lexeme);
            }
            return token.lexeme;
        }
        return Number(token.lexeme);
    }

    function assignStmt(qtable, env, id) {
        var term1 = term(env);
        var token = match(['OP'], true);
        if (token == null) {
            gen(qtable, '=', term1, null, id);
            return;
        }
        var term2 = term(env);
        gen(qtable, token.lexeme, term1, term2, id);
    }
    
    function updatePendingLabels(qtable, pending, definition) {
        if (pending === undefined || pending.length === 0) {
            return;
        }
        pending.forEach(function(pos) {
            qtable[pos].result = definition;
        });
    }

    function labelStmt(qtable, labels, id) {
        if (labels.defined[id] !== undefined) {
            throw new LabelRedefinition(id);
        }
        labels.defined[id] = qtable.length;
        updatePendingLabels(qtable, labels.pending[id], qtable.length);
        delete labels.pending[id];
    }

    function assignOrLabel(qtable, env, labels, id) {
        var token = match(['ASSIGN', 'END_LABEL'], false);
        switch (token.type) {
            case 'ASSIGN':
                assignStmt(qtable, env, id);
                break;
            case 'END_LABEL':
                labelStmt(qtable, labels, id);
                break;
            default:
                throw new InternalParserError('Received unexpected token: ' + token.type)
        }
    }

    function line(qtable, env, labels, allowNull) {
        var token = match(['IF', 'GOTO', 'ID'], allowNull);
        if (token === null) {
            return null;
        }

        switch (token.type) {
            case 'IF':
                ifStmt(qtable, env, labels);
                break;
            case 'GOTO':
                gotoStmt(qtable, labels);
                break;
            case 'ID':
                assignOrLabel(qtable, env, labels, token.lexeme);
                break;
            default:
                throw new InternalParserError('Received unexpected token: ' + token.type)
        }
        match(['EOL'], false);
        return token.type;
    }

    function lines(qtable, env, labels) {
        var token = line(qtable, env, labels, true);
        if (token === null) {
            return;
        }
        lines(qtable, env, labels);
    }

    window.IRParser = {
        reset: function(code) {
            window.IRLexer.reset(code);
        },
        parse: function(env) {
            var qtable = [];
            var labels = {defined:{}, pending: {}};
            line(qtable, env, labels, false);
            lines(qtable, env, labels);
            var pending = Object.keys(labels.pending);
            if (pending.length > 0) {
                throw new PendingLabelDefinition(pending);
            }
            return qtable;
        }
    };
})(window);
