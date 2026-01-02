import { Injectable } from '@nestjs/common';
import * as bycrypt from 'bcryptjs'
import { Member } from '../../libs/dto/member/member';
import { T } from '../../libs/types/common';
import { JwtService } from '@nestjs/jwt'
import { shapeIntoMongoObjectId } from '../../libs/config';

@Injectable()
export class AuthService {
        constructor(private jwtService: JwtService){}
        
        public async hashPassword(memberPassword: string): Promise<string>{
        const salt = await bycrypt.genSalt();
        return await bycrypt.hash(memberPassword,salt);
    }

    public async comparePasswords(password: string, hashedPassword: string): Promise<boolean>{
        return await bycrypt.compare(password,hashedPassword);
    }

    public async createToken(member: Member): Promise<string>{
        console.log("member=>", member)
        const payload: T = {memberNick: "TEST"}

        Object.keys(member['_doc'] ? member['_doc'] : member).map((ele)=>{
            payload[`${ele}`] = member[`${ele}`]
        })
        delete payload.memberPassword;
        console.log("payload=>",payload)

        return await this.jwtService.signAsync(payload)
    }

    public async verifyToken(token: string): Promise<Member>{
        const member = await this.jwtService.verifyAsync(token)
        member._id = shapeIntoMongoObjectId(member._id);
        return member;
    }
}
