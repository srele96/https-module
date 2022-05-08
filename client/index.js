const { createElement } = require('react');
const { hydrateRoot } = require('react-dom/client');
const App = require('./App');

hydrateRoot(document.querySelector('#root'), createElement(App));
