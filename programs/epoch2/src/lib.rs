use anchor_lang::prelude::*;
use anchor_lang::AccountsClose;
pub mod event;
pub mod user;
declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod epoch {
    use super::*;

    // create_user initializes a user in epoch
    pub fn create_user_account(ctx: Context<CreateUserAccount>,bump:u8) -> ProgramResult {
        let user_account = &mut ctx.accounts.user_account;
        user_account.authority = *ctx.accounts.authority.key;
        user_account.bump = bump;
        user_account.name=String::from("My name");

        emit!(event::EpochEvent::success_event("create user".to_string()));
        
        Ok(())
    }

    pub fn update_user_account(ctx: Context<UpdateUserAccount>,name: String) -> ProgramResult{
        let user_account = &mut ctx.accounts.user_account;
        user_account.name = name;
        
        Ok(())
    }

    // follow_user allows user accounts to be linked
    pub fn follow_user(ctx: Context<FollowUser>,user_to_follow: Pubkey,bump:u8) -> ProgramResult {
        let following_account = &mut ctx.accounts.account;

        following_account.epoch_type = String::from("following");
        following_account.authority = *ctx.accounts.authority.key;
        following_account.followed_user = user_to_follow;
        following_account.user_account = ctx.accounts.user_account.key();
        following_account.bump = bump;
        Ok(())
    }


    // up_vote allows users to vote on a message
    pub fn up_vote(ctx: Context<UpVote>, message_account: Pubkey, bump: u8) -> ProgramResult {
        let vote_account = &mut ctx.accounts.account;
        vote_account.epoch_type = String::from("upVote");
        vote_account.authority = *ctx.accounts.authority.key;
        vote_account.message_account = message_account;
        Ok(())
    }

    // close account when user downvotes
    pub fn down_vote(ctx: Context<DownVote>) -> ProgramResult {
        let vote_account = &mut ctx.accounts.account;
        vote_account.epoch_type = String::from("upVote");
        Ok(())
    }

    // send_messages creates a message with the author as signer
    pub fn send_message(ctx: Context<SendMessage>,message: String, bump: u8) -> ProgramResult {
        emit!(event::EpochEvent::success_event("Send message".to_string()));
        let message_account = &mut ctx.accounts.message_account;
        let user_account = &mut ctx.accounts.user_account;
        let author: &Signer = &ctx.accounts.authority;
        let clock: Clock = Clock::get().unwrap();
        if message.chars().count() > 280 {
            return Err(ErrorCode::ContentTooLong.into());
        }
        // create the message account 
        message_account.content = message;
        message_account.authority = *author.key;
        message_account.timestamp = clock.unix_timestamp;
        message_account.topic = String::from("unknown");
        message_account.epoch_type = String::from("message");
        message_account.bump = bump;
        
        // Increment the number of messages
        user_account.message_count += 1;
        Ok(())
    }


}

const U8_LENGTH: usize = 1;
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
#[instruction(bump: u8)]
pub struct UpVote<'info> {
    #[account(mut)]
    pub message_account: Account<'info, Message>,
    #[account(
        init,
        payer=authority,
        seeds = [
            b"epoch",
            authority.key.as_ref(),
            ],
        bump = bump,
        space=VoteAccount::LEN)]
    pub account: Account<'info, VoteAccount>,
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DownVote<'info> {
    #[account(mut,has_one=authority,close=authority)]
    pub account: Account<'info, VoteAccount>,
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
#[derive(Default)]
pub struct VoteAccount {
    pub message_account: Pubkey,
    pub authority: Pubkey,
    pub epoch_type: String,
}

#[derive(Accounts)]
#[instruction(bump: u8)]
pub struct CommentMessage<'info> {
    #[account(mut)]
    pub user_account: Account<'info,User>,
    #[account(
        init, 
        payer=authority,
        seeds = [
            b"epoch",
            user_account.key().as_ref(),
            &[user_account.message_count as u8].as_ref()
            ],
        bump = user_account.bump,
        space=Comment::LEN)]
    pub comment_account: Account<'info, Comment>,
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
#[derive(Default)]
pub struct Comment {
    pub message: Pubkey,
    pub authority: Pubkey,
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
#[instruction(bump: u8)]
pub struct CreateUserAccount<'info> {
    #[account(
        init, 
        payer = authority, 
        seeds = [
            b"epoch",
            authority.key.as_ref(),
            ],
        bump = bump,
        space=User::LEN,
    )]
    pub user_account: Account<'info, User>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateUserAccount<'info>{
    #[account(mut, seeds = [
        b"epoch",
        user_account.authority.key().as_ref(),
        ],bump=user_account.bump)]
    pub user_account: Account<'info,User>,

}

#[account]
pub struct User {
    pub authority: Pubkey,
    pub name: String,
    pub created: i64,
    pub avatar: String,
    pub description: String,
    pub message_count: u8,
    pub bump: u8,
}

#[derive(Accounts)]
#[instruction(user_to_follow: Pubkey,bump:u8)]
pub struct FollowUser<'info> {
    pub user_account: Account<'info,User>,
    #[account(
        init,
        payer=authority,
        seeds= [
            b"epoch",
            user_to_follow.as_ref(),
            authority.key.as_ref()
        ],
        bump=bump,
        space=Following::LEN)]
    pub account: Account<'info, Following>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct Following {
    pub authority: Pubkey,
    pub user_account: Pubkey,
    pub epoch_type: String,
    pub followed_user: Pubkey,
    pub bump: u8,
}

#[derive(Accounts)]
#[instruction(message: String,bump: u8)]
pub struct SendMessage<'info> {
    #[account(mut, seeds = [
        b"epoch",
        user_account.authority.key().as_ref(),
        ],
        bump=user_account.bump
    )]
    pub user_account: Account<'info,User>,
    #[account(
        init,
        payer=authority,
        seeds = [
            b"epoch",
            authority.key().as_ref(),
            message.as_ref(),
        ],
        bump = bump,
        space = Message::LEN 
    )]
    pub message_account: Account<'info, Message>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
#[derive(Default)]
pub struct Message {
    pub authority: Pubkey,
    pub epoch_type: String,
    pub timestamp: i64,
    pub topic: String,
    pub content: String,
    pub bump: u8,
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
        + DESCRIPTION_LENGTH
        + STRING_LENGTH_PREFIX
        + U8_LENGTH
        + STRING_LENGTH_PREFIX
        + U8_LENGTH;
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
        + PUBLIC_KEY_LENGTH
        + STRING_LENGTH_PREFIX
        + EPOCH_TYPE_LENGTH
        + PUBLIC_KEY_LENGTH
        + STRING_LENGTH_PREFIX
        + U8_LENGTH;
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
        + MAX_CONTENT_LENGTH
        + STRING_LENGTH_PREFIX
        + U8_LENGTH;
}

#[error]
pub enum ErrorCode {
    #[msg("The provided topic should be 50 characters long maximum.")]
    TopicTooLong,
    #[msg("The provided content should be 280 characters long maximum.")]
    ContentTooLong,
}
