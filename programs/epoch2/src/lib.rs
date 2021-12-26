use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod epoch2 {
    use super::*;
    // Initialize a new account
    pub fn send_message(ctx: Context<SendMessage>, content: String) -> ProgramResult {
        let message = &mut ctx.accounts.message;
        let author: &Signer = &ctx.accounts.user;
        let clock: Clock = Clock::get().unwrap();
        if content.chars().count() > 280 {
            return Err(ErrorCode::ContentTooLong.into());
        }
        message.content = content;
        message.author = *author.key;
        message.timestamp = clock.unix_timestamp;
        message.topic = String::from("unknown");
        Ok(())
    }
}

const DISCRIMINATOR_LENGTH: usize = 8;
const PUBLIC_KEY_LENGTH: usize = 32;
const TIMESTAMP_LENGTH: usize = 8;
const STRING_LENGTH_PREFIX: usize = 4; // Stores the size of the string.
const MAX_TOPIC_LENGTH: usize = 50 * 4; // 50 chars max.
const MAX_CONTENT_LENGTH: usize = 280 * 4; // 280 chars max.

#[derive(Accounts)]
pub struct SendMessage<'info> {
    #[account(init,payer=user,space = Message::LEN  )]
    pub message: Account<'info, Message>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct Message {
    pub author: Pubkey,
    pub timestamp: i64,
    pub topic: String,
    pub content: String,
}

impl Message {
    const LEN: usize = DISCRIMINATOR_LENGTH
        + PUBLIC_KEY_LENGTH
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
