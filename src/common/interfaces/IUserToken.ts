export interface IUserToken {
    uuid: string;
    name: string;
    email: string;
    roleName: string;
}

export interface IReqToken extends IUserToken {
    iat: number,
    exp: number
}

declare module 'express-serve-static-core' {
    interface Request {
        user?: IReqToken
    }
}
