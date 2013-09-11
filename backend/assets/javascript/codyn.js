"use strict";

CodeMirror.defineMode("codyn", function() {

  var TOKEN_NAMES = {
    '+': 'positive',
    '-': 'negative',
    '@': 'meta'
  };

  function w(s) {
    var ret = {}, words = s.split(" ");

    for (var i = 0; i < words.length; ++i)
    {
      if (words[i].length != 0)
      {
        ret[words[i]] = true;
      }
    }

    return ret;
  };

  var keywords = w("action all any apply as at bidirectional context debug-print defines delete discrete edge event from import in include initial-state integrated integrator interface io layout link-library node no-self object of on once out parse piece polynomial probability require set settings state terminate to unapply when with within");

  var selectors = w("actions append-context applied-templates children count debug edges first from-set functions has-flag has-template if ifstr imports input input-name inputs last name nodes not notstr objects output output-name outputs parent recurse reduce reverse root self siblings sort subset templates templates-root type unique variables");

  return {
    startState: function() {
      return {
      }
    },

    token: function(stream, state) {
      if (stream.eatSpace())
      {
        return null;
      }

      var ch = stream.next();

      if (ch == '"')
      {
        if (stream.eatWhile(/[^"]/))
        {
          stream.next();
        }

        return "string";
      }

      if (ch == '#')
      {
        stream.skipToEnd();
        return 'comment';
      }

      if (/\d/.test(ch))
      {
        stream.eatWhile(/[\w\.]/);
        return 'number';
      }

      stream.eatWhile(/[\w_-]/);
      var cur = stream.current();

      if (keywords.propertyIsEnumerable(cur))
      {
        return 'keyword';
      }
      else if (selectors.propertyIsEnumerable(cur))
      {
        return 'selector';
      }
      else if (/\w/.test(cur))
      {
        return 'variable';
      }

      return null;
    },

    lineComment: '#'
  };
});

CodeMirror.defineMIME("text/x-cdn", "codyn");

// vi:ts=2:et
