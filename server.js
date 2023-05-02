const express = require('express');
const app = express();
const client = require('./client')
const dataFox = require('./libs/dataFox');
var bodyParser = require('body-parser')
const debug = require('debug')('server')

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json({limit: '50mb'}))

/* DEBUG */
// I want observability
const requestSeen = [];
let previousRequest = Promise.resolve();
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
    // fix: remove the assignment to previousRequest
    previousRequest.then(() => dataFox.push(dataToObserve));

    // fix: do not inject huge data into requestSeen while we only use the path
    requestSeen.push(req.path);
    debug(`Total request seen: ${requestSeen.length}
      Last 5 endpoints called: ${requestSeen.slice(-5).map(r => r)}`);
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
  const data = [];
  for (let id of req.body.ids) {
    data.push(await client.getById(id))
  }
  await client.sendAllToS3(data);
  res.send(`Ok`);
});

app.post('/whatNumber ', async (req, res) => {
  let id = req.body.number;

  const promise = new Promise((resolve) => {
    const sum = Array(100000).fill(4).reduce((acc, val) => acc + val, id);
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
    .map(val => (val+1)*2-1)
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
