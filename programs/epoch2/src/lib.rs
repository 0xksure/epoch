use anchor_lang::prelude::*;
pub mod user;
declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod epoch {
    use super::*;

    // create_user creates a new user account with the the signer as user
    pub fn create_user(ctx: Context<CreateUser>) -> ProgramResult {
        let user_account = &mut ctx.accounts.user_account;
        user_account.user = *ctx.accounts.user.key;
        Ok(())
    }

    // follow_user allows user accounts to be linked
    pub fn follow_user(ctx: Context<FollowUser>, user_to_follow: Pubkey) -> ProgramResult {
        let following_account = &mut ctx.accounts.account;
        let user = &ctx.accounts.user;

        following_account.message_type = String::from("following");
        following_account.user = *user.key;
        following_account.following_user = user_to_follow;
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
        message_account.message_type = String::from("message");
        Ok(())
    }
}

const DISCRIMINATOR_LENGTH: usize = 8;
const PUBLIC_KEY_LENGTH: usize = 32;
const EPOCH_TYPE_LENGTH_PREFIX: usize = 4; // Type of EPOCH
const EPOCH_TYPE_LENGTH: usize = 50 * 4;
const TIMESTAMP_LENGTH: usize = 8;
const STRING_LENGTH_PREFIX: usize = 4; // Stores the size of the string.
const MAX_TOPIC_LENGTH: usize = 50 * 4; // 50 chars max.
const MAX_CONTENT_LENGTH: usize = 280 * 4; // 280 chars max.

#[derive(Accounts)]
pub struct CreateUser<'info> {
    #[account(init, payer = user, space = 8 + 40)]
    pub user_account: Account<'info, User>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct User {
    pub user: Pubkey,
}

#[derive(Accounts)]
pub struct FollowUser<'info> {
    #[account(init,payer=user,space=Following::LEN)]
    pub account: Account<'info, Following>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct Following {
    pub user: Pubkey,
    pub message_type: String,
    pub following_user: Pubkey,
}

#[derive(Accounts)]
pub struct SendMessage<'info> {
    #[account(init,payer=author,space = Message::LEN  )]
    pub message_account: Account<'info, Message>,
    #[account(mut)]
    pub author: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct Message {
    pub author: Pubkey,
    pub message_type: String,
    pub timestamp: i64,
    pub topic: String,
    pub content: String,
}

impl Following {
    const LEN: usize = DISCRIMINATOR_LENGTH
        + PUBLIC_KEY_LENGTH
        + EPOCH_TYPE_LENGTH_PREFIX
        + EPOCH_TYPE_LENGTH
        + PUBLIC_KEY_LENGTH;
}

impl Message {
    const LEN: usize = DISCRIMINATOR_LENGTH
        + PUBLIC_KEY_LENGTH
        + EPOCH_TYPE_LENGTH_PREFIX
        + EPOCH_TYPE_LENGTH
        + TIMESTAMP_LENGTH
        + STRING_LENGTH_PREFIX
        + MAX_TOPIC_LENGTH
        + MAX_CONTENT_LENGTH;
}

#[error]
pub enum ErrorCode {
    #[msg("The provided topic should be 50 characters long maximum.")]
    TopicTooLong,
    #[msg("The provided content should be 280 characters long maximum.")]
    ContentTooLong,
}
