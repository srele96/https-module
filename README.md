# https-module & react

Server-Side Rendering with https module and react.

## The client-side:

- Webpack compiles client-side code to JavaScript. (browser can use it)
- I manually added the bundle name in the script tag `public/index.html`

## The server-side:

- https module creates the server
- reads index html, inserts rendered react app and returns the page
- serves compiled javascript bundle

## The server-side rendering with data fetching:

The mechanic behind the server-side data fetching has the following components:

- The component that declares server-side data fetching should be page-level component.
- The page level component should have the method `getPageState`.
- The method `getPageState` should return specific structure to make the data fetching possible.
- The component should use `getServerSideState` to consume the data.
- The data received from `getServerSideState` should be provided as initial state.
- The data provided as initial state should have **the default value** when server side data is not available.

### The structure returned by the `getPageState` method:

_NOTE: I use TypeScript for examples to emphasize the types._

```ts
interface PageStateResolver {
  [component: string]: {
    [key: string]: Promise<any>;
  };
}
```

You can have as many components and keys as you want.

Example:

```js
const { useState, useEffect } = require('react');
const { cloneDeep } = require('lodash');

// i would prefer to hide the implementation of getServerSideState function
// because of the complexity to understand why it is required
/**
 * Returns the deep clone of the component state and
 * purges the taken state from the global object.
 */
function getServerSideState(component) {
  /** @typedef {any} __INITIAL_STATE__ shut up the ide */
  // dereference the sliced state because when purging global state
  // if objects keep references to the same object both will be purged
  const state = cloneDeep(__INITIAL_STATE__[component]);
  // purge the initial data to use the fresh one after the client takes over
  __INITIAL_STATE__[component] = undefined;

  return state;
}

function App() {
  /**
   * The structure of the __INITIAL_STATE__ will be:
   * {
   *   App: {
   *     count: {
   *       loading: false,
   *       data: 50,
   *       error: null
   *     }
   *   }
   * }
   */
  console.log(__INITIAL_STATE__);
  // The state should be accessed like follows:
  const state = getServerSideState('App');
  // Now we can distribute the state to the hooks:
  const [loading, setLoading] = useState(state?.count?.loading ?? true);
  const [count, setCount] = useState(state?.count?.data ?? null);
  const [error, setError] = useState(state?.count?.error ?? null);

  // client-side fetching
  useEffect(() => {
    if (loading) {
      new Promise((resolve) => {
        setTimeout(() => resolve(50), 1000);
      })
        .then((data) => {
          setLoading(false);
          setCount(data);
        })
        .catch((error) => {
          setLoading(false);
          setError(error);
        });
    }
  }, [loading, setCount, setError, setLoading]);

  // render the loading, error, and data
}

// server-side fetching
App.getPageState = function getPageState() {
  return {
    App: {
      count: new Promise((resolve) => {
        setTimeout(() => resolve(50), 1000);
      }),
    },
  };
};
```
