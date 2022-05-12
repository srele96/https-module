const https = require('https');
const readFileSync = require('fs').readFileSync;
const join = require('path').join;
const { createElement } = require('react');
const { renderToString } = require('react-dom/server');
const App = require('./client/App');

function getHTML() {
  return new Promise((resolve) => {
    let html = readFileSync(join(__dirname, 'public', 'index.html'), {
      encoding: 'utf8',
    });

    let __INITIAL_STATE__ = null;

    App.fetchReactPackages()
      .then((data) => {
        __INITIAL_STATE__ = { loading: false, error: null, data };
      })
      .catch((error) => {
        __INITIAL_STATE__ = { loading: false, data: null, error };
      })
      .finally(() => {
        // initial state for SSR, must be initialized before rendering the app
        globalThis.__INITIAL_STATE__ = __INITIAL_STATE__;

        html = html.replace(
          '<div id="root"></div>',
          `<div id='root'>${renderToString(createElement(App))}</div>`
        );

        // initial state for csr
        html += `<script>window.__INITIAL_STATE__ = ${JSON.stringify(
          __INITIAL_STATE__
        )}</script>`;

        resolve(html);
      });
  });
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
        getHTML().then((html) => res.end(html));
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
