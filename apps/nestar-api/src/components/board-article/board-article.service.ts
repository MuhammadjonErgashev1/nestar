import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { BoardArticle, BoardArticles } from '../../libs/dto/board-article/board-article';
import { MemberService } from '../member/member.service';
import { ViewService } from '../view/view.service';
import { AllBoardArticlesInquiry, BoardArticleInput, BoardArticlesInquiry } from '../../libs/dto/board-article/board-article.input';
import { Direction, Message } from '../../libs/enums/common.enum';
import { ViewGroup } from '../../libs/enums/view.enum';
import { BoardArticleStatus } from '../../libs/enums/board-article.enum';
import { StatisticModifier, T } from '../../libs/types/common';
import { BoardArticleUpdate } from '../../libs/dto/board-article/board-article.update';
import { lookupMember } from '../../libs/config';
import { LikeService } from '../like/like.service';
import { LikeInput } from '../../libs/dto/like/like.input';
import { LikeGroup } from '../../libs/enums/like.enum';

@Injectable()
export class BoardArticleService {
    constructor(@InjectModel('BoardArticle') private readonly boardArticleModel: Model<BoardArticle>,
    private readonly memberService: MemberService,
    private readonly viewService: ViewService,
    private readonly likeService: LikeService,
    ){}

    public async createBoardArticle(memberId: ObjectId, input: BoardArticleInput): Promise<BoardArticle> {
    // Maqolaga muallif ID sini biriktirish
    input.memberId = memberId;

    try {
        // Ma'lumotlar bazasida yangi maqola yaratish
        const result = await this.boardArticleModel.create(input);

        // Muallifning statistikasini yangilash (maqolalar sonini +1 ga oshirish)
        await this.memberService.membersStatsEditor({
            _id: memberId,
            targetKey: 'memberArticles',
            modifier: 1,
        });

        return result;
    } catch (err) {
        console.log('Error, Service.model:', err.message);
        throw new BadRequestException(Message.CREATE_FAILED);
    }
}
public async getBoardArticle(memberId: ObjectId, articleId: ObjectId): Promise<BoardArticle> {
    const search: T = {
        _id: articleId,
        articleStatus: BoardArticleStatus.ACTIVE,
    };
    
    const targetBoardArticle: BoardArticle = await this.boardArticleModel
        .findOne(search)
        .lean()
        .exec();

    if (!targetBoardArticle) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

    // Agar foydalanuvchi tizimga kirgan bo'lsa, ko'rishlar statistikasini yuritish
    if (memberId) {
        const viewInput = { 
            memberId: memberId, 
            viewRefId: articleId, 
            viewGroup: ViewGroup.ARTICLE 
        };
        const newView = await this.viewService.recordView(viewInput);
        
        if (newView) {
            await this.boardArticleStatsEditor({ 
                _id: articleId, 
                targetKey: 'articleViews', 
                modifier: 1 
            });
            targetBoardArticle.articleViews++;
        }
        //meliked
        const likeInput = {memberId: memberId, likeRefId: articleId, likeGroup: LikeGroup.ARTICLE}
        targetBoardArticle.meLiked = await this.likeService.checkLikeExistence(likeInput)
    }

    // Maqola muallifi haqidagi ma'lumotlarni biriktirish
    targetBoardArticle.memberData = await this.memberService.getMember(null, targetBoardArticle.memberId);

    return targetBoardArticle;
}
public async boardArticleStatsEditor(input: StatisticModifier): Promise<BoardArticle> {
    const { _id, targetKey, modifier } = input;
    
    // Maqolani ID orqali topish va ko'rsatilgan maydonni (targetKey) modifier qiymatiga o'zgartirish
    const result = await this.boardArticleModel
        .findByIdAndUpdate(
            _id, 
            { $inc: { [targetKey]: modifier } }, // $inc operatori qiymatni qo'shish yoki ayirish uchun
            { new: true } // Yangilangan ma'lumotni qaytarish
        )
        .exec();

    // Agar maqola topilmasa yoki yangilashda xatolik bo'lsa
    if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);

    return result;
}

