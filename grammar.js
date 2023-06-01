module.exports = grammar({
  name: 'sql',

  extras: $ => [
    /\s\n/,
    /\s/,
  ],

  conflicts: $ => [
    // [$.object_reference, $.field],
    [$.object_reference],
  ],

  precedences: $ => [
    [
      'binary_is',
      'unary_not',
      'binary_exp',
      'binary_times',
      'binary_plus',
      'binary_in',
      'binary_compare',
      'binary_relation',
      'binary_concat',
      'pattern_matching',
      'between',
      'clause_connective',
      'clause_disjunctive',
    ],
  ],

  word: $ => $._identifier,

  rules: {
    program: $ => repeat(
      // TODO: other kinds of definitions
      choice(
        $.statement,
      ),
    ),

    keyword_select: _ => make_keyword("select"),
    keyword_from: _ => make_keyword("from"),
    keyword_as: _ => make_keyword("as"),

    statement: $ => seq(
      choice(
        $._dml_read,
      ),
      optional(';'),
    ),

    _dml_read: $ => seq(
      choice(
        seq(
          $._select_statement,
        ),
      ),
    ),

    _select_statement: $ => seq(
      $.select,
      optional($.from),
    ),

    select: $ => seq(
      $.keyword_select,
      seq(
        $.select_expression,
      ),
    ),

    select_expression: $ => seq(
      $._select_expression,
      repeat(
        seq(
          ',',
          $._select_expression,
        ),
      ),
    ),

    _select_expression: $ => seq(
      choice(
        seq(
          optional(
            seq(
              $.object_reference,
              '.',
            ),
          ),
          choice(
            $.all_fields,
            $.field,
          ),
        ),
        $._expression,
      ),
      optional($._alias),
    ),

    object_reference: $ => seq(
      optional(
        seq(
          field('schema', $.identifier),
          '.',
        ),
      ),
      field('name', $.identifier),
    ),

    all_fields: $ => '*',

    field: $ => field('name', $.identifier),

    _alias: $ => seq(
      optional($.keyword_as),
      field('alias', $.identifier),
    ),

    from: $ => seq(
      $.keyword_from,
      comma_list($.relation, true),
    ),

    relation: $ => prec.right(
      seq(
        choice(
          // TODO already has an optional alias
          $.object_reference,
        ),
      ),
    ),

    _expression: $ => prec(1,
      choice(
        $.literal,
        $.field,
      )
    ),

    literal: $ => prec(2,
      choice(
        $._integer,
        $._literal_string,
      ),
    ),
    _double_quote_string: _ => seq('"', /[^"]*/, '"'),
    _literal_string: $ => prec(1,
        choice(
            seq("'", /([^']|'')*/, "'"),
            $._double_quote_string,
        ),
    ),

    _natural_number: _ => /\d+/,
    _integer: $ => seq(optional("-"), $._natural_number),

    identifier: $ => choice(
      $._identifier,
      $._double_quote_string,
      seq('`', $._identifier, '`'),
    ),
    _identifier: _ => /([a-zA-Z_][0-9a-zA-Z_]*)/,
  }

});

function comma_list(field, requireFirst) {
  if (requireFirst) {
    return seq(
      field,
      repeat(
        seq(',', field)
      )
    );
  }

  return optional(
    seq(
      field,
      repeat(
        seq(',', field)
      ),
    ),
  );
}

function make_keyword(word) {
  str = "";
  for (var i = 0; i < word.length; i++) {
    str = str + "[" + word.charAt(i).toLowerCase() + word.charAt(i).toUpperCase() + "]";
  }
  return new RegExp(str);
}
