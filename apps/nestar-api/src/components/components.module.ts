import { Module } from '@nestjs/common';
import { MemberModule } from './member/member.module';
import { PropertyModule } from './property/property.module';
import { AuthModule } from './auth/auth.module';
import { CommentModule } from './comment/comment.module';
import { LikeModule } from './like/like.module';
import { ViewModule } from './view/view.module';
import { FollowModule } from './follow/follow.module';
import { BoardArticalModule } from './board-article/board-artical.module';
import { BoardArticleResolver } from './board-article/board-article.resolver';

@Module({
	imports: [
		MemberModule,
		AuthModule,
		PropertyModule,
		BoardArticalModule,
		CommentModule,
		LikeModule,
		ViewModule,
		FollowModule,
	],
	providers: [BoardArticleResolver],
})
export class ComponentsModule {}
