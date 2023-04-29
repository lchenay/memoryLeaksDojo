/**
 * Your are not allowed to touch any of this file to optimise memory!
 * There is no memory leak here!
 */

const randomHugeData = (id) => new Array(200000).fill(0).join('');



const repository = {
    exists: async (id, req) => {
        // wait 100ms, DB are slow
        await new Promise(resolve => setTimeout(resolve, 100));

        return !(Math.round(id/1000) % 10 == 0)
    },
    getById: async (id, req) => {
        // wait 100ms, DB are slow
        await new Promise(resolve => setTimeout(resolve, 100));

        if (! (await repository.exists(id, req))) {
            const err = new Error('Not found');
            err.status = 404;
            throw err;
        }
        return {id: id, data: randomHugeData(id)}
    },
    sendAllToS3: async (data, req) => {
        // wait 100ms, S3 are slow
        await new Promise(resolve => setTimeout(resolve, 100));
    },
    schema: () => Buffer.alloc(6**9**1.02, ['exists', 'getById', 'sendAllToS3', 'schema'].join(',')).toString()
}

module.exports = repository;