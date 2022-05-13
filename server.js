const https = require('https');
const readFileSync = require('fs').readFileSync;
const join = require('path').join;
const { createElement: e } = require('react');
const { renderToString } = require('react-dom/server');
const App = require('./client/App');

function getInitialState(PageComponent) {
  // verify that the page component exist, has getPageState, and is a function
  // verify that the structure of returned object by getPageState is correct
  let __INITIAL_STATE__ = {};
  let stateResolvers = [];
  // get component name and their state
  Object.entries(PageComponent.getPageState()).forEach(([component, state]) => {
    // initialize the state for the component
    __INITIAL_STATE__[component] = {};
    // get state thenables
    Object.entries(state).forEach(([key, thenable]) => {
      // wrap the thenable in a state resolver
      stateResolvers.push(
        new Promise((resolve) => {
          // map the thenable result to the component state
          thenable
            .then((data) => {
              __INITIAL_STATE__[component][key] = {
                loading: false,
                data,
                error: null,
              };
            })
            .catch((err) => {
              __INITIAL_STATE__[component][key] = {
                loading: false,
                data: null,
                error: err,
              };
            })
            .finally(() => {
              resolve(__INITIAL_STATE__);
            });
        })
      );
    });
  });

  return Promise.allSettled(stateResolvers);
}

function getInitialHTML() {
  return (
    getInitialState(App)
      // check how does the Promise.allSettled work and
      // do I really need to get the last state?
      .then((resolvedStates) => resolvedStates[resolvedStates.length - 1].value)
      // WARNING!!!
      // DO NOT USE ARROW FUNCTIONS BECAUSE THEY WILL BIND THIS KEYWORD
      // AND IT WILL NOT REFERENCE GLOBAL OBJECT
      // THIS KEY WORD SHOULD UNIVERSALLY REFERENCE
      // GLOBAL OBJECT ON THE CLIENT AND SERVER
      .then(function (__INITIAL_STATE__) {
        // set initial state for ssr
        this['__INITIAL_STATE__'] = __INITIAL_STATE__;
        // return initial state for csr
        return `<script>window.__INITIAL_STATE__=${JSON.stringify(
          __INITIAL_STATE__
        )}</script>`;
      })
      .then(function (initialState) {
        let html = readFileSync(join(__dirname, 'public', 'index.html'), {
          encoding: 'utf8',
        });
        html = html.replace(
          '<div id="root"></div>',
          `<div id='root'>${renderToString(e(App))}</div>`
        );
        html = html.replace(
          '<script id="__INITIAL_STATE__"></script>',
          initialState
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
        getInitialHTML().then((html) => res.end(html));
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
