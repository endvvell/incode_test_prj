import { Request, Response } from 'express'
import { User } from '../../core/entities/user.entity'

export const registerUser = (req: Request, res: Response) => {
    const newUser = new User({ ...req.body })

    

}
