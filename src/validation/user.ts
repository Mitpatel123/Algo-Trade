"use strict"
import { Request, Response } from 'express'
import * as Joi from "joi"
import { apiResponse } from '../common'


//user registration
export const signUp = async (req: Request, res: Response, next: any) => {

    var schema = Joi.object({
        phoneNumber: Joi.string()
            .required()
            .pattern(/^[0-9]{10}$/)
            .messages({
                'any.required': 'phoneNumber is required', 'string.pattern.base': 'phoneNumber must be a 10-digit number'
            }),
        role: Joi.number()
            .required()
            .valid(0, 1)
            .messages({
                'any.required': 'role is required',
                'any.only': 'role must be 0 or 1'
            }),
        password: Joi.string()
            .messages({
                'any.required': 'phoneNumber is required', 'string.pattern.base': 'phoneNumber must be a 10-digit number'
            })

    })

    schema.validateAsync(req.body).then(result => {
        return next()
    }).catch(error => {
        res.status(400).json(new apiResponse(400, error.message, {}, {}))
    })
}

//verifivstion of OTP

export const verificationOtp = async (req: Request, res: Response, next: any) => {
    const schema = Joi.object({
        phoneNumber: Joi.string()
            .required()
            .pattern(/^[0-9]{10}$/)
            .messages({
                'any.required': 'phoneNumber is required',
                'string.pattern.base': 'phoneNumber must be a 10-digit number'
            }),
        otp: Joi.number().required().messages({ 'any.required': 'Otp is required', 'number.base': 'Otp must be a number' }),
    })
    schema.validateAsync(req.body).then(result => {
        return next()
    }).catch(error => {
        res.status(400).json(new apiResponse(400, error.message, {}, {}))
    })
}

//delete the user
export const deletes = async (req: Request, res: Response, next: any) => {
    const schema = Joi.object({
        id: Joi.string().error(new Error('id is required!'))
    })
    schema.validateAsync(req.query).then(result => {
        return next()
    }).catch(error => {
        res.status(400).json(new apiResponse(400, error.message, {}, {}))
    })
}


//update user
export const updateuser = async (req: Request, res: Response, next: any) => {
    const schema = Joi.object({
        id: Joi.string().required().error(new Error('id is reqired')),
        fullname: Joi.string().required().error(new Error('name is required!')),
        email: Joi.string()
            .required()
            .pattern(/^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/)
            .messages({
                'any.required': 'email is required',
                'string.pattern.base': 'email format must be followed'
            })
    })
    schema.validateAsync(req.body).then(result => {
        return next()
    }).catch(error => {
        res.status(400).json(new apiResponse(400, error.message, {}, {}))
    })
}

//det user by id
export const by_id = async (req: Request, res: Response, next: any) => {
    const schema = Joi.object({
        id: Joi.string().error(new Error('id is required!'))
    })
    schema.validateAsync(req.query).then(result => {
        return next()
    }).catch(error => {
        res.status(400).json(new apiResponse(400, error.message, {}, {}))
    })
}


export const addTicket = async (req: Request, res: Response, next: any) => {
    const schema = Joi.object({
        user_id: Joi.string().required().error(new Error('usre_id is required')),
        subject: Joi.string().required().error(new Error('subject is required')),
        category: Joi.string().required().error(new Error('category is required!')),
        message: Joi.string().error(new Error('message is string!'))
    })
    schema.validateAsync(req.body).then(async result => {
        req.body = result
        return next()
    }).catch(async error => {
        res.status(400).json(await new apiResponse(400, error.message, {}, {}))
    })
}

export const getTicket = async (req: Request, res: Response, next: any) => {
    const schema = Joi.object({
        user_id: Joi.string().required().error(new Error('user_id is required')),
        ticket_id: Joi.string().error(new Error('ticket_id is string')),
        category: Joi.string().error(new Error('category is string')),
        start_date: Joi.string().error(new Error('start_date is string')),
        end_date: Joi.string().error(new Error('end_date is string')),
    })
    schema.validateAsync(req.body).then(async result => {
        req.body = result
        return next()
    }).catch(async error => {
        res.status(400).json(await new apiResponse(400, error.message, {}, {}))
    })
}


export const updateTicket = async (req: Request, res: Response, next: any) => {
    const schema = Joi.object({
        user_id: Joi.string().required().error(new Error('user_id is required')),
        ticket_id: Joi.string().required().error(new Error('ticket_id is required')),
        status: Joi.string().valid("on hold", "painding", "cancel", "in progress").required().error(new Error('status is required')),
        response: Joi.string().required().error(new Error('response is required!')),
    })
    schema.validateAsync(req.body).then(async result => {
        req.body = result
        return next()
    }).catch(async error => {
        res.status(400).json(await new apiResponse(400, error.message, {}, {}))
    })
}

