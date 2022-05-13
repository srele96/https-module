const https = require('https');
const readFileSync = require('fs').readFileSync;
const join = require('path').join;
const { createElement: e } = require('react');
const { renderToString } = require('react-dom/server');
const App = require('./client/App');

function getInitialState(pageState) {
  // verify that the page component exist, has getPageState, and is a function
  // verify that the structure of returned object by getPageState is correct
  let resolvedState = {};
  let stateResolvers = [];
  // get component name and their state
  Object.entries(pageState).forEach(([component, state]) => {
    // initialize the state for the component
    resolvedState[component] = {};
    // get state thenables
    Object.entries(state).forEach(([key, thenable]) => {
      // wrap the thenable in a state resolver
      stateResolvers.push(
        new Promise((resolve) => {
          // here we resolve the value for the state key and map it to
          // the resolved state
          // this is the only place that knows where the resolved value
          // should be in the resolved state
          thenable
            .then((data) => {
              resolvedState[component][key] = {
                loading: false,
                data,
                error: null,
              };
            })
            .catch((err) => {
              resolvedState[component][key] = {
                loading: false,
                data: null,
                error: err,
              };
            })
            .finally(() => {
              resolve(resolvedState);
            });
        })
      );
    });
  });

  // state resolvers allow us to wait for every key to resolve its value
  return Promise.allSettled(stateResolvers);
}

/**
 * Gets the page state and returns the page HTML.
 */
function getInitialHTML(PageComponent) {
  // getPageState shouldn't be required
  // when the page doesn't use it the page state is empty
  const f = PageComponent.getPageState;
  const pageState = f ? f() : {};

  return (
    getInitialState(pageState)
      // check how does the Promise.allSettled work and
      // do I really need to get the last state?
      .then((initialStates) => initialStates[initialStates.length - 1].value)
      // WARNING!!!
      // DO NOT USE ARROW FUNCTIONS BECAUSE THEY WILL BIND THIS KEYWORD
      // AND IT WILL NOT REFERENCE GLOBAL OBJECT
      // THIS KEY WORD SHOULD UNIVERSALLY REFERENCE
      // GLOBAL OBJECT ON THE CLIENT AND SERVER
      .then(function (initialState) {
        // set initial state for ssr
        this['__INITIAL_STATE__'] = initialState;
        // return initial state for csr
        return JSON.stringify(initialState);
      })
      .then(function (initialState) {
        let html = readFileSync(join(__dirname, 'public', 'index.html'), {
          encoding: 'utf8',
        });
        html = html.replace(
          '<div id="root"></div>',
          `<div id='root'>${renderToString(e(PageComponent))}</div>`
        );
        html = html.replace(
          '<script id="__INITIAL_STATE__"></script>',
          `<script>window.__INITIAL_STATE__=${JSON.stringify(
            initialState
          )}</script>`
        );

        return html;
      })
  );
}

// https://nodejs.org/api/https.html#httpscreateserveroptions-requestlistener
https
  .createServer(
    {
      // https://github.com/nodejs/node/blob/master/test/fixtures/keys/agent2-key.pem
      key: readFileSync('agent2-key.pem'),
      // https://github.com/nodejs/node/blob/master/test/fixtures/keys/agent2-cert.pem
      cert: readFileSync('agent2-cert.pem'),
    },
    (req, res) => {
      // https://stackoverflow.com/questions/16333790/node-js-quick-file-server-static-files-over-http#answer-29046869
      if (req.url === '/') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        getInitialHTML(App).then((html) => res.end(html));
      } else if (req.url === '/bundle.js') {
        res.writeHead(200, { 'Content-Type': 'application/javascript' });
        const js = readFileSync(join(__dirname, 'build', 'bundle.js'), {
          encoding: 'utf8',
        });
        res.end(js);
      }
    }
  )
  .listen(8000);
