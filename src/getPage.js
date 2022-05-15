const { createElement: e } = require('react');
const { renderToString } = require('react-dom/server');
const { readFileSync } = require('fs');
const { join } = require('path');
const { cloneDeep } = require('lodash');
const resolveState = require('./resolveState');

/**
 * Resolves the page state, exposes the state for
 * the ssr and csr and returns the page html.
 */
function getPage(Component) {
  // getPageState shouldn't be required
  // when the page doesn't use it the page state is empty
  const pageState = Component.getPageState ? Component.getPageState() : {};

  return (
    // even if the function getPageState exists, it may not return anything
    // use default state
    resolveState(pageState ?? {})
      .then((states) => (states.length === 0 ? {} : states[0].value))
      .then((state) => {
        // set initial state for ssr
        // Separate the references from server-side and client-side state
        // When initial state is deleted on the server it will not be deleted
        // on the client.
        // After the component takes the initial state that belongs to it
        // that initial state should be purged from initial state to use the
        // fresh initial state afterwards.
        // The state from the server is always fresh.
        // However, whenever the client-side component is mounted, the data
        // must be refreshed.
        globalThis['__INITIAL_STATE__'] = cloneDeep(state);
        // return initial state for csr
        return state;
      })
      .then((state) => {
        let html = readFileSync(join(process.cwd(), 'public', 'index.html'), {
          encoding: 'utf8',
        });

        html = html.replace(
          '<div id="root"></div>',
          '<div id="root">' + renderToString(e(Component)) + '</div>'
        );

        html = html.replace(
          '<script id="__INITIAL_STATE__"></script>',
          `<script>globalThis['__INITIAL_STATE__']=${JSON.stringify(
            state
          )}</script>`
        );

        return html;
      })
  );
}

module.exports = getPage;
