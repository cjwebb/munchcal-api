"use strict"

var pg    = require('pg'),
    types = require('pg').types,
    uuid  = require('node-uuid'),
    _     = require('lodash');

var config = require('../../config.js');

// return dates as strings, instead of JavaScript dates
var DATE_OID = 1082
var TIMESTAMPTZ_OID = 1114
var TIMESTAMP_OID = 1184
var parseFn = function(val) {
    return val; 
}
types.setTypeParser(DATE_OID, parseFn);

// wrapper around pg.connect to abstract away client pooling
var query = function(statement, params, cb) {
    pg.connect(config.pgConnectionString, function(err, client, done){
        if (err) {
            throw new Error('Error fetching client from pool', err);
        }
        client.query(statement, params, function(err, result){
            done();
            cb(err, result);
        });
    });
}

var createMeal = function(meal, cb) {
    var mealId = uuid.v1();
    var dateCreated = new Date() 
    var dateModified = dateCreated;
    var data = null;

    var queryString = 'INSERT INTO meals (id, date_created, date_modified, user_id, who_text, what_text, meal_date, data) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)';
    var values = [ mealId, dateCreated, dateModified, meal.userId, meal.who, meal.what, meal.date, data ];

    query(queryString, values, function(err, result){
        if (err) return cb(err);
        var response = {
            id: mealId,
            dateCreated: dateCreated,
            dateModified: dateModified,
            userId: meal.userId,
            who: meal.who,
            what: meal.what,
            date: meal.date,
            data: data
        };
        cb(err, response);
    });
};

var getMeals = function(userId, startDate, endDate, cb){
    var queryString = 'SELECT * from meals WHERE user_id = $1 and meal_date BETWEEN $2 and $3 ORDER BY meal_date ASC ';
    var values = [ userId, startDate, endDate ];
    query(queryString, values, function(err, results){
        if (err) return cb(err);
        cb(null, _.map(results.rows, function(r){ 
            return {
                id: r.id,
                date: r.meal_date,
                who: r.who_text,
                what: r.what_text,
                data: r.data 
            };
        }));
    });
};

var deleteMeal = function(userId, mealId, callback){
    var queryString = 'DELETE from meals WHERE user_id = $1 and id = $2';
    var values = [ userId, mealId ];
    query(queryString, values, function(err, results){
        if (err) return callback(err);
        callback(null, results);
    });
}

exports.createMeal = createMeal;
exports.getMeals = getMeals;
exports.deleteMeal = deleteMeal;

