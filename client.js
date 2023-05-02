const _ = require('lodash');
const repository = require('./libs/repository');
const cache = new Map();
const schema = repository.schema();
const CACHE_SIZE = 10;

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

        // let's be a good developper and let's try to optimise ressources by avoid to request something that can avoid
        if (!cache.has(id)) {
            cache.set(id, repository.getById(id));
            if (cache.size > CACHE_SIZE) {
                cache.delete(cache.keys().next().value);
            }
        }

        return cache.get(id);
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
