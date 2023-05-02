/**
 * Your are not allowed to touch any of this file to optimise memory!
 * There is no memory leak here!
 */

const app = require('../server.js');
const chai = require('chai');
chai.use(require('chai-http'));

const tests = [];

tests.push({
    method: '/healthcheck', 
    data: () => ({}),
    expect: (err, res) => {chai.expect(res.text).to.equal('ok')}
})

tests.push({
    method: '/getById', 
    data: () => ({id: Date.now()}), 
    expect: (err, res, data) => {
        if (Math.round(data.id/1000) % 10 == 0) {
            return chai.expect(res.text).to.equal('Not found')
        }
        chai.expect(res.body.id).to.equal(data.id);
    }
});

tests.push({
    method: '/sendAllToS3', 
    data: () => ({ids: Array(10).fill(0).map((_, index) => Date.now() + index)}), 
    expect: (err, res) => {}
})

tests.push({method: '/whatNumber', data: () => ({number: Date.now()}), expect: (err, res) => {}})

tests.push({
    method: '/computeSpecialSum', 
    data: () => ({numbers: Array(100000).fill(5)}),
    expect: (err, res) => chai.expect(res.text).to.equal('55000000')
})

let before = process.memoryUsage().heapUsed / 1024 / 1024;
let i = 0;

setInterval(async () => {
    for (let {method, expect, data} of tests) {
        const json = data();

        chai.request(app)
            .post(method)
            .set('content-type', 'application/json')
            .send(json).end((err, res) => expect(err, res, json))
    }
    if (global.gc)
        global.gc();

    const memoryUsed = process.memoryUsage().heapUsed / 1024 / 1024
    const memoryIncreased = memoryUsed - before;
    i++;
    console.log("Memory usage: ", memoryUsed, "MB (+", memoryIncreased, "MB) After" + i + 'runs');
    before = memoryUsed;
}, 500)
