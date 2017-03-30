module.exports = {
  'env': {
    'node': true,
    'es6': true,
  },
  'extends': ['eslint:recommended', 'airbnb-base'],
  'rules': {
    // airbnb-base/best-practices
    // allow function param reassignment (used extensively for optional args)
    //'no-param-reassign': ['off'],

    // airbnb-base/errors
    // don't require comma dangle on functions until node 8.x
    'comma-dangle': ['error', 'always-multiline'],

    // allow console to output warnings
    'no-console': ['off'],

    // airbnb-base/style
    // allow continue in loops
    'no-continue': ['off'],

    // allow unary ++ operator
    'no-plusplus': ['off'],

    // allow for-of syntax
    'no-restricted-syntax': [
      'error',
      'ForInStatement',
      'LabeledStatement',
      'WithStatement',
    ],
  },
};
