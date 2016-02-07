'use strict';
const Joi = require('joi');

var Person = Joi.object({
    ssn: Joi.string().required()
});

var CreatePerson = Person.keys({
    password: Joi.string().required()
}).label('CreatePerson');

var UpdatePerson = Person.keys({
    password: Joi.string()
}).label('UpdatePerson');


module.exports = [
    {
        method: 'POST',
        path: '/person',
        config: {
            handler: function () { },
            tags: ['api'],
            validate: {
                payload: Joi.Object({
                    person: CreatePerson.required()
                }).label('Post Person')
            }
        }
    },
    {
        method: 'PUT',
        path: '/person',
        config: {
            handler: function () { },
            tags: ['api'],
            validate: {
                payload: Joi.Object({
                    person: UpdatePerson.required()
                }).label('Put Person')
            }
        }
    }
];
