(function(window, undefined) {
    var irCode = '';
    var current = 0;
    
    var states = [
        {'i': [1], '=': [3], '*': [4], '+': [4], '-': [4], '/': [4], '%': [4], ':': [5], 'g': [6], '\n': [10],
         '<': [12], '>': [12], '!': 14},
        {'f': [2]},
        {token: 'IF'},
        {'=': [11], token: 'ASSIGN'},
        {token: 'OP'},
        {token: 'END_LABEL'},
        {'o': [7]},
        {'t': [8]},
        {'o': [9]},
        {token: 'GOTO'},
        {token: 'EOL'}, //10
        {token: 'RELOP'},
        {'=': [13], token: 'RELOP'},
        {token: 'RELOP'},
        {'=': [15]},
        {token: 'RELOP'},
        {'_': [16], token: 'ID'},
        {token: 'NUMBER'}
    ];
    var ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    var NUM = '0123456789'; 

    function setState(inputs, fromState, toState) {
        inputs.split('').forEach(function(letter) {
            if (states[fromState][letter] === undefined) {
                states[fromState][letter] = [];
            }
            states[fromState][letter].push(toState);
        });

    }

    function setAlphabet(fromState, toState) {
        setState(ALPHA, fromState, toState);
    }

    function setNumber(fromState, toState) {
        setState(NUM, fromState, toState);
    }

    function isSpace(chr) {
        // new line is not white space in this lexer
        if (chr === null) {
            return false;
        }
        return /[ \t\r\f\v]/.test(chr);
    }


    function UnknownToken(lexeme) {
        this.message = 'Unknown token: ' + lexeme;
    }
    
    function getNextChar() {
        if (current >= irCode.length) {
            return null;
        }
        return irCode[current++];

    }

    setAlphabet(0, 16);
    setAlphabet(16, 16);
    setNumber(16, 16);
    setNumber(0, 17);
    setNumber(17, 17);
    
    window.IRLexer = {
        reset: function(code) {
            irCode = code;
            current = 0;
        },
        getNextToken: function() {
            var spaceCheck = getNextChar();
            if (spaceCheck === null) {
                return null;
            }
            while (isSpace(spaceCheck)) {
                spaceCheck = getNextChar();
                if (spaceCheck === null) {
                    return null;
                }
            }
            // check if we already consumed all tokens
            if (current > irCode.length) {
                return null;
            }
            // we need one before
            current--;
            var lexemeBegin = current;
            var state = [0];
            var lastState;
            var lastInput = false;
            while (state.length > 0) {
                lastState = state;
                var newState = [];
                var input = getNextChar();
                if (input === null) {
                    lastInput = true;
                    break;
                }
                state.forEach(function(subState) {
                    var transitions = states[subState][input];
                    if (transitions === undefined) {
                        return;
                    }
                    transitions.forEach(function(transition) {
                        newState.push(transition);
                    });
                });
                state = newState;
            }
            // we need to back up our last failed transition
            if (!lastInput) {
                current--;
            }
            lastState.sort(function(a, b) {
                return a - b;
            });
            var lexeme = irCode.substring(lexemeBegin, current);
            for (var ls in lastState) {
                var finalState = states[lastState[ls]];
                if (finalState.token !== undefined) {
                    return {
                        type: finalState.token,
                        lexeme: lexeme
                    };
                }
            }
            throw new UnknownToken(lexeme);
        },
        // for debugging
        _getStates: function() { return states;}
    };

})(window);
