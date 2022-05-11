const axios = require('axios');
const { useState, useEffect } = require('react');
const { createElement: e } = require('react');

const fetchReactPackages = () =>
  new Promise((resolve, reject) => {
    axios({
      method: 'get',
      url: 'https://api.npms.io/v2/search?q=react&size=3',
      responseType: 'json',
    })
      .then((response) => resolve(response.data.results))
      .catch((error) => reject(error.message));
  });

const isServer = () => typeof window === 'undefined';

function getInitialState(key, defaultValue) {
  if (isServer()) {
    // server-side data is always fresh because it is fetched with every request
    return globalThis.__INITIAL_STATE__[key];
  } else {
    // use fresh state after ssr
    // if the component remounts after the ssr, the state is not fresh anymore
    // loading is false after server fetches the data, but
    // if the component remounts the loading should be true
    // window['loading'] will be false on every subsequent remount and client
    // will never re-fetch the data
    if (typeof window.__INITIAL_STATE__[key] !== 'undefined') {
      const state = window.__INITIAL_STATE__[key];
      // purge the initial state after using it to avoid stale initial data
      window.__INITIAL_STATE__[key] = undefined;
      return state;
    } else {
      return defaultValue;
    }
  }
}

function App() {
  const [loading, setLoading] = useState(getInitialState('loading'));
  const [data, setData] = useState(getInitialState('data'));
  const [error, setError] = useState(getInitialState('error'));

  useEffect(() => {
    if (loading) {
      fetchReactPackages()
        .then((data) => {
          setData(data);
          setLoading(false);
        })
        .catch((error) => {
          setError(error);
        });
    }
  }, [loading, setData, setLoading, setError]);

  if (loading) {
    return e('div', {}, 'Loading...');
  }

  if (error) {
    return e('div', {}, error);
  }

  return e(
    'article',
    {},
    e('h1', {}, 'React packages'),
    data.map((d) => {
      const { name, version, description } = d.package;
      return e(
        'section',
        { key: name + version },
        e('h1', {}, name),
        e('p', {}, description),
        e('p', {}, `Version: ${version}`)
      );
    })
  );
}

module.exports = App;
module.exports.fetchReactPackages = fetchReactPackages;
