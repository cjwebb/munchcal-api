"use strict"

var express     = require('express'),
    bodyParser  = require('body-parser'),
    moment      = require('moment'),
    momentRange = require('moment-range'),
    _           = require('lodash'),
    app         = express();

var db          = require('./app/db');

app.use(bodyParser.json());

var calendarFormat = "YYYY-MM-DD";
var dateRange = function(start, end){
    var days = [];
    moment().range(start, end).by('days', function(d){
        days.push(d.format(calendarFormat));
    });
    return days;
};

app.route('/users/:userId/meals')
    .post(function(req, res){

        // todo - validate request body
        var meal = req.body;
        meal.userId = req.params.userId;

        db.createMeal(meal, function(err, result){
            if (err) return res.status(500).json({error: err.message});
            res.status(201).json(result);
        });
    })
    .get(function(req, res){
        // no date specified, so assume we want the current week
        var userId = req.params.userId;

        var fromDate = moment(req.query.from, calendarFormat, true); // true -> strict parsing
        if (!fromDate.isValid()) fromDate = moment().utc();

        var startOfWeek = moment(fromDate).isoWeekday(1);
        var endOfWeek = moment(fromDate).isoWeekday(7);
        var previous = moment(startOfWeek).subtract(7, 'days');
        var next = moment(endOfWeek).add(1, 'days');

        db.getMeals(userId, startOfWeek, endOfWeek, function(err, meals){
            if (err) return res.status(500).json({ error: err.message });

            var grouped = _.groupBy(meals, 'date');
            var range = dateRange(startOfWeek, endOfWeek);
            var data = _.map(range, function(date){
                var food = grouped[date] || [ ];
                return {
                    date: date,
                    food: food
                }
            });

            res.json({
                start: startOfWeek.format(calendarFormat),
                end: endOfWeek.format(calendarFormat),
                days: data,
                pagination: {
                    previous: previous.format(calendarFormat),
                    next: next.format(calendarFormat)
                } 
            });
        })
    });

app.route('/users/:userId/meals/:mealId')
    .delete(function(req, res){
        var userId = req.params.userId;
        var mealId = req.params.mealId;
        db.deleteMeal(userId, mealId, function(err, result){
            if (err) return res.status(500).json({ error: err.message });
            return res.sendStatus(200); 
        });
    });

app.listen(process.env.PORT || 10000);

