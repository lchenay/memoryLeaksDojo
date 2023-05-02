const _ = require('lodash');
const repository = require('./libs/repository');
const data = {}, schema = repository.schema();

const client = module.exports = {
    exists: _.memoize(repository.exists),
    getById: async (id) => {
        // We can early exists when we know that the data is not in the DB
        // Let's not wait the full round trip, to return the not found if we can early exit
        if (!(await client.exists(id))) {
            const err = new Error('Not found');
            err.status = 404;
            throw err;
        }

        // storing this huge data in cache is causing memory leak issue
        return repository.getById(id);
    },
    sendAllToS3: (data) => {
        repository.sendAllToS3(data);
    }
}

// check that I don't expose any function that is not in the schema
const schemaFunctions = schema.split(',');
for (let key in client) {
    if (!schemaFunctions.includes(key)) {
        throw new Error(`You are not allowed to expose the function ${key}`)
    }
}
