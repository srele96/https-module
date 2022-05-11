const https = require('https');
const readFileSync = require('fs').readFileSync;
const join = require('path').join;
const { createElement } = require('react');
const { renderToString } = require('react-dom/server');
const App = require('./client/App');

async function getHTML() {
  let html = readFileSync(join(__dirname, 'public', 'index.html'), {
    encoding: 'utf8',
  });

  let initialState = { loading: false };

  try {
    const data = await App.fetchReactPackages();
    initialState = { ...initialState, data, error: null };
  } catch (error) {
    initialState = { ...initialState, error, data: null };
  }

  globalThis.__INITIAL_STATE__ = initialState;

  html = html.replace(
    '<div id="root"></div>',
    `<div id='root'>${renderToString(createElement(App))}</div>`
  );

  html += `<script>window.__INITIAL_STATE__ = ${JSON.stringify(
    initialState
  )}</script>`;

  return html;
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
