var mongoClient = require("mongodb").MongoClient,
    ObjectId = require("mongodb").ObjectId,
    connection,
    db
//logger = require('nodewinstonlogger')

function isObject(obj) {
    return Object.keys(obj).length > 0 && obj.constructor === Object
}

class mongoDbClient {
    async connect(conn, onSuccess, onFailure) {
        try {
            this.connection = await mongoClient.connect(conn.url, { useNewUrlParser: true, useUnifiedTopology: true })
            this.db = this.connection.db(conn.dbName)
            console.log("MongoClient Connection successfull.")
            onSuccess()
        }
        catch (ex) {
            console.log("Error caught,", ex)
            onFailure(ex)
        }
    }

    async teardown(onSuccess, onFailure) {
        try {
            this.connection.close();
            console.log("MongoClient teardown successfull.")
            onSuccess()
        }
        catch (ex) {
            console.log("Error caught,", ex)
            onFailure(ex)
        }
    }

    async getNextSequence(coll) {
        return await this.db.collection("counters").findOneAndUpdate({
            _id: coll
        },
            { $inc: { seq: 1 } },
            {
                projections: { seq: 1 },
                upsert: true,
                returnOriginal: false
            }
        )
    }

    async insertDocumentWithIndex(coll, doc) {
        try {
            if (!isObject(doc)) {
                throw Error("mongoClient.insertDocumentWithIndex: document is not an object")
                return
            }
            var index = await this.getNextSequence(coll)
            doc.idx = index.value.seq
            return await this.db.collection(coll).insertOne(doc)
        }
        catch (e) {
            console.log("mongoClient.insertDocumentWithIndex: Error caught,", e)
            return Promise.reject(e)
        }
    }

    async insertDocument(coll, doc) {
        try {
            if (!isObject(doc)) {
                throw Error("mongoClient.insertDocument: document is not an object")
                return
            }

            return await this.db.collection(coll).insertOne(doc)
        }
        catch (e) {
            console.log("MongoClient.InsertDocument: Error caught,", e)
            return Promise.reject(e)
        }
    }

    async findDocFieldsByFilter(coll, query, projection, lmt, skip, sort) {
        if (!query) {
            throw Error("mongoClient.findDocFieldsByFilter: query is not an object")
        }
        return await this.db.collection(coll).find(query, {
            projection: projection || {},
            limit: lmt || 0,
            skip: skip || 0,
            sort: sort
        }).toArray()
    }

    async findDocByAggregation(coll, query) {
        if (!query.length) {
            throw Error("mongoClient.findDocByAggregation: query is not an object")
        }
        return this.db.collection(coll).aggregate(query).toArray()
    }

    async getDocumentCountByQuery(coll, query) {
        return this.db.collection(coll).estimatedDocumentCount(query || {})
    }

    async findOneAndUpdate(coll, query, values, option) {
        if (!(isObject(values) && isObject(query))) {
            throw Error("mongoClient.UpdateDocument: values and query should be an object")
        }
        return this.db.collection(coll).findOneAndUpdate(query, { $set: values }, option || {})
    }

    async modifyOneDocument(coll, query, values, option) {
        if (!(isObject(values) && isObject(query))) {
            throw Error("mongoClient.ModifyOneDocument: values, query and option should be an object")
        }
        return await this.db.collection(coll).updateOne(query, values, option || {})
    }
}

module.exports = {
    mongoDbClient,
    ObjectId
}