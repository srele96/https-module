const { createElement: e, useState, useEffect } = require('react');
const { cloneDeep } = require('lodash');
const axios = require('axios');

const fetchReactPackages = () =>
  new Promise((resolve, reject) => {
    axios({
      method: 'get',
      url: 'https://api.npms.io/v2/search?q=react&size=3',
      responseType: 'json',
    })
      .then(({ data }) => {
        resolve(data.results);
      })
      .catch(({ message }) => {
        reject(message);
      });
  });

/**
 * Returns the deep clone of the component state and
 * purges the taken state from the global object.
 */
function getServerSideState(component) {
  /** @typedef {any} __INITIAL_STATE__ shut up the ide */
  // dereference the sliced state because when purging global state
  // if objects keep references to the same object both will be purged
  const state = cloneDeep(globalThis.__INITIAL_STATE__[component]);
  // purge the initial data to use the fresh one after the client takes over
  globalThis.__INITIAL_STATE__[component] = undefined;

  return state;
}

function App() {
  const state = getServerSideState('App');
  const [loading, setLoading] = useState(state?.packages?.loading ?? true);
  const [data, setData] = useState(state?.packages?.data ?? null);
  const [error, setError] = useState(state?.packages?.error ?? null);

  useEffect(() => {
    if (loading) {
      fetchReactPackages()
        .then((results) => {
          setData(results);
          setLoading(false);
        })
        .catch((error) => {
          setError(error);
          setLoading(false);
        });
    }
  }, [loading, setData, setLoading, setError]);

  if (loading) return e('h1', {}, 'Loading...');
  if (error) return e('h1', {}, error);

  return e(
    'article',
    {},
    e('h1', {}, 'React Packages'),
    e('p', {}, 'The 3 react packages from npms api'),
    data.map(({ package }) => {
      const { name, description, version } = package;
      return e(
        'section',
        { key: `${name}:${version}` },
        e('h2', {}, name),
        e('p', {}, description),
        e('p', {}, `Version: ${version}`)
      );
    })
  );
}

/**
 * Provides the ability of declarative data fetching.
 *
 * If the page component has the getPageState function that returns
 * required structured data, then the data fetching is done automatically.
 *
 * @example
 * {
 *   [componentName]: {
 *     [key]: Promise { <pending> }
 *   }
 * }
 *
 * A component name must be unique and key must be unique per component.
 * The component App should use the state from App object.
 * The component Test should NOT use the state from App object.
 */
App.getPageState = function getPageState() {
  return {
    App: {
      packages: fetchReactPackages(),
    },
  };
};

module.exports = App;
