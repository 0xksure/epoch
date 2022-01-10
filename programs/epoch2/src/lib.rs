use anchor_lang::prelude::*;
use anchor_lang::AccountsClose;
pub mod event;
pub mod user;
declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod epoch {
    use super::*;

    // create_user initializes a user in epoch
    pub fn create_user(ctx: Context<CreateUser>) -> ProgramResult {
        let user_account = &mut ctx.accounts.user_account;
        user_account.authority = *ctx.accounts.authority.key;
        emit!(event::EpochEvent::success_event("create user".to_string()));
        Ok(())
    }

    // follow_user allows user accounts to be linked
    pub fn follow_user(ctx: Context<FollowUser>, user_to_follow: Pubkey) -> ProgramResult {
        let following_account = &mut ctx.accounts.account;

        following_account.epoch_type = String::from("following");
        following_account.user = *ctx.accounts.user.key;
        following_account.followed_user = user_to_follow;
        Ok(())
    }

    // up_vote allows users to vote on a message
    pub fn up_vote(ctx: Context<UpVote>, message_account: Pubkey) -> ProgramResult {
        let vote_account = &mut ctx.accounts.account;
        vote_account.epoch_type = String::from("upVote");
        vote_account.voter = *ctx.accounts.signer.key;
        vote_account.message_account = message_account;
        Ok(())
    }

    // close account when user downvotes
    pub fn down_vote(ctx: Context<DownVote>) -> ProgramResult {
        let vote_account = &mut ctx.accounts.account;
        let voter = &ctx.accounts.voter;

        //vote_account.close(voter.to_account_info())?;
        Ok(())
    }

    // send_messages creates a message with the author as signer
    pub fn send_message(ctx: Context<SendMessage>, content: String) -> ProgramResult {
        let message_account = &mut ctx.accounts.message_account;
        let author: &Signer = &ctx.accounts.author;
        let clock: Clock = Clock::get().unwrap();
        if content.chars().count() > 280 {
            return Err(ErrorCode::ContentTooLong.into());
        }
        message_account.content = content;
        message_account.author = *author.key;
        message_account.timestamp = clock.unix_timestamp;
        message_account.topic = String::from("unknown");
        message_account.epoch_type = String::from("message");
        Ok(())
    }
}

const DISCRIMINATOR_LENGTH: usize = 8;
const PUBLIC_KEY_LENGTH: usize = 32;
const EPOCH_TYPE_LENGTH: usize = 50 * 4;
const TIMESTAMP_LENGTH: usize = 8;
const STRING_LENGTH_PREFIX: usize = 4; // Stores the size of the string.
const MAX_TOPIC_LENGTH: usize = 50 * 4; // 50 chars max.
const MAX_CONTENT_LENGTH: usize = 280 * 4; // 280 chars max.
const DESCRIPTION_LENGTH: usize = 100 * 4; // 100 chars max
const URL_LENGTH: usize = 30 * 4; // 30 chars max url
const NAME_LENGTH: usize = 20 * 4; // 20 chars max name

#[derive(Accounts)]
pub struct UpVote<'info> {
    #[account(init,payer=signer,space=VoteAccount::LEN)]
    pub account: Account<'info, VoteAccount>,
    pub signer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DownVote<'info> {
    #[account(has_one=voter)]
    pub account: Account<'info, VoteAccount>,
    pub voter: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct VoteAccount {
    pub message_account: Pubkey,
    pub voter: Pubkey,
    pub epoch_type: String,
}

#[derive(Accounts)]
pub struct CommentMessage<'info> {
    #[account(init, payer=author,space=Comment::LEN)]
    pub comment_account: Account<'info, Comment>,
    pub author: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct Comment {
    pub message: Pubkey,
    pub author: Pubkey,
    pub content: String,
    pub created: i64,
}

impl Comment {
    const LEN: usize = PUBLIC_KEY_LENGTH
        + PUBLIC_KEY_LENGTH
        + STRING_LENGTH_PREFIX
        + MAX_CONTENT_LENGTH
        + TIMESTAMP_LENGTH;
}

#[derive(Accounts)]
pub struct CreateUser<'info> {
    #[account(init, payer = authority, space = User::LEN)]
    pub user_account: Account<'info, User>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct User {
    pub authority: Pubkey,
    pub name: String,
    pub created: i64,
    pub avatar: String,
    pub description: String,
}

#[derive(Accounts)]
pub struct FollowUser<'info> {
    #[account(init,payer=user,space=Following::LEN)]
    pub account: Account<'info, Following>,
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct Following {
    pub user: Pubkey,
    pub epoch_type: String,
    pub followed_user: Pubkey,
}

#[derive(Accounts)]
pub struct SendMessage<'info> {
    #[account(init,payer=author,space = Message::LEN  )]
    pub message_account: Account<'info, Message>,
    pub author: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct Message {
    pub author: Pubkey,
    pub epoch_type: String,
    pub timestamp: i64,
    pub topic: String,
    pub content: String,
}

impl User {
    const LEN: usize = DISCRIMINATOR_LENGTH
        + PUBLIC_KEY_LENGTH
        + STRING_LENGTH_PREFIX
        + NAME_LENGTH
        + TIMESTAMP_LENGTH
        + STRING_LENGTH_PREFIX
        + URL_LENGTH
        + STRING_LENGTH_PREFIX
        + DESCRIPTION_LENGTH;
}

impl VoteAccount {
    const LEN: usize = DISCRIMINATOR_LENGTH
        + PUBLIC_KEY_LENGTH
        + PUBLIC_KEY_LENGTH
        + STRING_LENGTH_PREFIX
        + EPOCH_TYPE_LENGTH;
}

impl Following {
    const LEN: usize = DISCRIMINATOR_LENGTH
        + PUBLIC_KEY_LENGTH
        + STRING_LENGTH_PREFIX
        + EPOCH_TYPE_LENGTH
        + PUBLIC_KEY_LENGTH;
}

impl Message {
    const LEN: usize = DISCRIMINATOR_LENGTH
        + PUBLIC_KEY_LENGTH
        + STRING_LENGTH_PREFIX
        + EPOCH_TYPE_LENGTH
        + TIMESTAMP_LENGTH
        + STRING_LENGTH_PREFIX
        + MAX_TOPIC_LENGTH
        + STRING_LENGTH_PREFIX
        + MAX_CONTENT_LENGTH;
}

#[error]
pub enum ErrorCode {
    #[msg("The provided topic should be 50 characters long maximum.")]
    TopicTooLong,
    #[msg("The provided content should be 280 characters long maximum.")]
    ContentTooLong,
}
