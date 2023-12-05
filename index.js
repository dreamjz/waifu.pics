const express = require('express');
const cors = require('cors');
const got = require('got');

const ENDPOINTS = require('./lib/endpoints.js');

const API_URL = 'https://api.waifu.pics';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    message: 'This is a simple server to get images from waifu.pics',
  });
});

app.get('/:type/:endpoint', async (req, res) => {
  console.log('match route: /:type/:endpoint');
  console.log('Get:' + req.url);

  let endpoint = req.params.endpoint.toLocaleLowerCase();
  let type = req.params.type.toLocaleLowerCase();

  console.log('endpoint: ' + endpoint);

  res.set('Cache-Control', 'no-cache');

  if (ENDPOINTS[type].includes(endpoint)) {
    fetchImage(type, endpoint, res);
  } else if (endpoint === 'random') {
    if (Object.keys(req.query).length !== 0) {
      ignoreEps = req.query.ignore.split(',');
      console.log('ignore: ' + ignoreEps);

      const filteredEps = ENDPOINTS[type].filter(function (e1) {
        return !ignoreEps.some(function (e2) {
          return e1 === e2;
        });
      });
      console.log("filtered endpoints: ", filteredEps);

      endpoint = filteredEps[getRandomIntn(filteredEps.length)];
    } else {
      endpoint = ENDPOINTS[type][getRandomIntn(ENDPOINTS[type].length)];
    }

    console.log('endpoint: ' + endpoint);

    fetchImage(type, endpoint, res);
  } else {
    res.status(400).json({
      message: 'Bad endpoint',
    });
  }
});

// select a random endpoint from query
app.get('/:type', async (req, res) => {
  console.log('match route: /:type');
  console.log('Get:' + req.url);

  let epStr = req.query.eps;
  let type = req.params.type.toLocaleLowerCase();

  // get endpoints array
  let eps = epStr.split(',');
  console.log('endpoints: ' + eps);

  // get random endpoint
  let endpoint = eps[getRandomIntn(eps.length)];
  console.log('endpoint: ' + endpoint);

  res.set('Cache-Control', 'no-cache');

  if (ENDPOINTS[type].includes(endpoint)) {
    fetchImage(type, endpoint, res);
  } else {
    res.status(400).json({
      message: 'Bad endpoint',
    });
  }
});

async function fetchImage(type, endpoint, response) {
  try {
    const { url } = await got(`${API_URL}/${type}/${endpoint}`).json();

    got
      .stream(url)
      .on('response', (response) => {
        response.headers['cache-control'] = 'no-cache';
      })
      .pipe(response);
  } catch (error) {
    response.status(500).json({
      message: error.message,
    });
  }
}

const PORT = process.env.PORT || 8880;

app.listen(PORT, () => {
  console.log('Server is listening in port' + PORT);
});

function getRandomIntn(max) {
  return Math.floor(Math.random() * max);
}
