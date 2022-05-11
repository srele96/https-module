const { createElement: e } = require('react');
const { hydrateRoot } = require('react-dom/client');
const App = require('./App');

hydrateRoot(document.querySelector('#root'), e(App));
