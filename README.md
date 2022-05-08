# https-module & react

Server-Side Rendering with https module and react.

## The client-side:

- Webpack compiles client-side code to JavaScript. (browser can use it)
- I manually added the bundle name in the script tag `public/index.html`

## The server-side:

- https module creates the server
- reads index html, inserts rendered react app and returns the page
- serves compiled javascript bundle