public async updateBoardArticle(memberId: ObjectId, input: BoardArticleUpdate): Promise<BoardArticle> {
    const { _id, articleStatus } = input;
    
    // Faqat o'ziga tegishli va ACTIVE holatdagi maqolani tahrirlash mumkin
    const result = await this.boardArticleModel
        .findOneAndUpdate(
            { _id: _id, memberId: memberId, articleStatus: BoardArticleStatus.ACTIVE }, 
            input, 
            { new: true }
        )
        .exec();

    if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);

    // Agar maqola DELETE qilinsa, foydalanuvchining maqolalar soni statistikasini kamaytirish
    if (articleStatus === BoardArticleStatus.DELETE) {
        await this.memberService.membersStatsEditor({
            _id: memberId,
            targetKey: 'memberArticles',
            modifier: -1,
        });
    }

    return result;
}

public async getBoardArticles(memberId: ObjectId, input: BoardArticlesInquiry): Promise<BoardArticles> {
    const { articleCategory, text } = input.search;
    const match: T = { articleStatus: BoardArticleStatus.ACTIVE }; // Faqat faol maqolalar
    const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

    // Qidiruv filtrlari
    if (articleCategory) match.articleCategory = articleCategory;
    if (text) match.articleTitle = { $regex: new RegExp(text, 'i') };

    const result = await this.boardArticleModel
        .aggregate([
            { $match: match },
            { $sort: sort },
            {
                $facet: {
                    list: [
                        { $skip: (input.page - 1) * input.limit },
                        { $limit: input.limit },
                        // Muallif ma'lumotlarini ulash
                        lookupMember, 
                        { $unwind: '$memberData' },
                    ],
                    metaCounter: [{ $count: 'total' }],
                },
            },
        ])
        .exec();

    if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

    return result[0];
}

public async likeTargetBoardArticle(memberId: ObjectId, likeRefId: ObjectId): Promise<BoardArticle> {
    const target: BoardArticle = await this.boardArticleModel
        .findOne({ _id: likeRefId, articleStatus: BoardArticleStatus.ACTIVE })
        .exec();

    if (!target) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

    const input: LikeInput = {
        memberId: memberId,
        likeRefId: likeRefId,
        likeGroup: LikeGroup.ARTICLE,
    };

    const modifier: number = await this.likeService.toggleLike(input);
    const result = await this.boardArticleStatsEditor({
        _id: likeRefId,
        targetKey: 'articleLikes',
        modifier: modifier,
    });

    if (!result) throw new InternalServerErrorException(Message.SOMETHING_WENT_WRONG);

    return result;
}

public async getAllBoardArticlesByAdmin(input: AllBoardArticlesInquiry): Promise<BoardArticles> {
    const { articleStatus, articleCategory } = input.search;
    const match: T = {};
    const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

    // Admin filtrlari
    if (articleStatus) match.articleStatus = articleStatus;
    if (articleCategory) match.articleCategory = articleCategory;

    const result = await this.boardArticleModel
        .aggregate([
            { $match: match },
            { $sort: sort },
            {
                $facet: {
                    list: [
                        { $skip: (input.page - 1) * input.limit },
                        { $limit: input.limit },
                        lookupMember,
                        { $unwind: '$memberData' },
                    ],
                    metaCounter: [{ $count: 'total' }],
                },
            },
        ])
        .exec();

    if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

    return result[0];
}

public async updateBoardArticleByAdmin(input: BoardArticleUpdate): Promise<BoardArticle> {
    const { _id, articleStatus } = input;

    // Admin har qanday holatdagi maqolani tahrirlashi mumkin
    const result = await this.boardArticleModel
        .findOneAndUpdate({ _id: _id }, input, { new: true })
        .exec();

    if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);

    // Agar admin maqolani o'chirsa (DELETE), muallif statistikasini kamaytirish
    if (articleStatus === BoardArticleStatus.DELETE) {
        await this.memberService.membersStatsEditor({
            _id: result.memberId,
            targetKey: 'memberArticles',
            modifier: -1,
        });
    }

    return result;
}

public async removeBoardArticleByAdmin(articleId: ObjectId): Promise<BoardArticle> {
    const search: T = {_id: articleId, articleStatus: BoardArticleStatus.DELETE}
    const result = await this.boardArticleModel
        .findOneAndDelete(search) 
        .exec();

    if (!result) throw new InternalServerErrorException(Message.REMOVE_FAILED); 

    return result; //
}

}
