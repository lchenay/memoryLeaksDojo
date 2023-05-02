const express = require('express');
const app = express();
const client = require('./client')
const dataFox = require('./libs/dataFox');
const bodyParser = require('body-parser')
const debug = require('debug')('server')

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json({limit: '50mb'}))

/* DEBUG */
// I want observability
const requestSeen = [];
let totalRequestSeen = 0;
let previousRequest = Promise.resolve();

const observe = async (dataToObserve) => {
  await previousRequest;
  previousRequest = dataFox.push(dataToObserve);
}

app.use((req, res, next) => {
  const dataToObserve = {
    debugInformation: JSON.stringify({
      body: req.body,
      headers: req.headers,
      method: req.method,
      path: req.path,
      query: req.query,
      url: req.url,
    })
  }

  res.on('finish', function() {
    // good developer don't brute force deps, let's wait previous request to finish before sending a new one. It's easy with Promise
    observe(dataToObserve);

    totalRequestSeen++;
    requestSeen.push(req);
    if (requestSeen.length > 5) {
      requestSeen.shift();
    }
    debug(`Total request seen: ${totalRequestSeen}
      Last 5 endpoints called: ${requestSeen.map(r => r.path)}`);
  });

  next();
});

/* ROUTES */

const data = [];
app.post('/healthcheck', async (req, res) => {
  res.send('ok');
});

app.post('/getById', async (req, res) => {
  const data = await client.getById(req.body.id, req);

  await new Promise(resolve => setTimeout(resolve, 1000));

  res.send(data);
});

app.post('/sendAllToS3', async (req, res) => {
  const data = new Map();
  for (let id of req.body.ids) {
    const item = await client.getById(id, req);
    if (!data.has(id)) {
      data.set(id, item);
    }
  }

  // Do something with all data
  await client.sendAllToS3(Array.from(data));

  res.send(`Ok`);
});

app.post('/whatNumber ', async (req, res) => {
  const id = req.body.number;

  const promise = new Promise((resolve) => {
    const data = Array(100000).fill(4);
    const sum = data.reduce((acc, val) => acc + val, id);
    if (sum%2 == 0) {
      return resolve('It\'s even');
    } else {
      if (sum%3) {
        return resolve('It\'s multiple of 3');
      } else {
        switch (true) {
          case Math.floor(sum/1000) % 10 == 0:
            return resolve('It\'s multiple of 10000');
          case 11 * (sum/11 - Math.floor(sum/11)) == 0:
            return resolve('It\'s multiple of 11');
        }
      }
    }
  });

  promise.then((result) => {
    debug(`End of processing ${data.length} elements with id ${id}`)
    res.send(result);
  })
});

// Let's compute easily a special sum
// Good ingeneer write code that is easy to read and maintain
// We use simple operation splitted in multiple lines
app.post('/computeSpecialSum', async (req, res) => {
  const result = req.body.numbers.flatMap(val => Array(50).fill(val))
    .map(val => val+1)
    .map(val => val*2)
    .map(val => val-1)
    .reduce((acc, val) => acc + val, 0);

  res.send(result);
})

app.use((err, req, res, next) => {
  if (err.status === 404)
    return res.status(404).send('Not found')
  console.log(err)
  res.status(500).send('Something broke!')
});

module.exports = app;
